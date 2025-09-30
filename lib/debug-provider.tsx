import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DebugContextType {
  isDebugVisible: boolean;
  toggleDebugVisibility: () => void;
  loading: boolean;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

interface DebugProviderProps {
  children: ReactNode;
}

const DEBUG_VISIBILITY_KEY = 'debug_button_visible';

export const DebugProvider: React.FC<DebugProviderProps> = ({ children }) => {
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebugVisibility();
  }, []);

  const loadDebugVisibility = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEBUG_VISIBILITY_KEY);
      if (stored !== null) {
        setIsDebugVisible(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load debug visibility setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDebugVisibility = async () => {
    try {
      const newValue = !isDebugVisible;
      setIsDebugVisible(newValue);
      await AsyncStorage.setItem(DEBUG_VISIBILITY_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save debug visibility setting:', error);
    }
  };

  return (
    <DebugContext.Provider
      value={{
        isDebugVisible,
        toggleDebugVisibility,
        loading,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};

export const useDebugContext = (): DebugContextType => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }
  return context;
};
