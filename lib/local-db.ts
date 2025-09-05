import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to load expo-sqlite at runtime. Don't import at top-level so Metro bundler
// won't error if the native module isn't installed (common in web or bare setups).
let SQLite: any = null;
try {
  // use a variable require so packager doesn't statically analyze it
  // @ts-ignore
  const pkgName = 'expo-sqlite';
  // @ts-ignore
  SQLite = require(pkgName);
} catch (e) {
  SQLite = null;
}

const DB_NAME = 'rptas.db';
let db: any = null;
if (SQLite) {
  // Handle both CommonJS and transpiled ES module shapes
  const candidate = (SQLite && typeof SQLite.openDatabase === 'function')
    ? SQLite
    : (SQLite && SQLite.default && typeof SQLite.default.openDatabase === 'function')
      ? SQLite.default
      : null;

  if (candidate) {
    try {
      db = candidate.openDatabase(DB_NAME);
    } catch (e) {
      console.warn('expo-sqlite openDatabase failed', e);
      db = null;
    }
  } else {
    console.info('expo-sqlite present but openDatabase() not found; falling back to AsyncStorage');
  }
}

// Fallback keys for AsyncStorage-based persistence when SQLite isn't available
const FALLBACK_KEY = 'assessments_fallback_v1';

export function initDB() {
  if (!db) return Promise.resolve();
  return new Promise<void>((resolve) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS assessments (
          local_id INTEGER PRIMARY KEY AUTOINCREMENT,
          remote_id TEXT,
          created_at TEXT,
          data TEXT,
          synced INTEGER DEFAULT 0
        );`
      );
    }, (err: any) => {
      console.error('initDB error', err);
      resolve();
    }, () => resolve());
  });
}

function execSql<T = any>(sql: string, params: any[] = []) {
  if (!db) return Promise.reject(new Error('SQLite not available'));
  return new Promise<T>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve(result as unknown as T),
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    }, (txErr: any) => reject(txErr));
  });
}

export async function saveAssessment(entry: { createdAt: string; data: any }) {
  if (db) {
    const sql = `INSERT INTO assessments (created_at, data, synced) VALUES (?, ?, 0);`;
    const params = [entry.createdAt, JSON.stringify(entry.data)];
    const res: any = await execSql(sql, params);
    const insertId = res.insertId ?? null;
    return insertId;
  }

  // Fallback: store in AsyncStorage array
  const raw = await AsyncStorage.getItem(FALLBACK_KEY);
  const list = raw ? JSON.parse(raw) as any[] : [];
  const localId = Date.now();
  list.push({ local_id: localId, remote_id: null, created_at: entry.createdAt, data: entry.data, synced: 0 });
  await AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify(list));
  return localId;
}

/** Update an existing local assessment's data by local_id. Resets synced=0. */
export async function updateAssessment(localId: number, data: any) {
  if (db) {
    const sql = `UPDATE assessments SET data = ?, synced = 0 WHERE local_id = ?;`;
    await execSql(sql, [JSON.stringify(data), localId]);
    return;
  }

  const raw = await AsyncStorage.getItem(FALLBACK_KEY);
  const list = raw ? JSON.parse(raw) as any[] : [];
  const idx = list.findIndex((r: any) => r.local_id === localId);
  if (idx >= 0) {
    list[idx].data = data;
    list[idx].synced = 0;
    await AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify(list));
  } else {
    // If not found, create a new record with provided id semantics (rare case)
    list.push({ local_id: localId, remote_id: null, created_at: new Date().toISOString(), data, synced: 0 });
    await AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify(list));
  }
}

export async function getPendingAssessments() {
  if (db) {
    const sql = `SELECT * FROM assessments WHERE synced = 0;`;
    const res: any = await execSql(sql);
    const rows = (res.rows && res.rows._array) ? res.rows._array : [];
    return rows.map((r: any) => ({
      local_id: r.local_id,
      remote_id: r.remote_id,
      created_at: r.created_at,
      data: JSON.parse(r.data),
      synced: !!r.synced
    }));
  }

  const raw = await AsyncStorage.getItem(FALLBACK_KEY);
  const list = raw ? JSON.parse(raw) as any[] : [];
  // Only include unsynced
  const pending = list.filter((r: any) => !r.synced || r.synced === 0);
  return pending.map((r: any) => ({
    local_id: r.local_id,
    remote_id: r.remote_id ?? null,
    created_at: r.created_at,
    data: r.data,
    synced: !!r.synced
  }));
}

export async function markAssessmentSynced(localId: number, remoteId?: string) {
  if (db) {
    const sql = `UPDATE assessments SET synced = 1, remote_id = ? WHERE local_id = ?;`;
    await execSql(sql, [remoteId || null, localId]);
    return;
  }

  const raw = await AsyncStorage.getItem(FALLBACK_KEY);
  const list = raw ? JSON.parse(raw) as any[] : [];
  const idx = list.findIndex((r: any) => r.local_id === localId);
  if (idx >= 0) {
    list[idx].synced = 1;
    list[idx].remote_id = remoteId ?? null;
    await AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify(list));
  }
}

export async function syncPending(apiUrl: string) {
  if (!apiUrl) throw new Error('No API URL provided for sync');
  const pending = await getPendingAssessments();
  for (const row of pending) {
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdAt: row.created_at, data: row.data }),
      });
      if (resp.ok) {
        const json = await resp.json();
        const remoteId = json?.id ?? null;
        await markAssessmentSynced(row.local_id, remoteId);
      }
    } catch (err) {
      console.warn('sync error for local', row.local_id, err);
    }
  }
}

/** Delete a local assessment by its local_id. Works with SQLite or AsyncStorage fallback. */
export async function deleteAssessment(localId: number | string) {
  const idNum = typeof localId === 'string' ? Number(localId) : localId;
  if (db) {
    const sql = `DELETE FROM assessments WHERE local_id = ?;`;
    try {
      await execSql(sql, [idNum]);
    } catch (err) {
      console.warn('deleteAssessment (sqlite) failed', err);
      throw err;
    }
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(FALLBACK_KEY);
    const list = raw ? JSON.parse(raw) as any[] : [];
    const filtered = list.filter((r: any) => (r.local_id !== idNum && String(r.local_id) !== String(idNum)));
    await AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('deleteAssessment (fallback) failed', err);
    throw err;
  }
}

export async function getAllAssessments() {
  if (db) {
    const sql = `SELECT * FROM assessments ORDER BY local_id DESC;`;
    const res: any = await execSql(sql);
    const rows = (res.rows && res.rows._array) ? res.rows._array : [];
    return rows.map((r: any) => ({
      local_id: r.local_id,
      remote_id: r.remote_id,
      created_at: r.created_at,
      data: JSON.parse(r.data),
      synced: !!r.synced,
    }));
  }

  const raw = await AsyncStorage.getItem(FALLBACK_KEY);
  const list = raw ? JSON.parse(raw) as any[] : [];
  // sort by descending local_id (Date-based ids for fallback)
  list.sort((a: any, b: any) => (b.local_id || 0) - (a.local_id || 0));
  return list.map((r: any) => ({
    local_id: r.local_id,
    remote_id: r.remote_id ?? null,
    created_at: r.created_at,
    data: r.data,
    synced: !!r.synced,
  }));
}

export async function getAssessmentById(localId: number) {
  if (db) {
    const sql = `SELECT * FROM assessments WHERE local_id = ? LIMIT 1;`;
    const res: any = await execSql(sql, [localId]);
    const rows = (res.rows && res.rows._array) ? res.rows._array : [];
    const r = rows[0];
    if (!r) return null;
    return {
      local_id: r.local_id,
      remote_id: r.remote_id,
      created_at: r.created_at,
      data: JSON.parse(r.data),
      synced: !!r.synced,
    };
  }

  const raw = await AsyncStorage.getItem(FALLBACK_KEY);
  const list = raw ? JSON.parse(raw) as any[] : [];
  const found = list.find((it: any) => it.local_id === localId);
  if (!found) return null;
  return {
    local_id: found.local_id,
    remote_id: found.remote_id ?? null,
    created_at: found.created_at,
    data: found.data,
    synced: !!found.synced,
  };
}

