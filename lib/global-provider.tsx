// lib/global-provider.tsx - UPDATED FOR OFFLINE AUTH
import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { getCurrentUser } from "./auth"; // Import from your offline auth file

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAuthenticated: boolean;
  loginTime: string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);

  const refetch = async () => {
    try {
      console.log("🔄 Refetching user session...");
      setLoading(true);

      const currentUser = await getCurrentUser();

      if (currentUser && currentUser.isAuthenticated) {
        setUser(currentUser);
        setIsLogged(true);
        console.log("✅ User session found:", currentUser.email);
      } else {
        setUser(null);
        setIsLogged(false);
        console.log("❌ No user session found");
      }
    } catch (error) {
      console.error("❌ Auth refresh failed:", error);
      setUser(null);
      setIsLogged(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial auth check when provider mounts
  useEffect(() => {
    console.log("🚀 GlobalProvider mounted, checking auth...");
    refetch();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        refetch,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error("useGlobalContext must be used within a GlobalProvider");

  return context;
};

export default GlobalProvider;