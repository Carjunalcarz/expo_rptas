import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { getCurrentUser as getAppwriteUser, createAccount as createAppwriteAccount, loginWithEmail as appwriteLogin, logout as appwriteLogout, ensureSession } from "./appwrite";

interface AppwriteUser {
  $id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAuthenticated: boolean;
  loginTime: string;
  appwriteId: string;
  isOfflineMode?: boolean;
}

interface OfflineCredentials {
  email: string;
  passwordHash: string; // Simple hash for offline verification
  userDetails: {
    id: string;
    name: string;
    avatar?: string;
    appwriteId: string;
  };
  lastVerified: string;
  isVerified: boolean;
}

// Storage keys
const SESSION_KEY = "@user_session";
const OFFLINE_CREDENTIALS_KEY = "@offline_credentials";
const LAST_ONLINE_VERIFICATION_KEY = "@last_online_verification";

// Simple hash function for offline password verification (not cryptographically secure)
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Save offline credentials for offline authentication
async function saveOfflineCredentials(email: string, password: string, userDetails: any, isVerified: boolean): Promise<void> {
  try {
    const credentials: OfflineCredentials = {
      email: email.toLowerCase(),
      passwordHash: simpleHash(password),
      userDetails: {
        id: userDetails.$id,
        name: userDetails.name,
        avatar: userDetails.avatar,
        appwriteId: userDetails.$id
      },
      lastVerified: new Date().toISOString(),
      isVerified
    };
    
    await AsyncStorage.setItem(OFFLINE_CREDENTIALS_KEY, JSON.stringify(credentials));
    console.log("✅ Offline credentials cached");
  } catch (error) {
    console.error("❌ Failed to save offline credentials:", error);
  }
}

// Get offline credentials
async function getOfflineCredentials(): Promise<OfflineCredentials | null> {
  try {
    const credentials = await AsyncStorage.getItem(OFFLINE_CREDENTIALS_KEY);
    return credentials ? JSON.parse(credentials) : null;
  } catch (error) {
    console.error("❌ Failed to get offline credentials:", error);
    return null;
  }
}

