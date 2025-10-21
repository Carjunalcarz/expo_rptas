import {
  Client,
  Account,
  ID,
  Databases,
  OAuthProvider,
  Avatars,
  Query,
  Storage,
  Permission,
  Role,
} from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";
import * as FileSystem from 'expo-file-system';
import { getPendingAssessments, markAssessmentSynced } from "./local-db";
import { FaasPrintService } from "../components/FaasPrintService";

export const config = {
  platform: "com.ajncarz.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  publicEndpoint: process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  galleriesCollectionId:
  process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  propertiesCollectionId:
  process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
  assessmentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ASSESSMENTS_COLLECTION_ID,
  // If true, never persist local file:// content:// data: asset: URIs to DB; drop them when upload fails
  strictRemoteMedia: String(process.env.EXPO_PUBLIC_STRICT_REMOTE_MEDIA || '').toLowerCase() === 'true',
};

export const client = new Client();

// Initialize client when core fields are present; individual features check their own IDs.
const isConfigured = Boolean(
  config.endpoint &&
  config.projectId &&
  config.platform &&
  config.bucketId // Make sure bucket ID is required for configuration
);

// Log configuration status
console.log('Appwrite configuration:', {
  hasEndpoint: Boolean(config.endpoint),
  hasProjectId: Boolean(config.projectId),
  hasPlatform: Boolean(config.platform),
  hasBucketId: Boolean(config.bucketId),
  endpoint: config.endpoint,
  projectId: config.projectId,
  bucketId: config.bucketId
});

try {
  if (isConfigured) {
    client
      .setEndpoint(String(config.endpoint))
      .setProject(String(config.projectId))
      .setPlatform(String(config.platform));
    
    // Set SSL verification mode for development
    // Note: setSelfSigned is not available in react-native-appwrite SDK.
    // SSL verification cannot be disabled in this SDK.
  } else {
    console.warn(
      "Appwrite config missing (EXPO_PUBLIC_* env). Skipping Appwrite initialization; features will return empty results."
    );
  }
} catch (e) {
  console.warn("Appwrite initialization failed; continuing in offline mode", e);
}

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// OAuth2 login with Google (DISABLED - using anonymous sessions instead)
// To re-enable Google Auth, uncomment this function and update ensureSession()
export async function loginWithGoogle() {
  if (!isConfigured) {
    console.warn("loginWithGoogle() called but Appwrite is not configured");
    return false;
  }
  try {
    const redirectUri = Linking.createURL("/");

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );
    if (!response) throw new Error("Create OAuth2 token failed");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );
    if (browserResult.type !== "success")
      throw new Error("Create OAuth2 token failed");

    const url = new URL(browserResult.url);
    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();
    if (!secret || !userId) throw new Error("Create OAuth2 token failed");

    const session = await account.createSession(userId, secret);
    if (!session) throw new Error("Failed to create session");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Email/Password authentication functions
export async function createAccount(email: string, password: string, name: string) {
  if (!isConfigured) {
    console.warn("createAccount() called but Appwrite is not configured");
    return { success: false, error: "Appwrite not configured" };
  }
  try {
    const user = await account.create(ID.unique(), email, password, name);
    console.log('Account created successfully:', user.$id);
    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to create account:', error);
    return { success: false, error: error?.message || 'Failed to create account' };
  }
}

export async function loginWithEmail(email: string, password: string) {
  if (!isConfigured) {
    console.warn("loginWithEmail() called but Appwrite is not configured");
    return { success: false, error: "Appwrite not configured" };
  }
  try {
    const session = await account.createEmailPasswordSession(email, password);
    console.log('Email login successful:', session.userId);
    return { success: true, session };
  } catch (error: any) {
    console.error('Failed to login with email:', error);
    return { success: false, error: error?.message || 'Failed to login' };
  }
}

// Simple login function for backward compatibility (now uses existing account)
export async function login() {
  // Use your existing Appwrite account
  const defaultEmail = "user@example.com";
  const defaultPassword = "password";
  const defaultName = "RPTAS User";
  
  if (!isConfigured) {
    console.warn("login() called but Appwrite is not configured");
    return false;
  }
  
  try {
    // First try to login with existing account
    const loginResult = await loginWithEmail(defaultEmail, defaultPassword);
    if (loginResult.success) {
      console.log('Logged in with existing account');
      return true;
    }
    
    // If login fails, try to create account
    console.log('Login failed, trying to create account...');
    const createResult = await createAccount(defaultEmail, defaultPassword, defaultName);
    if (createResult.success) {
      // Now login with the newly created account
      const loginResult2 = await loginWithEmail(defaultEmail, defaultPassword);
      if (loginResult2.success) {
        console.log('Account created and logged in successfully');
        return true;
      }
    }
    
    console.error('Failed to login or create account');
    return false;
  } catch (error) {
    console.error('Login process failed:', error);
    return false;
  }
}

