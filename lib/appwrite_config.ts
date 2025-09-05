// Deprecated file: do not put API keys or secrets in client code.
// This re-exports the configured Appwrite client and helpers from lib/appwrite.ts
// which reads EXPO_PUBLIC_* env vars and is safe for React Native.

export {
    client as appwriteClient,
    account,
    databases,
    storage,
    config as appwriteConfig,
    createAssessmentDocument,
    syncPendingToAppwrite,
} from './appwrite';