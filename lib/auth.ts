import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAuthenticated: boolean;
  loginTime: string;
}

// Storage keys
const USERS_KEY = "@app_users";
const SESSION_KEY = "@user_session";

// Demo users for offline testing
const demoUsers: User[] = [
  { 
    id: "1", 
    email: "user@example.com", 
    password: "password", 
    name: "John Doe_Gwapo",
    createdAt: new Date().toISOString()
  },
  { 
    id: "2", 
    email: "user2@example.com", 
    password: "password2", 
    name: "Jane Smith",
    createdAt: new Date().toISOString()
  },
  { 
    id: "3", 
    email: "admin@example.com", 
    password: "admin123", 
    name: "Admin User",
    createdAt: new Date().toISOString()
  }
];

// Initialize demo users (run once)
export async function initializeDemoUsers() {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
      console.log("✅ Demo users initialized");
    }
  } catch (error) {
    console.error("❌ Failed to initialize demo users:", error);
  }
}

// Get all users from storage
async function getStoredUsers(): Promise<User[]> {
  try {
    const users = await AsyncStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error("❌ Failed to get users:", error);
    return [];
  }
}

// Login function
export async function login(email: string, password: string): Promise<boolean> {
  try {
    console.log("🔐 Attempting login for:", email);
    const users = await getStoredUsers();
    
    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.log("❌ User not found");
      return false;
    }

    // Check password
    if (user.password !== password) {
      console.log("❌ Invalid password");
      return false;
    }

    // Create session
    const session: UserSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log("✅ User logged in successfully");
    
    // Add small delay to ensure AsyncStorage write completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error);
    return false;
  }
}

// Get current user session
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const session = await AsyncStorage.getItem(SESSION_KEY);
    if (!session) {
      console.log("📱 No session found in AsyncStorage");
      return null;
    }
    
    const userSession = JSON.parse(session) as UserSession;
    
    // Validate session structure
    if (userSession.isAuthenticated && userSession.email) {
      console.log("✅ Valid session found for:", userSession.email);
      return userSession;
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
    await AsyncStorage.removeItem(SESSION_KEY);
    console.log("✅ User logged out successfully");
    return true;
  } catch (error) {
    console.error("❌ Logout failed:", error);
    return false;
  }
}

// Register new user
export async function registerUser(email: string, password: string, name: string): Promise<boolean> {
  try {
    const users = await getStoredUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      Alert.alert("Error", "User with this email already exists");
      return false;
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      password, // In production, hash this!
      name,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    console.log("✅ User registered successfully");
    return true;
  } catch (error) {
    console.error("❌ Registration failed:", error);
    return false;
  }
}

// Clear all data (for development/reset)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([USERS_KEY, SESSION_KEY]);
    console.log("✅ All data cleared");
  } catch (error) {
    console.error("❌ Failed to clear data:", error);
  }
}

// Initialize demo users when module loads
initializeDemoUsers();