export async function logout() {
  if (!isConfigured) {
    console.warn("logout() called but Appwrite is not configured");
    return false;
  }
  try {
    const result = await account.deleteSession("current");
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Quick diagnostics for Storage/session health
export async function storageHealth() {
  const info: any = {
    configured: isConfigured,
    endpoint: config.endpoint,
    projectId: config.projectId,
    bucketId: config.bucketId,
    session: false,
    canList: false,
    error: undefined as undefined | string,
  };
  try {
    const me = await ensureSession();
    info.session = !!me;
  } catch (e: any) {
    info.error = `ensureSession: ${e?.message || String(e)}`;
  }
  if (config.bucketId) {
    try {
      // @ts-ignore listFiles signature allows limit as 3rd arg in node sdk; RN wrapper accepts options
      const res = await (storage as any).listFiles(String(config.bucketId), undefined, 1);
      info.canList = !!res;
    } catch (e: any) {
      info.error = `listFiles: ${e?.message || String(e)}`;
    }
  }
  return info;
}

// Debug single upload to see exact error response
export async function uploadSingleForDebug(uri: string) {
  try {
    const res = await uploadFileFromUriWithRetry(uri, 1);
    return { ok: true, url: res.url };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function getCurrentUser() {
  if (!isConfigured) {
    return null;
  }
  try {
    const result = await account.get();
    // console.log("Current user:", result);
    if (result.$id) {
      // Create a nice default avatar using Appwrite's avatar service
      // This creates a colorful avatar with the user's initials
      const userAvatar = avatar.getInitials(
        result.name,
        100, // width
        100  // height
      );

      return {
        ...result,
        avatar: userAvatar.toString(),
        emailVerification: result.emailVerification || false, // Ensure emailVerification is included
      };
    }

    return null;
  } catch (error) {
  // No active session yet — handled by ensureSession()/login flows
  console.info('Appwrite: no active session');
    return null;
  }
}

// Guess a basic mime type from URI extension
function guessMime(uri: string) {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

// Upload a local image/file URI to Appwrite Storage; returns { fileId, url, localUri }
// Convert file to base64
async function convertToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw new Error('Failed to convert file to base64');
  }
}

async function uploadFileFromUri(uri: string) {
  if (!config.bucketId) throw new Error('Missing APPWRITE bucket env');
  
  // Store the original local URI
  const localUri = uri;
  
  // Ensure we have a valid session (anonymous or authenticated)
  let userId: string;
  try { 
    const session = await ensureSession();
    console.log('Session verified:', Boolean(session));
    
    if (!session || !session.$id) {
      throw new Error('Failed to create session for upload');
    }
    
    userId = session.$id;
    console.log('Upload session ready for user:', userId);
  } catch (e) {
    console.error('Session creation failed:', e);
    throw new Error('Failed to create session for upload. Please check your Appwrite configuration.');
  }

  // Verify storage is initialized
  if (!storage) {
    console.error('Storage instance not initialized');
    throw new Error('Storage not initialized');
  }

  try {
    // Extract filename and determine mime type
    const name = (uri.split('/').pop() || 'upload').split('?')[0];
    const type = guessMime(uri);
    console.log('Converting file to base64:', { name, type });

    // Convert image to base64
    const base64Data = await convertToBase64(uri);
    console.log('File converted to base64 successfully');

    // Create file input for Appwrite
    const file = {
      name,
      type,
      size: Math.ceil(base64Data.length * 0.75), // Estimate size from base64
      uri: `data:${type};base64,${base64Data}`,
    };
    
    // Verify bucket exists
    if (!config.bucketId) {
      console.error('Bucket ID is not configured');
      throw new Error('Storage bucket not configured');
    }

    console.log('Preparing to upload base64 file:', { name, type });

    // Set permissions using the exact format Appwrite expects
    console.log('Setting permissions for user:', userId);
    const permissions = [
      // Allow any user to read
      Permission.read(Role.any()),
      // Allow the owner to read and write
      Permission.read(Role.user(userId)),
      Permission.write(Role.user(userId))
    ];

    // Create file in Appwrite storage with additional error handling
    let created;
    try {
      created = await storage.createFile(
        String(config.bucketId),
        ID.unique(),
        file,
        permissions
      );
    } catch (uploadError) {
      console.error('Storage createFile failed:', uploadError);
      throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    
    if (!created) {
      console.error('No response from createFile');
      throw new Error('File creation failed - no response from server');
    }

    if (!created.$id) {
      console.error('Created file missing ID:', created);
      throw new Error('File creation failed - no file ID returned');
    }

    const fileId = created.$id;
    console.log('File uploaded successfully:', { fileId, created });
    
    // Generate a view URL (public or via session)
    const url = storage.getFileView(String(config.bucketId), fileId).toString();
    console.log('Generated view URL:', { url });
    
    return { fileId, url, localUri };
  } catch (e) {
    console.error('Failed to upload file:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to upload file: ${errorMessage}`);
  }
}

// Retry wrapper for upload with simple backoff
async function uploadFileFromUriWithRetry(uri: string, maxAttempts = 3) {
  let attempt = 0;
  let lastErr: any;
  // Proactively ensure session once before attempting
  try { await ensureSession(); } catch {}
  while (attempt < maxAttempts) {
    try {
      const result = await uploadFileFromUri(uri);
      // Always return the Appwrite URL as the primary URL, but keep the local URI
      return {
        url: result.url,
        fileId: result.fileId,
        localUri: result.localUri
      };
    } catch (e) {
      lastErr = e;
      attempt++;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  throw lastErr;
}

// Try to extract bucketId and fileId from an Appwrite Storage URL
function extractAppwriteFileIds(urlStr: string): { bucketId: string; fileId: string } | null {
  try {
    const u = new URL(urlStr);
    const m = u.pathname.match(/\/storage\/buckets\/([^/]+)\/files\/([^/]+)\//);
    if (m && m[1] && m[2]) {
      return { bucketId: m[1], fileId: m[2] };
    }
  } catch {}
  return null;
}

// Ensure an existing Appwrite file is publicly readable
async function ensurePublicFromUrl(urlStr: string): Promise<boolean> {
  const ids = extractAppwriteFileIds(urlStr);
  if (!ids) return false;
  try {
    // Prefer explicit permission update when available
    // @ts-ignore: method exists in Appwrite SDK
    if (typeof (storage as any).updateFilePermissions === 'function') {
      await (storage as any).updateFilePermissions(ids.bucketId, ids.fileId, [Permission.read(Role.any())]);
      return true;
    }
  } catch {}
  try {
    // Fallback: updateFile supports permissions as the 3rd/4th arg in RN SDK
    // @ts-ignore: permissive signature
    await (storage as any).updateFile(ids.bucketId, ids.fileId, undefined, [Permission.read(Role.any())]);
    return true;
  } catch (_) {
    return false;
  }
}

// Build a fresh view URL for a given Appwrite file using current endpoint
function buildViewUrl(bucketId: string, fileId: string): string {
  const raw = storage.getFileView(bucketId, fileId).toString();
  try {
    if (config.publicEndpoint) {
      const u = new URL(raw);
      const pub = new URL(String(config.publicEndpoint));
      // Keep path/query from SDK, swap only scheme/host/port
      u.protocol = pub.protocol;
      u.hostname = pub.hostname;
      u.port = pub.port;
      return u.toString();
    }
  } catch {}
  return raw;
}

// Public helper: normalize any Appwrite file URL to the current endpoint
export function normalizeAppwriteFileUrl(urlStr: string): string {
  const ids = extractAppwriteFileIds(urlStr);
  if (!ids) return urlStr;
  try {
    // Extract cache-busting parameters if they exist
    const url = new URL(urlStr);
    const cacheBustingParams = [];
    
    // Preserve cache-busting parameters
    if (url.searchParams.has('v')) cacheBustingParams.push(`v=${url.searchParams.get('v')}`);
    if (url.searchParams.has('r')) cacheBustingParams.push(`r=${url.searchParams.get('r')}`);
    if (url.searchParams.has('fresh')) cacheBustingParams.push(`fresh=${url.searchParams.get('fresh')}`);
    
    // Build base URL
    const baseUrl = buildViewUrl(ids.bucketId, ids.fileId);
    
    // Add cache-busting parameters back if they existed
    if (cacheBustingParams.length > 0) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}${cacheBustingParams.join('&')}`;
    }
    
    return baseUrl;
  } catch {
    return urlStr;
  }
}

function isLocalUri(u?: string) {
  if (!u) return false;
  const lower = u.toLowerCase();
  return lower.startsWith('file:') || lower.startsWith('content:') || lower.startsWith('data:') || lower.startsWith('asset:');
}

function isHttpUri(u?: string) {
  if (!u) return false;
  const lower = u.toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}

// Ensure there is an active session. Uses email/password authentication.
export async function ensureSession() {
  if (!isConfigured) return null;
  
  try {
    // Check if we already have an active session
    const me = await account.get();
    console.log('Existing session found for user:', me.$id);
    return me;
  } catch (_) {
    // No existing session, try to login with default account
    console.log('No existing session, trying to login...');
  }
  
  try {
    // Try to login using the default login function
    const loginSuccess = await login();
    if (loginSuccess) {
      const me = await account.get();
      console.log('Session created successfully for user:', me.$id);
      return me;
    } else {
      console.warn('Failed to create session via login');
      return null;
    }
  } catch (e) {
    console.warn('Failed to create session:', e);
    return null;
  }
}

export async function getLatestProperties() {
  if (!isConfigured) {
    console.info("getLatestProperties(): Appwrite not configured; returning []");
    return [] as any[];
  }
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)]
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  if (!isConfigured) {
    console.info("getProperties(): Appwrite not configured; returning []");
    return [] as any[];
  }
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("type", filter));

    if (query)
      buildQuery.push(
        Query.or([
          Query.search("name", query),
          Query.search("address", query),
          Query.search("type", query),
        ])
      );

    if (limit) buildQuery.push(Query.limit(limit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// write function to get property by id
export async function getPropertyById({ id }: { id: string }) {
  if (!isConfigured) {
    console.info("getPropertyById(): Appwrite not configured; returning null");
    return null;
  }
  try {
    const result = await databases.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      id
    );
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Create an assessment document using flattened fields + JSON blobs
// SIMPLIFIED VERSION: Only uses assessments table - no separate owners/locations tables
export async function createAssessmentDocument(params: {
  data: any; // AssessmentFormData
  clientLocalId?: number | string;
  createdAt?: string; // ISO
  userId?: string;
}) {
  if (!isConfigured) {
    throw new Error("Appwrite not configured");
  }
  if (!config.databaseId || !config.assessmentsCollectionId) {
    throw new Error("Missing APPWRITE database/assessments collection env");
  }

  const { data, clientLocalId, createdAt, userId } = params;

  const owner = data?.owner_details || {};
  const loc = data?.building_location || {};
  const propertyAssessment = data?.property_assessment || {};
  const propertyAppraisal = data?.property_appraisal || {};
  const gd = data?.general_description || {};

  // Upload images if a bucket is configured; replace local URIs with storage URLs
  let safeGD = { ...gd } as any;
  if (Array.isArray(gd?.floorPlanImages) && gd.floorPlanImages.length) {
    const uploadedUrls: string[] = [];
    for (const uri of gd.floorPlanImages) {
      if (typeof uri === 'string' && uri) {
        try {
          if (config.bucketId && (uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('data:') || uri.startsWith('asset:'))) {
            const { url } = await uploadFileFromUriWithRetry(uri);
            uploadedUrls.push(url);
          } else if (config.bucketId && uri.startsWith('http')) {
            // Remote http image — optional: re-upload; else keep as-is
            uploadedUrls.push(uri);
          } else {
            if (!config.strictRemoteMedia) uploadedUrls.push(uri);
          }
        } catch {
          if (!config.strictRemoteMedia) uploadedUrls.push(uri);
        }
      }
    }
    safeGD.floorPlanImages = uploadedUrls;
  }

  // Also handle property_appraisal.gallery: [{ image: uri }]
  let safePA = { ...propertyAppraisal } as any;
  if (Array.isArray((propertyAppraisal as any)?.gallery)) {
    const newGallery: any[] = [];
    for (const item of (propertyAppraisal as any).gallery) {
      const uri = item?.image;
      if (typeof uri === 'string' && uri) {
        try {
          if (config.bucketId && (uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('data:') || uri.startsWith('asset:'))) {
            const { url } = await uploadFileFromUriWithRetry(uri);
            newGallery.push({ ...item, image: url });
          } else if (config.bucketId && uri.startsWith('http')) {
            newGallery.push({ ...item, image: uri });
          } else {
            if (!config.strictRemoteMedia) newGallery.push({ ...item });
          }
        } catch {
          if (!config.strictRemoteMedia) newGallery.push({ ...item });
        }
      } else {
        newGallery.push(item);
      }
    }
    safePA.gallery = newGallery;
  }

  // Handle building_location images: buildingImages[], images[], image
  let safeLoc = { ...loc } as any;
  if (Array.isArray(loc?.buildingImages)) {
    const out: any[] = [];
    for (const it of loc.buildingImages) {
      let uri: string | undefined;
      if (typeof it === 'string') uri = it; else if (it && typeof it === 'object') uri = it.uri || it.url || it.image || it.src;
    if (uri && config.bucketId && isLocalUri(uri)) {
  try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { if (!config.strictRemoteMedia) out.push(uri); }
    } else if (uri) { if (!config.strictRemoteMedia || isHttpUri(uri)) out.push(uri); }
    }
    safeLoc.buildingImages = out;
  }
  if (Array.isArray(loc?.images)) {
    const out: any[] = [];
    for (const it of loc.images) {
      let uri: string | undefined;
      if (typeof it === 'string') uri = it; else if (it && typeof it === 'object') uri = it.uri || it.url || it.image || it.src;
    if (uri && config.bucketId && isLocalUri(uri)) {
  try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { if (!config.strictRemoteMedia) out.push(uri); }
    } else if (uri) { if (!config.strictRemoteMedia || isHttpUri(uri)) out.push(uri); }
    }
    safeLoc.images = out;
  }
  if (loc?.image) {
    let uri: string | undefined;
    const it = loc.image;
    if (typeof it === 'string') uri = it; else if (it && typeof it === 'object') uri = it.uri || it.url || it.image || it.src;
    if (uri && config.bucketId && isLocalUri(uri)) {
  try { const { url } = await uploadFileFromUriWithRetry(uri); safeLoc.image = url; } catch { if (!config.strictRemoteMedia) safeLoc.image = uri; }
    } else if (uri) { if (!config.strictRemoteMedia || isHttpUri(uri)) safeLoc.image = uri; }
  }

  // Owner ID images
  let safeOwner = { ...owner } as any;
  if (Array.isArray(owner?.validIdImages)) {
    const out: string[] = [];
    for (const uri of owner.validIdImages) {
      if (typeof uri === 'string' && uri) {
  if (config.bucketId && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { if (!config.strictRemoteMedia) out.push(uri); } }
        else if (!config.strictRemoteMedia || isHttpUri(uri)) out.push(uri);
      }
    }
    safeOwner.validIdImages = out;
  }
  if (owner?.administratorBeneficiary && Array.isArray(owner.administratorBeneficiary.validIdImages)) {
    const out: string[] = [];
    for (const uri of owner.administratorBeneficiary.validIdImages) {
      if (typeof uri === 'string' && uri) {
  if (config.bucketId && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { if (!config.strictRemoteMedia) out.push(uri); } }
        else if (!config.strictRemoteMedia || isHttpUri(uri)) out.push(uri);
      }
    }
    safeOwner.administratorBeneficiary = { ...(owner.administratorBeneficiary || {}), validIdImages: out };
  }

  // Generate TDN/ARD ID first, then generate PDF with the final ID

  // Generate TDN/ARD ID during sync to ensure accurate count
  let finalTdArp = owner.tdArp || '';
  
  // Check if TDN/ARD ID needs count digit added (offline format: YY-MM-BB)
  const needsCountDigit = finalTdArp && finalTdArp.split('-').length === 3;
  
  if ((loc.municipality && loc.barangay) && (!finalTdArp || needsCountDigit)) {
    try {
      // Query existing records for this municipality-barangay combination
      // Note: This is for a new document, so no need to exclude current document
      const existingRecords = await databases.listDocuments(
        String(config.databaseId),
        String(config.assessmentsCollectionId),
        [
          Query.equal('municipality', loc.municipality),
          Query.equal('barangay', loc.barangay),
          Query.limit(1000) // Adjust limit as needed
        ]
      );

      // Extract all existing TDN/ARD IDs and get their count numbers
      const existingIds = new Set<string>();
      const existingCounts = new Set<number>();
      
      existingRecords.documents.forEach((doc: any) => {
        if (doc.tdArp) {
          existingIds.add(doc.tdArp);
          // Extract count from TDN format: YY-MM-BB-CC
          const parts = doc.tdArp.split('-');
          if (parts.length === 4) {
            const count = parseInt(parts[3], 10);
            if (!isNaN(count)) {
              existingCounts.add(count);
            }
          }
        }
      });

      // Find the next available count number
      let nextCount = 1;
      while (existingCounts.has(nextCount)) {
        nextCount++;
      }

      // Municipality codes mapping
      const municipalityList = [
        { name: "Buenavista", code: "01" },
        { name: "Cabadbaran", code: "02" },
        { name: "Carmen", code: "03" },
        { name: "Jabonga", code: "04" },
        { name: "Kitcharao", code: "05" },
        { name: "Las Nieves", code: "06" },
        { name: "Magallanes", code: "07" },
        { name: "Nasipit", code: "08" },
        { name: "Remedios T. Romualdez", code: "09" },
        { name: "Santiago", code: "10" },
        { name: "Tubay", code: "11" }
      ];

      // Barangay mapping
      const barangaySuggestion: { [key: string]: string[] } = {
        "Buenavista": [
          "Abilan", "Agong-ong", "Alubijid", "Guinabsan", "Lower Olave",
          "Macalang", "Malapong", "Malpoc", "Manapa", "Matabao",
          "Poblacion 1", "Poblacion 2", "Poblacion 3", "Poblacion 4",
          "Poblacion 5", "Poblacion 6", "Poblacion 7", "Poblacion 8",
          "Poblacion 9", "Poblacion 10", "Rizal", "Sacol", "Sangay",
          "Simbalan", "Talo-ao"
        ],
        "Cabadbaran": [
          "Antonio Luna", "Bay-ang", "Bayabas", "Caasinan", "Cabinet",
          "Calamba", "Calibunan", "Comagascas", "Concepcion", "Del Pilar",
          "Katugasan", "Kauswagan", "La Union", "Mabini", "Mahaba",
          "Poblacion 1", "Poblacion 2", "Poblacion 3", "Poblacion 4",
          "Poblacion 5", "Poblacion 6", "Poblacion 7", "Poblacion 8",
          "Poblacion 9", "Poblacion 10", "Poblacion 11", "Poblacion 12",
          "Puting Bato", "Sanghan", "Soriano", "Tolosa"
        ],
        "Carmen": [
          "Cahayagan", "Gosoon", "Manoligao", "Poblacion", "Rojales",
          "San Agustin", "Tagcatong", "Vinapor"
        ],
        "Jabonga": [
          "A. Beltran", "Baleguian", "Bangonay", "Bunga", "Colorado",
          "Cuyago", "Libas", "Magdagooc", "Magsaysay", "Maraiging",
          "Poblacion", "San Jose", "San Pablo", "San Vicente", "Santo Niño"
        ],
        "Kitcharao": [
          "Bangayan", "Canaway", "Crossing", "Hinimbangan", "Jaliobong",
          "Mahayahay", "Poblacion", "San Isidro", "San Roque", "Sangay",
          "Songkoy"
        ],
        "Las Nieves": [
          "Ambacon", "Balungagan", "Bonifacio", "Casiklan", "Consorcia",
          "Durian", "Eduardo G. Montilla", "Ibuan", "Katipunan", "Lingayao",
          "Malicato", "Maningalao", "Marcos Calo", "Mat-i", "Pinana-an",
          "Poblacion", "Rosario", "San Isidro", "San Roque", "Tinucoran"
        ],
        "Magallanes": [
          "Buhang", "Caloc-an", "Guiasan", "Marcos", "Poblacion",
          "Santo Niño", "Santo Rosario", "Taod-oy"
        ],
        "Nasipit": [
          "Aclan", "Amontay", "Ata-atahon", "Barangay 1", "Barangay 2",
          "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6",
          "Barangay 7", "Camagong", "Cubi-cubi", "Culit", "Jaguimitan",
          "Kinabjangan", "Punta", "Santa Ana", "Talisay", "Triangulo"
        ],
        "Remedios T. Romualdez": [
          "Balangbalang", "Basilisa", "Humilog", "Panaytayon",
          "Poblacion I", "Poblacion II", "San Antonio", "Tagbongabong"
        ],
        "Santiago": [
          "Curva", "Estanislao Morgado", "Jagupit", "La Paz",
          "Pangaylan-IP", "Poblacion I", "Poblacion II", "San Isidro",
          "Tagbuyacan"
        ],
        "Tubay": [
          "Binuangan", "Cabayawa", "Doña Rosario", "Doña Telesfora",
          "La Fraternidad", "Lawigan", "Poblacion 1", "Poblacion 2",
          "Santa Ana", "Tagmamarkay", "Tagpangahoy", "Tinigbasan", "Victory"
        ]
      };

      const currentYear = new Date().getFullYear();
      const revisionYear = currentYear.toString().slice(-2);
      
      const municipalityInfo = municipalityList.find(m => m.name === loc.municipality);
      if (municipalityInfo) {
        const barangayList = barangaySuggestion[loc.municipality];
        if (barangayList) {
          const barangayIndex = barangayList.indexOf(loc.barangay);
          if (barangayIndex !== -1) {
            const barangayCode = String(barangayIndex + 1).padStart(2, '0');
            const countCode = String(nextCount).padStart(2, '0');
            
            if (needsCountDigit) {
              // Add count digit to existing offline TDN/ARD ID
              finalTdArp = `${finalTdArp}-${countCode}`;
              console.log(`Added count digit to offline TDN/ARD ID: ${finalTdArp} (count: ${nextCount})`);
            } else {
              // Generate complete TDN/ARD ID from scratch
              finalTdArp = `${revisionYear}-${municipalityInfo.code}-${barangayCode}-${countCode}`;
              console.log(`Generated complete TDN/ARD ID during sync: ${finalTdArp} (count: ${nextCount})`);
            }
            
            // Double-check that this ID doesn't already exist
            if (existingIds.has(finalTdArp)) {
              // If somehow it exists, increment until we find a unique one
              let attempts = 0;
              while (existingIds.has(finalTdArp) && attempts < 100) {
                nextCount++;
                const newCountCode = String(nextCount).padStart(2, '0');
                if (needsCountDigit) {
                  // Replace the count part for offline ID
                  const baseParts = owner.tdArp.split('-');
                  finalTdArp = `${baseParts.join('-')}-${newCountCode}`;
                } else {
                  finalTdArp = `${revisionYear}-${municipalityInfo.code}-${barangayCode}-${newCountCode}`;
                }
                attempts++;
              }
              console.log(`Resolved TDN/ARD ID collision: ${finalTdArp} (attempt ${attempts})`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to generate TDN/ARD ID during sync:', error);
      // Keep the original tdArp if generation fails
    }
  }

  // Update the owner data with the final TDN/ARD ID
  const updatedOwner = { ...safeOwner, tdArp: finalTdArp };

  // Auto-generate PDF with the final TDN/ARD ID
  let faasPdfUrl = '';
  
  // Temporary flag to disable PDF generation during sync if needed
  const ENABLE_PDF_GENERATION = true; // Set to false to disable PDF generation during sync
  
  if (ENABLE_PDF_GENERATION) {
    try {
      console.log('🔄 Auto-generating FAAS PDF during sync with final TDN/ARD ID...');
      
      // Create assessment object in the format expected by FaasPrintService
      const assessmentForPdf = {
        ownerName: owner.owner || '',
        owner_details: updatedOwner, // Use updatedOwner with final TDN/ARD ID
        building_location: safeLoc,
        land_reference: {
          ...(typeof data?.land_reference === 'string' ? JSON.parse(data.land_reference) : (data?.land_reference || {})),
          superseded_assessment: data?.superseded_assessment || {},
          memoranda: data?.memoranda || {}
        },
        general_description: safeGD,
        structural_materials: data?.structural_materials || {},
        property_appraisal: safePA,
        property_assessment: propertyAssessment,
        additionalItems: data?.additionalItems || { items: [], subTotal: 0, total: 0 },
        superseded_assessment: data?.superseded_assessment || {},
        memoranda: data?.memoranda || {},
        pin: owner.pin || '',
        tdArp: finalTdArp, // Use final TDN/ARD ID with count digit
        transactionCode: owner.transactionCode || '',
        barangay: loc.barangay || '',
        municipality: loc.municipality || '',
        province: loc.province || ''
      };
      
      // Generate and upload PDF to Appwrite Storage (silent mode for sync)
      const pdfResult = await FaasPrintService.generatePDFForSync(assessmentForPdf);
      
      if (pdfResult.success && pdfResult.url) {
        faasPdfUrl = pdfResult.url;
        console.log('✅ FAAS PDF auto-generated with final TDN/ARD ID:', faasPdfUrl);
      } else {
        console.warn('⚠️ PDF generation failed during sync:', pdfResult.error);
      }
    } catch (pdfError) {
      console.warn('⚠️ Failed to auto-generate PDF during sync:', pdfError);
      // Continue with sync even if PDF generation fails
    }
  } else {
    console.log('📄 PDF generation disabled during sync');
  }

  const doc: any = {
    clientLocalId: clientLocalId ? String(clientLocalId) : undefined,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: userId || undefined,
    synced: true,

    ownerName: owner.owner || '',
    transactionCode: owner.transactionCode || '',
    tdArp: finalTdArp,
    pin: owner.pin || '',
    barangay: loc.barangay || '',
    municipality: loc.municipality || '',
    province: loc.province || '',

    marketValueTotal: Number(propertyAssessment?.market_value || 0),
    taxable: (propertyAssessment?.taxable ?? 1) === 1,
    effYear: propertyAssessment?.eff_year || String(new Date().getFullYear()),
    effQuarter: propertyAssessment?.eff_quarter || 'QTR1',
    totalArea: Number(propertyAssessment?.total_area || gd?.totalFloorArea || 0),
    additionalItem: data?.additionalItem || '',
    
    // Store superseded status only - all details are in JSON
    isSuperseded: !!(data?.superseded_assessment?.pin || data?.superseded_assessment?.previousOwner),
    
    // Store the auto-generated FAAS PDF URL with history in the existing faas field
    faas: JSON.stringify({
      current: faasPdfUrl,
      history: faasPdfUrl ? [{
        url: faasPdfUrl,
        timestamp: new Date().toISOString(),
        version: 1,
        action: 'created',
        tdArp: finalTdArp // Store TDN/ARD ID with this version
      }] : []
    }),

  // JSON blobs are stored as strings per schema
  owner_details: JSON.stringify(updatedOwner || {}),
  building_location: JSON.stringify(safeLoc || {}),
  land_reference: JSON.stringify({
    ...(typeof data?.land_reference === 'string' ? JSON.parse(data.land_reference) : (data?.land_reference || {})),
    superseded_assessment: data?.superseded_assessment || {},
    memoranda: data?.memoranda || {}
  }),
  general_description: JSON.stringify(safeGD || {}),
  structural_materials: JSON.stringify(data?.structural_materials || {}),
  property_appraisal: JSON.stringify(safePA || {}),
  property_assessment: JSON.stringify(propertyAssessment || {}),
  additionalItems: JSON.stringify(data?.additionalItems || { items: [], subTotal: 0, total: 0 }),
  };

  // Remove undefined to avoid attribute validation issues
  Object.keys(doc).forEach((k) => {
    if (doc[k] === undefined) delete doc[k];
  });

  // SIMPLIFIED: Only use assessments table - no separate owners/locations tables
  // All owner and location data is stored as JSON in the assessment document itself
  // This eliminates the need for separate table management and relationships

  const result = await databases.createDocument(
    String(config.databaseId),
    String(config.assessmentsCollectionId),
    ID.unique(),
    doc
  );
  return result;
}

// Sync all pending local assessments to Appwrite using SIMPLIFIED approach (assessments table only)
export async function syncPendingToAppwrite(opts?: { userId?: string }) {
  const pending = await getPendingAssessments();
  const results: { local_id: number; remote_id?: string; ok: boolean; error?: any }[] = [];
  
  for (const row of pending) {
    try {
      // Use the simplified createAssessmentDocument (no owners/locations tables)
      const created = await createAssessmentDocument({
        data: row.data,
        clientLocalId: row.local_id,
        createdAt: row.created_at,
        userId: opts?.userId,
      });
      await markAssessmentSynced(row.local_id, created?.$id);
      results.push({ local_id: row.local_id, remote_id: created?.$id, ok: true });
    } catch (err) {
      console.warn('Appwrite sync failed for', row.local_id, err);
      results.push({ local_id: row.local_id, ok: false, error: (err as any)?.message || String(err) });
    }
  }
  return results;
}

// List assessment documents from Appwrite
export async function listAssessmentDocuments() {
  if (!isConfigured) throw new Error('Appwrite not configured');
  if (!config.databaseId || !config.assessmentsCollectionId) throw new Error('Missing APPWRITE database/assessments collection env');
  const res = await databases.listDocuments(String(config.databaseId), String(config.assessmentsCollectionId), [Query.orderDesc('$createdAt')]);

  // Normalize Appwrite URLs and drop local file:// entries for display safety
  const norm = (docs: any[]) => docs.map((d) => {
    const tryParse = (s?: string) => { try { return s ? JSON.parse(s) : undefined; } catch { return undefined; } };
    const loc = tryParse(d.building_location) || {};
    const gd = tryParse(d.general_description) || {};
    const pa = tryParse(d.property_appraisal) || {};
    const owner = tryParse(d.owner_details) || {};

    const normStr = (u?: string) => {
      if (!u) return u;
      // Keep local URIs so the original device can still display them
      if (isLocalUri(u)) return u;
      return isHttpUri(u) ? normalizeAppwriteFileUrl(u) : u;
    };
  const normArr = (arr?: any[]) => Array.isArray(arr) ? arr.map((it) => {
      const u = typeof it === 'string' ? it : (it?.uri || it?.url || it?.image || it?.src);
      const out = normStr(u);
      return out;
    }).filter(Boolean) : arr;

    if (Array.isArray(loc.buildingImages)) loc.buildingImages = normArr(loc.buildingImages);
    if (Array.isArray(loc.images)) loc.images = normArr(loc.images);
    if (loc.image) loc.image = normStr(typeof loc.image === 'string' ? loc.image : (loc.image?.uri || loc.image?.url || loc.image?.image || loc.image?.src));
    if (Array.isArray(gd.floorPlanImages)) gd.floorPlanImages = normArr(gd.floorPlanImages);
    if (Array.isArray(pa.gallery)) pa.gallery = (pa.gallery as any[]).map((g) => ({ ...g, image: normStr(g?.image) })).filter((g) => !!g.image);
    if (Array.isArray(owner.validIdImages)) owner.validIdImages = normArr(owner.validIdImages);
    if (owner.administratorBeneficiary && Array.isArray(owner.administratorBeneficiary.validIdImages)) owner.administratorBeneficiary.validIdImages = normArr(owner.administratorBeneficiary.validIdImages);

    return {
      ...d,
      building_location: JSON.stringify(loc),
      general_description: JSON.stringify(gd),
      property_appraisal: JSON.stringify(pa),
      owner_details: JSON.stringify(owner),
    };
  });

  return norm(res.documents);
}

// Get a single assessment document
export async function getAssessmentDocument(id: string) {
  if (!isConfigured) throw new Error('Appwrite not configured');
  if (!config.databaseId || !config.assessmentsCollectionId) throw new Error('Missing APPWRITE database/assessments collection env');
  const d = await databases.getDocument(String(config.databaseId), String(config.assessmentsCollectionId), id);
  // Apply the same normalization as list for single fetches
  const tryParse = (s?: string) => { try { return s ? JSON.parse(s) : undefined; } catch { return undefined; } };
  const loc = tryParse((d as any).building_location) || {};
  const gd = tryParse((d as any).general_description) || {};
  const pa = tryParse((d as any).property_appraisal) || {};
  const owner = tryParse((d as any).owner_details) || {};
  const normStr = (u?: string) => { if (!u) return u; if (isLocalUri(u)) return u; return isHttpUri(u) ? normalizeAppwriteFileUrl(u) : u; };
  const normArr = (arr?: any[]) => Array.isArray(arr) ? arr.map((it) => {
    const u = typeof it === 'string' ? it : (it?.uri || it?.url || it?.image || it?.src);
    const out = normStr(u);
    return out;
  }).filter(Boolean) : arr;
  if (Array.isArray(loc.buildingImages)) loc.buildingImages = normArr(loc.buildingImages);
  if (Array.isArray(loc.images)) loc.images = normArr(loc.images);
  if (loc.image) loc.image = normStr(typeof loc.image === 'string' ? loc.image : (loc.image?.uri || loc.image?.url || loc.image?.image || loc.image?.src));
  if (Array.isArray(gd.floorPlanImages)) gd.floorPlanImages = normArr(gd.floorPlanImages);
  if (Array.isArray(pa.gallery)) pa.gallery = (pa.gallery as any[]).map((g) => ({ ...g, image: normStr(g?.image) })).filter((g) => !!g.image);
  if (Array.isArray(owner.validIdImages)) owner.validIdImages = normArr(owner.validIdImages);
  if (owner.administratorBeneficiary && Array.isArray(owner.administratorBeneficiary.validIdImages)) owner.administratorBeneficiary.validIdImages = normArr(owner.administratorBeneficiary.validIdImages);

  return {
    ...d,
    building_location: JSON.stringify(loc),
    general_description: JSON.stringify(gd),
    property_appraisal: JSON.stringify(pa),
    owner_details: JSON.stringify(owner),
  } as any;
}

// Update an assessment document with the same shaping rules (uploads + stringified JSON)
export async function updateAssessmentDocument(id: string, params: { data: any; userId?: string }) {
  if (!isConfigured) throw new Error('Appwrite not configured');
  if (!config.databaseId || !config.assessmentsCollectionId) throw new Error('Missing APPWRITE database/assessments collection env');
  const { data, userId } = params;

  const owner = data?.owner_details || {};
  const loc = data?.building_location || {};
  const pa = data?.property_assessment || {};
  const gd = data?.general_description || {};

  // Upload images and replace
  let safeGD = { ...gd } as any;
  if (Array.isArray(gd?.floorPlanImages) && gd.floorPlanImages.length) {
    const uploadedUrls: string[] = [];
    for (const uri of gd.floorPlanImages) {
      if (typeof uri === 'string' && uri) {
        try {
          if (config.bucketId && isLocalUri(uri)) {
            const { url } = await uploadFileFromUriWithRetry(uri);
            uploadedUrls.push(url);
          } else {
            uploadedUrls.push(uri);
          }
        } catch {
          uploadedUrls.push(uri);
        }
      }
    }
    safeGD.floorPlanImages = uploadedUrls;
  }

  let safePA = { ...(data?.property_appraisal || {}) } as any;
  if (Array.isArray((safePA as any)?.gallery)) {
    const newGallery: any[] = [];
    for (const item of (safePA as any).gallery) {
      const uri = item?.image;
      if (typeof uri === 'string' && uri) {
        try {
          if (config.bucketId && isLocalUri(uri)) {
            const { url } = await uploadFileFromUriWithRetry(uri);
            newGallery.push({ ...item, image: url });
          } else {
            newGallery.push({ ...item });
          }
        } catch {
          newGallery.push({ ...item });
        }
      } else {
        newGallery.push(item);
      }
    }
    safePA.gallery = newGallery;
  }

  // Handle building_location images on update as well
  let safeLoc = { ...loc } as any;
  if (Array.isArray(loc?.buildingImages)) {
    const out: any[] = [];
    for (const it of loc.buildingImages) {
      let uri: string | undefined;
      if (typeof it === 'string') uri = it; else if (it && typeof it === 'object') uri = it.uri || it.url || it.image || it.src;
  if (uri && config.bucketId && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { out.push(uri); } }
      else if (uri) out.push(uri);
    }
    safeLoc.buildingImages = out;
  }
  if (Array.isArray(loc?.images)) {
    const out: any[] = [];
    for (const it of loc.images) {
      let uri: string | undefined;
      if (typeof it === 'string') uri = it; else if (it && typeof it === 'object') uri = it.uri || it.url || it.image || it.src;
  if (uri && config.bucketId && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { out.push(uri); } }
      else if (uri) out.push(uri);
    }
    safeLoc.images = out;
  }
  if (loc?.image) {
    let uri: string | undefined;
    const it = loc.image;
    if (typeof it === 'string') uri = it; else if (it && typeof it === 'object') uri = it.uri || it.url || it.image || it.src;
  if (uri && config.bucketId && isLocalUri(uri)) { try { const { url, localUri } = await uploadFileFromUriWithRetry(uri); safeLoc.image = url; safeLoc.localImage = localUri; } catch { safeLoc.image = uri; safeLoc.localImage = uri; } }
    else if (uri) safeLoc.image = uri;
  }

  // Owner ID images on update
  let safeOwner = { ...owner } as any;
  if (Array.isArray(owner?.validIdImages)) {
    const out: string[] = [];
    for (const uri of owner.validIdImages) {
      if (typeof uri === 'string' && uri) {
  if (config.bucketId && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { out.push(uri); } }
        else out.push(uri);
      }
    }
    safeOwner.validIdImages = out;
  }
  if (owner?.administratorBeneficiary && Array.isArray(owner.administratorBeneficiary.validIdImages)) {
    const out: string[] = [];
    for (const uri of owner.administratorBeneficiary.validIdImages) {
      if (typeof uri === 'string' && uri) {
  if (config.bucketId && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { out.push(uri); } }
        else out.push(uri);
      }
    }
    safeOwner.administratorBeneficiary = { ...(owner.administratorBeneficiary || {}), validIdImages: out };
  }

  // Generate TDN/ARD ID during update if needed
  let finalTdArp = owner.tdArp || '';
  
  // Check if TDN/ARD ID needs count digit added (offline format: YY-MM-BB)
  const needsCountDigit = finalTdArp && finalTdArp.split('-').length === 3;
  const isAlreadyComplete = finalTdArp && finalTdArp.split('-').length === 4;
  
  console.log('TDN/ARD ID Update Check:', {
    originalTdArp: owner.tdArp,
    finalTdArp,
    needsCountDigit,
    isAlreadyComplete,
    shouldProcess: (loc.municipality && loc.barangay) && (!finalTdArp || needsCountDigit)
  });
  
  if ((loc.municipality && loc.barangay) && (!finalTdArp || needsCountDigit)) {
    try {
      // Query existing records for this municipality-barangay combination
      // Exclude current document from count
      const existingRecords = await databases.listDocuments(
        String(config.databaseId),
        String(config.assessmentsCollectionId),
        [
          Query.equal('municipality', loc.municipality),
          Query.equal('barangay', loc.barangay),
          Query.notEqual('$id', id), // Exclude current document
          Query.limit(1000)
        ]
      );

      // Extract all existing TDN/ARD IDs and get their count numbers
      const existingIds = new Set<string>();
      const existingCounts = new Set<number>();
      
      existingRecords.documents.forEach((doc: any) => {
        if (doc.tdArp) {
          existingIds.add(doc.tdArp);
          // Extract count from TDN format: YY-MM-BB-CC
          const parts = doc.tdArp.split('-');
          if (parts.length === 4) {
            const count = parseInt(parts[3], 10);
            if (!isNaN(count)) {
              existingCounts.add(count);
            }
          }
        }
      });

      // Find the next available count number
      let nextCount = 1;
      while (existingCounts.has(nextCount)) {
        nextCount++;
      }

      // Municipality codes mapping
      const municipalityList = [
        { name: "Buenavista", code: "01" },
        { name: "Cabadbaran", code: "02" },
        { name: "Carmen", code: "03" },
        { name: "Jabonga", code: "04" },
        { name: "Kitcharao", code: "05" },
        { name: "Las Nieves", code: "06" },
        { name: "Magallanes", code: "07" },
        { name: "Nasipit", code: "08" },
        { name: "Remedios T. Romualdez", code: "09" },
        { name: "Santiago", code: "10" },
        { name: "Tubay", code: "11" }
      ];

      // Barangay mapping
      const barangaySuggestion: { [key: string]: string[] } = {
        "Buenavista": ["Abilan", "Agong-ong", "Alubijid", "Guinabsan", "Lower Olave", "Macalang", "Malapong", "Malpoc", "Manapa", "Matabao", "Poblacion 1", "Poblacion 2", "Poblacion 3", "Poblacion 4", "Poblacion 5", "Poblacion 6", "Poblacion 7", "Poblacion 8", "Poblacion 9", "Poblacion 10", "Rizal", "Sacol", "Sangay", "Simbalan", "Talo-ao"],
        "Cabadbaran": ["Antonio Luna", "Bay-ang", "Bayabas", "Caasinan", "Cabinet", "Calamba", "Calibunan", "Comagascas", "Concepcion", "Del Pilar", "Katugasan", "Kauswagan", "La Union", "Mabini", "Mahaba", "Poblacion 1", "Poblacion 2", "Poblacion 3", "Poblacion 4", "Poblacion 5", "Poblacion 6", "Poblacion 7", "Poblacion 8", "Poblacion 9", "Poblacion 10", "Poblacion 11", "Poblacion 12", "Puting Bato", "Sanghan", "Soriano", "Tolosa"],
        "Carmen": ["Cahayagan", "Gosoon", "Manoligao", "Poblacion", "Rojales", "San Agustin", "Tagcatong", "Vinapor"],
        "Jabonga": ["A. Beltran", "Baleguian", "Bangonay", "Bunga", "Colorado", "Cuyago", "Libas", "Magdagooc", "Magsaysay", "Maraiging", "Poblacion", "San Jose", "San Pablo", "San Vicente", "Santo Niño"],
        "Kitcharao": ["Bangayan", "Canaway", "Crossing", "Hinimbangan", "Jaliobong", "Mahayahay", "Poblacion", "San Isidro", "San Roque", "Sangay", "Songkoy"],
        "Las Nieves": ["Ambacon", "Balungagan", "Bonifacio", "Casiklan", "Consorcia", "Durian", "Eduardo G. Montilla", "Ibuan", "Katipunan", "Lingayao", "Malicato", "Maningalao", "Marcos Calo", "Mat-i", "Pinana-an", "Poblacion", "Rosario", "San Isidro", "San Roque", "Tinucoran"],
        "Magallanes": ["Buhang", "Caloc-an", "Guiasan", "Marcos", "Poblacion", "Santo Niño", "Santo Rosario", "Taod-oy"],
        "Nasipit": ["Aclan", "Amontay", "Ata-atahon", "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7", "Camagong", "Cubi-cubi", "Culit", "Jaguimitan", "Kinabjangan", "Punta", "Santa Ana", "Talisay", "Triangulo"],
        "Remedios T. Romualdez": ["Balangbalang", "Basilisa", "Humilog", "Panaytayon", "Poblacion I", "Poblacion II", "San Antonio", "Tagbongabong"],
        "Santiago": ["Curva", "Estanislao Morgado", "Jagupit", "La Paz", "Pangaylan-IP", "Poblacion I", "Poblacion II", "San Isidro", "Tagbuyacan"],
        "Tubay": ["Binuangan", "Cabayawa", "Doña Rosario", "Doña Telesfora", "La Fraternidad", "Lawigan", "Poblacion 1", "Poblacion 2", "Santa Ana", "Tagmamarkay", "Tagpangahoy", "Tinigbasan", "Victory"]
      };

      const currentYear = new Date().getFullYear();
      const revisionYear = currentYear.toString().slice(-2);
      
      const municipalityInfo = municipalityList.find(m => m.name === loc.municipality);
      if (municipalityInfo) {
        const barangayList = barangaySuggestion[loc.municipality];
        if (barangayList) {
          const barangayIndex = barangayList.indexOf(loc.barangay);
          if (barangayIndex !== -1) {
            const barangayCode = String(barangayIndex + 1).padStart(2, '0');
            const countCode = String(nextCount).padStart(2, '0');
            
            if (needsCountDigit) {
              // Add count digit to existing offline TDN/ARD ID
              finalTdArp = `${finalTdArp}-${countCode}`;
              console.log(`Added count digit to offline TDN/ARD ID during update: ${finalTdArp} (count: ${nextCount})`);
            } else {
              // Generate complete TDN/ARD ID from scratch
              finalTdArp = `${revisionYear}-${municipalityInfo.code}-${barangayCode}-${countCode}`;
              console.log(`Generated complete TDN/ARD ID during update: ${finalTdArp} (count: ${nextCount})`);
            }
            
            // Double-check that this ID doesn't already exist
            if (existingIds.has(finalTdArp)) {
              // If somehow it exists, increment until we find a unique one
              let attempts = 0;
              while (existingIds.has(finalTdArp) && attempts < 100) {
                nextCount++;
                const newCountCode = String(nextCount).padStart(2, '0');
                if (needsCountDigit) {
                  // Replace the count part for offline ID
                  const baseParts = owner.tdArp.split('-');
                  finalTdArp = `${baseParts.join('-')}-${newCountCode}`;
                } else {
                  finalTdArp = `${revisionYear}-${municipalityInfo.code}-${barangayCode}-${newCountCode}`;
                }
                attempts++;
              }
              console.log(`Resolved TDN/ARD ID collision during update: ${finalTdArp} (attempt ${attempts})`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to generate TDN/ARD ID during update:', error);
      // Keep the original tdArp if generation fails
    }
  }

  // Update safeOwner with the final TDN/ARD ID
  safeOwner.tdArp = finalTdArp;

  // Auto-regenerate PDF and upload to Appwrite Storage when updating
  let faasPdfUrl = '';
  
  // Check if PDF regeneration should be enabled (can be controlled by environment variable)
  const ENABLE_PDF_REGENERATION = true; // Set to false to disable PDF regeneration during updates
  
  // Get existing assessment to check for current PDF (declare outside try-catch for broader scope)
  let existingAssessment: any = null;
  
  if (ENABLE_PDF_REGENERATION) {
    try {
      console.log('🔄 Auto-regenerating FAAS PDF during assessment update...');
      try {
        existingAssessment = await databases.getDocument(
          String(config.databaseId),
          String(config.assessmentsCollectionId),
          id
        );
      } catch (fetchError) {
        console.warn('⚠️ Could not fetch existing assessment for PDF overwrite:', fetchError);
      }
      
      // Create assessment object in the format expected by FaasPrintService
      const assessmentForPdf = {
        ownerName: owner.owner || '',
        owner_details: safeOwner, // safeOwner already updated with finalTdArp
        building_location: safeLoc,
        land_reference: {
          ...(typeof data?.land_reference === 'string' ? JSON.parse(data.land_reference) : (data?.land_reference || {})),
          superseded_assessment: data?.superseded_assessment || {},
          memoranda: data?.memoranda || {}
        },
        general_description: safeGD,
        structural_materials: data?.structural_materials || {},
        property_appraisal: safePA,
        property_assessment: pa,
        additionalItems: data?.additionalItems || { items: [], subTotal: 0, total: 0 },
        superseded_assessment: data?.superseded_assessment || {},
        memoranda: data?.memoranda || {},
        pin: owner.pin || '',
        tdArp: finalTdArp, // Use final TDN/ARD ID with count digit
        transactionCode: owner.transactionCode || '',
        barangay: loc.barangay || '',
        municipality: loc.municipality || '',
        province: loc.province || '',
        // Include existing PDF URL for overwrite detection
        faas: existingAssessment?.faas || ''
      };
      
      // Generate and upload PDF to Appwrite Storage (with overwrite capability)
      const pdfResult = await FaasPrintService.generatePDFForUpdate(assessmentForPdf, id);
      
      if (pdfResult.success && pdfResult.url) {
        faasPdfUrl = pdfResult.url;
        console.log('✅ FAAS PDF auto-regenerated and updated:', faasPdfUrl);
        console.log('💾 NEW PDF URL will be saved to assessment faas field');
      } else {
        console.warn('⚠️ PDF regeneration failed during update:', pdfResult.error);
        // Keep existing PDF URL if regeneration failed
        faasPdfUrl = existingAssessment?.faas || '';
        console.log('📄 Keeping existing PDF URL due to regeneration failure:', faasPdfUrl);
      }
    } catch (pdfError) {
      console.warn('⚠️ Failed to auto-regenerate PDF during update:', pdfError);
      // Continue with update even if PDF generation fails
    }
  } else {
    console.log('📄 PDF regeneration disabled during updates');
  }

  console.log('💾 FINAL TDN/ARD ID FOR UPDATE:', finalTdArp);
  
  const doc: any = {
    updatedAt: new Date().toISOString(),
    userId: userId || undefined,
    ownerName: owner.owner || '',
    transactionCode: owner.transactionCode || '',
    tdArp: finalTdArp,
    pin: owner.pin || '',
    barangay: loc.barangay || '',
    municipality: loc.municipality || '',
    province: loc.province || '',
    marketValueTotal: Number(pa?.market_value || 0),
    taxable: (pa?.taxable ?? 1) === 1,
    effYear: pa?.eff_year || String(new Date().getFullYear()),
    effQuarter: pa?.eff_quarter || 'QTR1',
    totalArea: Number(pa?.total_area || gd?.totalFloorArea || 0),
    additionalItem: data?.additionalItem || '',
    // Store superseded status only - all details are in JSON
    isSuperseded: !!(data?.superseded_assessment?.pin || data?.superseded_assessment?.previousOwner),
    // Update FAAS with history in the existing faas field
    faas: (() => {
      try {
        // Parse existing faas data
        let existingFaasData: { current: string; history: Array<{url: string, timestamp: string, version: number, action: string}> } = { 
          current: '', 
          history: [] 
        };
        if (existingAssessment?.faas) {
          try {
            // Try to parse as new JSON format
            existingFaasData = JSON.parse(existingAssessment.faas);
          } catch {
            // Fallback: treat as old string format
            existingFaasData = {
              current: existingAssessment.faas,
              history: [{
                url: existingAssessment.faas,
                timestamp: existingAssessment.$updatedAt || existingAssessment.$createdAt || new Date().toISOString(),
                version: 1,
                action: 'created'
              }]
            };
          }
        }
        
        // If we generated a new PDF, add it to history
        if (faasPdfUrl && faasPdfUrl !== existingFaasData.current) {
          const newHistoryEntry = {
            url: faasPdfUrl,
            timestamp: new Date().toISOString(),
            version: existingFaasData.history.length + 1,
            action: 'updated',
            tdArp: finalTdArp // Store current TDN/ARD ID with this version
          };
          existingFaasData.history.push(newHistoryEntry);
          existingFaasData.current = faasPdfUrl;
          console.log('📄 Added new PDF to FAAS history:', newHistoryEntry);
        } else if (faasPdfUrl) {
          existingFaasData.current = faasPdfUrl;
        }
        
        return JSON.stringify(existingFaasData);
      } catch (error) {
        console.warn('⚠️ Error updating FAAS history:', error);
        // Fallback: create new structure with current PDF
        return JSON.stringify({
          current: faasPdfUrl || '',
          history: faasPdfUrl ? [{
            url: faasPdfUrl,
            timestamp: new Date().toISOString(),
            version: 1,
            action: 'updated',
            tdArp: finalTdArp
          }] : []
        });
      }
    })(),
    
    owner_details: JSON.stringify(safeOwner || {}),
    building_location: JSON.stringify(safeLoc || {}),
    land_reference: JSON.stringify({
      ...(typeof data?.land_reference === 'string' ? JSON.parse(data.land_reference) : (data?.land_reference || {})),
      superseded_assessment: data?.superseded_assessment || {},
      memoranda: data?.memoranda || {}
    }),
    general_description: JSON.stringify(safeGD || {}),
    structural_materials: JSON.stringify(data?.structural_materials || {}),
    property_appraisal: JSON.stringify(safePA || {}),
    property_assessment: JSON.stringify(pa || {}),
    additionalItems: JSON.stringify(data?.additionalItems || { items: [], subTotal: 0, total: 0 }),
  };
  Object.keys(doc).forEach((k) => { if (doc[k] === undefined) delete doc[k]; });
  
  // Log the PDF URL that will be saved to confirm it's the new one
  console.log('💾 SAVING TO DATABASE - Assessment ID:', id);
  console.log('💾 SAVING TO DATABASE - New FAAS PDF URL:', doc.faas);
  console.log('💾 SAVING TO DATABASE - PDF URL Length:', doc.faas?.length || 0);
  
  const res = await databases.updateDocument(String(config.databaseId), String(config.assessmentsCollectionId), id, doc);
  
  console.log('✅ DATABASE UPDATE COMPLETE - Assessment updated with new PDF URL');
  console.log('🔗 FINAL SAVED PDF URL:', res.faas);
  
  return res;
}

// Migration helpers: fix non-http image URIs in an existing document by uploading to Storage
export async function migrateAssessmentDocumentImages(id: string) {
  if (!isConfigured) throw new Error('Appwrite not configured');
  if (!config.databaseId || !config.assessmentsCollectionId) throw new Error('Missing APPWRITE database/assessments collection env');
  if (!config.bucketId) throw new Error('Missing APPWRITE bucket env');
  await ensureSession();
  const doc = await databases.getDocument(String(config.databaseId), String(config.assessmentsCollectionId), id);
  const parse = (s?: string) => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
  const owner = parse((doc as any).owner_details);
  const loc = parse((doc as any).building_location);
  const gd = parse((doc as any).general_description);
  const pa = parse((doc as any).property_appraisal);

  const fixList = async (items: any[], pick: (it:any)=>string|undefined) => {
    const out: any[] = [];
    for (const it of items || []) {
      const uri = pick(it);
      if (typeof uri === 'string') {
        if (isLocalUri(uri)) {
          try { const { url } = await uploadFileFromUriWithRetry(uri); out.push(url); } catch { out.push(uri); }
        } else {
          // If it's an Appwrite URL, try to make it public and normalize to current endpoint
          const ids = extractAppwriteFileIds(uri);
          if (ids) {
            try { await ensurePublicFromUrl(uri); } catch {}
            out.push(buildViewUrl(ids.bucketId, ids.fileId));
          } else {
            out.push(uri);
          }
        }
      }
    }
    return out;
  };

  if (Array.isArray(loc?.buildingImages)) {
    loc.buildingImages = await fixList(loc.buildingImages, (it) => typeof it === 'string' ? it : (it?.uri || it?.url || it?.image || it?.src));
  }
  if (Array.isArray(loc?.images)) {
    loc.images = await fixList(loc.images, (it) => typeof it === 'string' ? it : (it?.uri || it?.url || it?.image || it?.src));
  }
  if (loc?.image) {
    const uri = typeof loc.image === 'string' ? loc.image : (loc.image?.uri || loc.image?.url || loc.image?.image || loc.image?.src);
  if (uri && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); loc.image = url; } catch {} }
    else if (uri && isHttpUri(uri)) {
      const ids = extractAppwriteFileIds(uri);
      if (ids) { try { await ensurePublicFromUrl(uri); loc.image = buildViewUrl(ids.bucketId, ids.fileId); } catch {} }
    }
  }
  if (Array.isArray(gd?.floorPlanImages)) {
    gd.floorPlanImages = await fixList(gd.floorPlanImages, (it) => typeof it === 'string' ? it : (it?.uri || it?.url || it?.image || it?.src));
  }
  if (Array.isArray(pa?.gallery)) {
    pa.gallery = await Promise.all((pa.gallery as any[]).map(async (g) => {
      const uri = g?.image;
  if (typeof uri === 'string' && isLocalUri(uri)) { try { const { url } = await uploadFileFromUriWithRetry(uri); return { ...g, image: url }; } catch { return g; } }
      if (typeof uri === 'string' && isHttpUri(uri)) {
        const ids = extractAppwriteFileIds(uri);
        if (ids) { try { await ensurePublicFromUrl(uri); return { ...g, image: buildViewUrl(ids.bucketId, ids.fileId) }; } catch { return g; } }
      }
      return g;
    }));
  }
  if (Array.isArray(owner?.validIdImages)) {
    owner.validIdImages = await fixList(owner.validIdImages, (it) => typeof it === 'string' ? it : undefined);
  }
  if (owner?.administratorBeneficiary && Array.isArray(owner.administratorBeneficiary.validIdImages)) {
    owner.administratorBeneficiary.validIdImages = await fixList(owner.administratorBeneficiary.validIdImages, (it) => typeof it === 'string' ? it : undefined);
  }

  const update: any = {
    owner_details: JSON.stringify(owner || {}),
    building_location: JSON.stringify(loc || {}),
    general_description: JSON.stringify(gd || {}),
    property_appraisal: JSON.stringify(pa || {}),
  };
  return databases.updateDocument(String(config.databaseId), String(config.assessmentsCollectionId), id, update);
}

export async function migrateAllAssessmentImages(limit = 50) {
  if (!isConfigured) throw new Error('Appwrite not configured');
  if (!config.databaseId || !config.assessmentsCollectionId) throw new Error('Missing APPWRITE database/assessments collection env');
  const res = await databases.listDocuments(String(config.databaseId), String(config.assessmentsCollectionId), [Query.limit(limit)]);
  const out: { id: string; ok: boolean; error?: string }[] = [];
  for (const d of res.documents) {
    try { await migrateAssessmentDocumentImages(d.$id); out.push({ id: d.$id, ok: true }); }
    catch (e: any) { out.push({ id: d.$id, ok: false, error: e?.message || String(e) }); }
  }
  return out;
}

export async function deleteAssessmentDocument(id: string) {
  if (!isConfigured) throw new Error('Appwrite not configured');
  if (!config.databaseId || !config.assessmentsCollectionId) throw new Error('Missing APPWRITE database/assessments collection env');
  await databases.deleteDocument(String(config.databaseId), String(config.assessmentsCollectionId), id);
  return true;
}

// --- Convenience helpers matching the proposed upload-first sync pattern ---

// Upload a single image and return normalized URLs and metadata
export async function uploadImageToStorage(localImagePath: string, imageName?: string) {
  if (!config.bucketId) throw new Error('Missing APPWRITE bucket env');
  // If already remote, just normalize
  if (isHttpUri(localImagePath)) {
    const normalizedUrl = normalizeAppwriteFileUrl(localImagePath);
    return {
      url: normalizedUrl,
      localUri: localImagePath,
      uploaded: true
    };
  }
  // Upload local URIs
  try {
    const { url, localUri } = await uploadFileFromUriWithRetry(localImagePath);
    return {
      url: normalizeAppwriteFileUrl(url),
      localUri,
      uploaded: true
    };
  } catch (e) {
    console.warn('Failed to upload image:', e);
    return {
      url: localImagePath,
      localUri: localImagePath,
      uploaded: false
    };
  }
}

// Upload multiple images returning arrays of URLs and metadata
export async function uploadBuildingImages(
  localImagePaths: string[],
  onProgress?: (p: { stage: string; current?: number; total?: number; message?: string }) => void
) {
  const results = {
    urls: [] as string[],
    localUris: [] as string[],
    uploadStatus: [] as boolean[]
  };

  const total = (localImagePaths || []).length;
  for (let i = 0; i < total; i++) {
    const p = localImagePaths[i];
    try {
      onProgress?.({ 
        stage: 'uploading_images', 
        current: i + 1, 
        total, 
        message: `Uploading image ${i + 1} of ${total}` 
      });
      
      const result = await uploadImageToStorage(p, `building_image_${Date.now()}_${i}`);
      results.urls.push(result.url);
      results.localUris.push(result.localUri);
      results.uploadStatus.push(result.uploaded);
    } catch (e) {
      console.warn('Upload failed for image', i, e);
      // On failure, keep the local URI in both arrays
      results.urls.push(p);
      results.localUris.push(p);
      results.uploadStatus.push(false);
      
      onProgress?.({ 
        stage: 'uploading_images', 
        current: i + 1, 
        total, 
        message: `Failed to upload image ${i + 1}` 
      });
    }
  }
  return results;
}

// Minimal sync using our assessments schema; uploads images first, then writes a document
export async function syncPropertyData(
  offlineData: {
    street?: string;
    barangay?: string;
    municipality?: string;
    province?: string;
    buildingImages: string[];
  },
  onProgress?: (p: { stage: string; current?: number; total?: number; message?: string }) => void
) {
  try {
    if (!isConfigured) throw new Error('Appwrite not configured');
    const uploadResults = await uploadBuildingImages(offlineData.buildingImages || []);
    const data = {
      owner_details: {},
      building_location: {
        street: offlineData.street,
        barangay: offlineData.barangay,
        municipality: offlineData.municipality,
        province: offlineData.province,
        buildingImages: uploadResults.urls,
        localBuildingImages: uploadResults.localUris,
      },
      land_reference: {},
      general_description: {
        floorPlanDrawings: []
      },
      structural_materials: {},
      property_appraisal: {},
      property_assessment: {},
      additionalItems: { items: [], subTotal: 0, total: 0 },
    } as any;

    const doc = await createAssessmentDocument({ data });
    onProgress?.({ stage: 'complete', message: 'Successfully uploaded images and saved data' });
    return doc;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    onProgress?.({ stage: 'error', message: `Sync failed: ${errorMessage}` });
    throw e;
  }
}

// Sync with simple progress callbacks
export async function syncWithProgress(
  offlineData: {
    street?: string;
    barangay?: string;
    municipality?: string;
    province?: string;
    buildingImages: string[];
  },
  onProgress?: (p: { stage: string; current?: number; total?: number; message?: string }) => void
): Promise<any> {
  if (!isConfigured) {
    throw new Error('Appwrite not configured');
  }

  try {
    // First, ensure we have a valid Appwrite session
    await ensureSession();
    
    const paths = offlineData.buildingImages || [];
    const total = paths.length;
    
    if (total === 0) {
      onProgress?.({ stage: 'warning', message: 'No images to upload' });
      return null;
    }

    onProgress?.({ stage: 'uploading_images', current: 0, total, message: `Starting image uploads...` });
    
    const uploadResults = await uploadBuildingImages(paths, onProgress);
    
    // Check if any images were successfully uploaded
    const successfulUploads = uploadResults.uploadStatus.filter(status => status).length;
    if (successfulUploads === 0) {
      throw new Error('Failed to upload any images');
    }
    
    onProgress?.({ stage: 'saving_database', message: 'Saving data to database...' });
    
    // Only include successfully uploaded images in buildingImages array
    const successfulUrls = uploadResults.urls.filter((_, i) => uploadResults.uploadStatus[i]);
    
    const documentData = {
      owner_details: {},
      building_location: {
        street: offlineData.street,
        barangay: offlineData.barangay,
        municipality: offlineData.municipality,
        province: offlineData.province,
        buildingImages: successfulUrls,
        localBuildingImages: uploadResults.localUris
      },
      land_reference: {},
      general_description: {
        floorPlanDrawings: []
      },
      structural_materials: {},
      property_appraisal: {},
      property_assessment: {},
      additionalItems: { items: [], subTotal: 0, total: 0 }
    };

    onProgress?.({ stage: 'saving', message: 'Creating assessment document...' });
    const result = await createAssessmentDocument({ data: documentData });
    
    onProgress?.({ stage: 'complete', message: 'Successfully uploaded images and saved data' });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.({ stage: 'error', message: `Sync failed: ${errorMessage}` });
    throw error;
  }
}

// Sync all offline records (from local DB) with simple progress reporting
export async function syncAllOfflineData(
  onProgress?: (p: { stage: string; current?: number; total?: number; message?: string }) => void
) {
  if (!isConfigured) throw new Error('Appwrite not configured');
  await ensureSession();
  const pending = await getPendingAssessments();
  const total = pending.length;
  if (total === 0) {
    onProgress?.({ stage: 'idle', message: 'No data to sync' });
    return { success: true, synced: 0, total: 0, results: [] as any[] };
  }
  onProgress?.({ stage: 'processing', total, current: 0, message: `Syncing ${total} item(s)...` });
  const results: { success: boolean; local_id: number; remote_id?: string; error?: string }[] = [];
  let synced = 0;
  for (let i = 0; i < total; i++) {
    const row = pending[i];
    onProgress?.({ stage: 'uploading_images', current: i + 1, total, message: `Uploading images for item ${i + 1} of ${total}` });
    try {
      // createAssessmentDocument performs upload-first shaping and stores remote URLs
      const created = await createAssessmentDocument({ data: row.data, clientLocalId: row.local_id, createdAt: row.created_at });
      await markAssessmentSynced(row.local_id, created?.$id);
      results.push({ success: true, local_id: row.local_id, remote_id: created?.$id });
      synced++;
      onProgress?.({ stage: 'saving_database', current: i + 1, total, message: `Saved item ${i + 1} of ${total}` });
    } catch (e: any) {
      results.push({ success: false, local_id: row.local_id, error: e?.message || String(e) });
      onProgress?.({ stage: 'error', current: i + 1, total, message: `Failed item ${i + 1}: ${e?.message || e}` });
    }
  }
  onProgress?.({ stage: 'completed', message: `Sync completed: ${synced}/${total} item(s)` });
  return { success: true, synced, total, results };
}


