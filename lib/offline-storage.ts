import { saveAssessment, getAssessmentById, updateAssessment, markAssessmentSynced, getPendingAssessments } from './local-db';
import { uploadBuildingImages, createAssessmentDocument, ensureSession } from './appwrite';

export type OfflinePropertyData = {
  street?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  buildingImages: string[]; // may contain file:// or content:// URIs
  price?: number;
};

export type SyncedPropertyData = {
  street?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  buildingImages: string[]; // normalized http(s) URLs
  localBuildingImages?: string[]; // local file:// URIs for offline access
  price?: number;
  syncedAt: string; // ISO timestamp
};

async function toAssessmentSchema(data: OfflinePropertyData, imageUrls: string[]) {
  return {
    owner_details: {},
    building_location: {
      street: data.street,
      barangay: data.barangay,
      municipality: data.municipality,
      province: data.province,
      buildingImages: imageUrls,
    },
    land_reference: {},
    general_description: {},
    structural_materials: {},
    // Store price under property_appraisal to keep it visible remotely (schema accepts JSON blob)
    property_appraisal: { price: data.price },
    property_assessment: {},
    additionalItems: { items: [], subTotal: 0, total: 0 },
  } as any;
}

export const OfflineStorage = {
  // Save raw offline data with local file:// paths
  async saveOffline(data: OfflinePropertyData) {
    const createdAt = new Date().toISOString();
    const localId = await saveAssessment({ createdAt, data });
    return { localId, createdAt };
  },

  // Sync a single offline record: upload images, update local row to http URLs, mark synced, and optionally create a remote doc
  async syncOne(localId: number | string, opts?: { createRemote?: boolean }) {
    const idNum = typeof localId === 'string' ? Number(localId) : localId;
    const row = await getAssessmentById(idNum as number);
    if (!row) throw new Error('Offline record not found');
    const data = row.data as OfflinePropertyData;
    const uploadResults = await uploadBuildingImages(data?.buildingImages || []);
    const syncedAt = new Date().toISOString();
    const merged: SyncedPropertyData = {
      street: data.street,
      barangay: data.barangay,
      municipality: data.municipality,
      province: data.province,
      buildingImages: uploadResults.urls,
      localBuildingImages: uploadResults.localUris, // Keep local URIs for offline access
      price: data.price,
      syncedAt,
    };
    await updateAssessment(idNum as number, merged);

    let remoteId: string | undefined;
    if (opts?.createRemote !== false) {
      try {
        await ensureSession();
        const payload = await toAssessmentSchema(data, uploadResults.urls);
        const created = await createAssessmentDocument({ data: payload });
        remoteId = (created as any)?.$id;
      } catch (_) {
        // Remote creation is optional; keep local update regardless
      }
    }
    await markAssessmentSynced(idNum as number, remoteId);
    return { localId: idNum, remoteId, data: merged };
  },

  // Sync all unsynced records
  async syncAll() {
    const pending = await getPendingAssessments();
    const total = pending.length;
    const results: Array<{ localId: number; ok: boolean; remoteId?: string; error?: string }> = [];
    let synced = 0;
    for (const row of pending) {
      try {
        const res = await OfflineStorage.syncOne(row.local_id);
        results.push({ localId: row.local_id, ok: true, remoteId: res.remoteId });
        synced++;
      } catch (e: any) {
        results.push({ localId: row.local_id, ok: false, error: e?.message || String(e) });
      }
    }
    return { synced, total, results };
  },
};

export default OfflineStorage;
