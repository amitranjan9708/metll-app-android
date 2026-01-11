import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>, skipBackendSync?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize callbacks to prevent unnecessary re-renders
  const login = useCallback(async (userData: User) => {
    console.log('AuthContext login called with:', userData);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('User saved to AsyncStorage');
      setUser(userData);
      console.log('User state updated, isAuthenticated will be true');
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>, skipBackendSync: boolean = false) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...userData };
      
      // Save to AsyncStorage asynchronously (non-blocking)
      AsyncStorage.setItem('user', JSON.stringify(updatedUser)).catch(err => {
        console.error('Error updating user in AsyncStorage:', err);
      });

      // Skip backend sync if caller already handled it (e.g., PhotoUploadScreen)
      if (skipBackendSync) {
        console.log('📦 Saved locally (backend sync skipped)');
        return updatedUser;
      }

      // Sync with backend (non-blocking)
      // Don't sync photos/videos here - PhotoUploadScreen handles that with retry logic
      const syncData: any = {};
      if (userData.school) syncData.school = userData.school;
      if (userData.college) syncData.college = userData.college;
      if (userData.office) syncData.office = userData.office;
      if (userData.homeLocation) syncData.homeLocation = userData.homeLocation;
      if (userData.situationResponses) syncData.situationResponses = userData.situationResponses;
      if (userData.name) syncData.name = userData.name;
      
      // Only call API if we have data to sync
      if (Object.keys(syncData).length > 0) {
        console.log('📤 Syncing profile with backend:', Object.keys(syncData));
        authApi.updateProfile(syncData)
          .then(result => {
            if (result.success) {
              console.log('✅ Profile synced with backend');
            } else {
              console.warn('⚠️ Backend sync failed:', result.message);
            }
          })
          .catch(err => {
            console.error('❌ Error syncing with backend:', err);
          });
      }

      return updatedUser;
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  }), [user, isLoading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