// Verify offline credentials
async function verifyOfflineCredentials(email: string, password: string): Promise<OfflineCredentials | null> {
  try {
    const credentials = await getOfflineCredentials();
    if (!credentials) return null;
    
    const emailMatch = credentials.email.toLowerCase() === email.toLowerCase();
    const passwordMatch = credentials.passwordHash === simpleHash(password);
    
    if (emailMatch && passwordMatch && credentials.isVerified) {
      console.log("✅ Offline credentials verified");
      return credentials;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Failed to verify offline credentials:", error);
    return null;
  }
}

// Check if we're in offline mode - improved detection
async function isOfflineMode(): Promise<boolean> {
  try {
    // Use a lightweight health check instead of login attempt
    const { config } = require('./appwrite');
    
    if (!config.endpoint) {
      console.log("🔍 No Appwrite endpoint configured");
      return true;
    }
    
    // Simple fetch to Appwrite health endpoint with timeout
    const healthUrl = `${config.endpoint}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // If we get any response (even 404), we're online
    console.log("🔍 Network health check - Status:", response.status);
    return false;
  } catch (error: any) {
    console.log("🔍 Network connectivity test error:", error?.message || error);
    
    // Check for specific network-related errors
    const errorMessage = error?.message?.toLowerCase() || '';
    const isNetworkError = 
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('failed to fetch') ||
      error?.code === 'NETWORK_ERROR' ||
      error?.name === 'TypeError';
    
    console.log("🔍 Is network error:", isNetworkError);
    return isNetworkError;
  }
}

// Login function using Appwrite authentication with offline support
export async function login(email: string, password: string): Promise<boolean> {
  try {
    console.log("🔐 Attempting login for:", email);
    
    // Check if we're offline first
    const offline = await isOfflineMode();
    console.log("🔍 Offline mode status:", offline);
    
    if (offline) {
      console.log("📱 Offline mode detected, checking cached credentials");
      
      // Try offline authentication
      const offlineCredentials = await verifyOfflineCredentials(email, password);
      if (offlineCredentials) {
        // Create offline session
        const session: UserSession = {
          id: offlineCredentials.userDetails.id,
          email: offlineCredentials.email,
          name: offlineCredentials.userDetails.name,
          avatar: offlineCredentials.userDetails.avatar,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
          appwriteId: offlineCredentials.userDetails.appwriteId,
          isOfflineMode: true
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log("✅ User logged in successfully (offline mode)");
        Alert.alert("Offline Login", "Logged in using cached credentials. Some features may be limited while offline.");
        return true;
      } else {
        console.log("❌ Offline credentials not found or invalid");
        Alert.alert("Offline Login Failed", "No cached credentials found or invalid credentials. Please connect to the internet to login for the first time.");
        return false;
      }
    }

    // Online mode - use Appwrite login
    console.log("🌐 Online mode detected, using Appwrite authentication");
    const result = await appwriteLogin(email, password);
    
    console.log("🔍 Appwrite login result:", {
      success: result.success,
      error: result.error,
      hasSession: !!result.session
    });
    
    if (!result.success) {
      console.log("❌ Appwrite login failed:", result.error);
      Alert.alert("Login Failed", `Authentication failed: ${result.error}`);
      
      // Fallback to offline if Appwrite fails but we have cached credentials
      const offlineCredentials = await verifyOfflineCredentials(email, password);
      if (offlineCredentials) {
        console.log("🔄 Falling back to offline mode");
        const session: UserSession = {
          id: offlineCredentials.userDetails.id,
          email: offlineCredentials.email,
          name: offlineCredentials.userDetails.name,
          avatar: offlineCredentials.userDetails.avatar,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
          appwriteId: offlineCredentials.userDetails.appwriteId,
          isOfflineMode: true
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log("✅ User logged in successfully (offline fallback)");
        return true;
      }
      
      return false;
    }

    // Get user details from Appwrite
    const appwriteUser = await getAppwriteUser();
    if (!appwriteUser) {
      console.log("❌ Failed to get user details from Appwrite");
      return false;
    }

    // Check if user is verified in Appwrite
    console.log("🔍 User verification status:", {
      email: appwriteUser.email,
      emailVerification: appwriteUser.emailVerification,
      userId: appwriteUser.$id
    });
    
    if (!appwriteUser.emailVerification) {
      console.log("❌ User is not verified in Appwrite");
      Alert.alert(
        "Account Not Verified", 
        `Your account (${appwriteUser.email}) is not verified. Please contact an administrator to verify your account in the Appwrite console.`,
        [{ text: "OK" }]
      );
      // Logout from Appwrite since user is not verified
      await appwriteLogout();
      return false;
    }

    // Cache credentials for offline use
    await saveOfflineCredentials(email, password, appwriteUser, true);

    // Create online session
    const session: UserSession = {
      id: appwriteUser.$id,
      email: appwriteUser.email,
      name: appwriteUser.name,
      avatar: appwriteUser.avatar,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      appwriteId: appwriteUser.$id,
      isOfflineMode: false
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log("✅ User logged in successfully with Appwrite (online mode)");
    
    // Add small delay to ensure AsyncStorage write completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error);
    
    // Final fallback to offline if there's an error
    try {
      const offlineCredentials = await verifyOfflineCredentials(email, password);
      if (offlineCredentials) {
        console.log("🔄 Emergency fallback to offline mode");
        const session: UserSession = {
          id: offlineCredentials.userDetails.id,
          email: offlineCredentials.email,
          name: offlineCredentials.userDetails.name,
          avatar: offlineCredentials.userDetails.avatar,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
          appwriteId: offlineCredentials.userDetails.appwriteId,
          isOfflineMode: true
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log("✅ User logged in successfully (emergency offline mode)");
        return true;
      }
    } catch (offlineError) {
      console.error("❌ Offline fallback also failed:", offlineError);
    }
    
    return false;
  }
}

// Get current user session with offline support
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    // First check local session
    const session = await AsyncStorage.getItem(SESSION_KEY);
    if (!session) {
      console.log("📱 No local session found");
      
      // Check if we're offline
      const offline = await isOfflineMode();
      if (offline) {
        console.log("📱 Offline mode - no session available");
        return null;
      }
      
      // Try to get session from Appwrite (online mode)
      const appwriteUser = await getAppwriteUser();
      if (appwriteUser) {
        // Check if user is verified in Appwrite
        if (!appwriteUser.emailVerification) {
          console.log("❌ User is not verified in Appwrite, cannot create session");
          await appwriteLogout();
          return null;
        }

        // Create local session from Appwrite user
        const newSession: UserSession = {
          id: appwriteUser.$id,
          email: appwriteUser.email,
          name: appwriteUser.name,
          avatar: appwriteUser.avatar,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
          appwriteId: appwriteUser.$id,
          isOfflineMode: false
        };
        
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        console.log("✅ Created local session from Appwrite user");
        return newSession;
      }
      
      return null;
    }
    
    const userSession = JSON.parse(session) as UserSession;
    
    // Validate session structure
    if (userSession.isAuthenticated && userSession.email) {
      // If it's an offline session, validate it differently
      if (userSession.isOfflineMode) {
        console.log("✅ Valid offline session found for:", userSession.email);
        return userSession;
      }
      
      // For online sessions, verify with Appwrite if possible
      try {
        const appwriteUser = await getAppwriteUser();
        if (appwriteUser && appwriteUser.$id === userSession.appwriteId) {
          // Check if user is still verified in Appwrite
          if (!appwriteUser.emailVerification) {
            console.log("❌ User verification status changed, clearing session");
            await AsyncStorage.removeItem(SESSION_KEY);
            await appwriteLogout();
            return null;
          }
          
          console.log("✅ Valid online session found for:", userSession.email);
          return userSession;
        } else {
          // Appwrite session expired, but keep offline session if available
          console.log("⚠️ Appwrite session expired, switching to offline mode");
          userSession.isOfflineMode = true;
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
          return userSession;
        }
      } catch (error) {
        // Network error - treat as offline mode
        console.log("📱 Network error, treating session as offline");
        userSession.isOfflineMode = true;
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
        return userSession;
      }
    }
    
    console.log("❌ Invalid session structure");
    return null;
  } catch (error) {
    console.error("❌ Failed to get current user:", error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null && user.isAuthenticated === true;
  } catch (error) {
    console.error("❌ Auth check failed:", error);
    return false;
  }
}

// Logout function
export async function logout(): Promise<boolean> {
  try {
    // Logout from Appwrite
    const appwriteLogoutResult = await appwriteLogout();
    
    // Clear local session regardless of Appwrite logout result
    await AsyncStorage.removeItem(SESSION_KEY);
    
    console.log("✅ User logged out successfully");
    return true;
  } catch (error) {
    console.error("❌ Logout failed:", error);
    // Still try to clear local session
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error("❌ Failed to clear local session:", e);
    }
    return false;
  }
}

// Register new user using Appwrite
export async function registerUser(email: string, password: string, name: string): Promise<boolean> {
  try {
    console.log("📝 Attempting to register user with Appwrite:", email);
    
    // Create account in Appwrite
    const result = await createAppwriteAccount(email, password, name);
    
    if (!result.success) {
      console.log("❌ Appwrite registration failed:", result.error);
      Alert.alert("Registration Failed", result.error || "Failed to create account");
      return false;
    }

    console.log("✅ User registered successfully with Appwrite");
    
    // Automatically log in the user after registration
    const loginSuccess = await login(email, password);
    if (!loginSuccess) {
      Alert.alert("Registration Successful", "Account created successfully. Please log in.");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Registration failed:", error);
    Alert.alert("Registration Failed", "An error occurred during registration");
    return false;
  }
}

// Clear offline credentials
export async function clearOfflineCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_CREDENTIALS_KEY);
    console.log("✅ Offline credentials cleared");
  } catch (error) {
    console.error("❌ Failed to clear offline credentials:", error);
  }
}

// Check if user has offline credentials cached
export async function hasOfflineCredentials(): Promise<boolean> {
  try {
    const credentials = await getOfflineCredentials();
    return credentials !== null && credentials.isVerified;
  } catch (error) {
    return false;
  }
}

// Get offline mode status for UI display
export async function getOfflineModeStatus(): Promise<{ isOffline: boolean; hasCache: boolean }> {
  try {
    const isOffline = await isOfflineMode();
    const hasCache = await hasOfflineCredentials();
    return { isOffline, hasCache };
  } catch (error) {
    return { isOffline: true, hasCache: false };
  }
}

// Debug function to check authentication status
export async function debugAuthStatus(): Promise<void> {
  try {
    console.log("🔍 === DEBUG AUTH STATUS ===");
    
    // Check Appwrite configuration
    const appwriteUser = await getAppwriteUser();
    console.log("Appwrite User:", appwriteUser);
    
    // Check local session
    const localSession = await AsyncStorage.getItem(SESSION_KEY);
    console.log("Local Session:", localSession ? JSON.parse(localSession) : null);
    
    // Check offline credentials
    const offlineCredentials = await getOfflineCredentials();
    console.log("Offline Credentials:", offlineCredentials ? {
      email: offlineCredentials.email,
      hasPassword: !!offlineCredentials.passwordHash,
      isVerified: offlineCredentials.isVerified,
      lastVerified: offlineCredentials.lastVerified
    } : null);
    
    // Check network status
    const offlineStatus = await getOfflineModeStatus();
    console.log("Network Status:", offlineStatus);
    
    console.log("🔍 === END DEBUG ===");
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

// Clear all local data (for development/reset)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SESSION_KEY, OFFLINE_CREDENTIALS_KEY, LAST_ONLINE_VERIFICATION_KEY]);
    console.log("✅ All local data cleared");
  } catch (error) {
    console.error("❌ Failed to clear data:", error);
  }
}
