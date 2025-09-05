import OfflineStorageDefault, { OfflinePropertyData, SyncedPropertyData } from './offline-storage';
import { syncAllOfflineData as appwriteSyncAll, syncWithProgress, uploadBuildingImages } from './appwrite';

export type SyncProgress = { stage: string; current?: number; total?: number; message?: string };

export const OfflineStorage = OfflineStorageDefault;

export const SyncManager = {
  // Upload images first, then create remote doc, with progress
  async syncPropertyData(offlineData: OfflinePropertyData, onProgress?: (p: SyncProgress) => void) {
    return syncWithProgress(offlineData as any, onProgress);
  },

  // Sync all local unsynced items to Appwrite
  async syncAllOfflineData(onProgress?: (p: SyncProgress) => void) {
    return appwriteSyncAll(onProgress);
  },

  // If you only need the URLs (without creating a doc yet)
  async uploadImagesOnly(localPaths: string[]) {
    return uploadBuildingImages(localPaths);
  }
};

export default { OfflineStorage, SyncManager };
