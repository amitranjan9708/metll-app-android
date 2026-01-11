import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi, setOnUnauthorizedCallback } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>, skipBackendSync?: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register global 401 handler
  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      console.log('🔒 Global 401 received, logging out...');
      handleForceLogout();
    });
  }, []);

  // Force logout when user is deleted or token is invalid
  const handleForceLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'authToken']);
      setUser(null);
      console.log('🚪 User logged out due to invalid session');
    } catch (error) {
      console.error('Error during force logout:', error);
    }
  };

  useEffect(() => {
    loadLocalUser();
  }, []);

  // Load user from local storage - PRIMARY source of truth for onboarding status
  const loadLocalUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      
      if (!userData) {
        // No local user, stay logged out
        console.log('📱 No local user data found');
        setIsLoading(false);
        return;
      }

      let parsedUser = JSON.parse(userData);
      console.log('📱 Loaded local user:', { 
        id: parsedUser.id, 
        name: parsedUser.name,
        isOnboarded: parsedUser.isOnboarded,
        hasPhoto: !!parsedUser.photo,
        hasSituationResponses: parsedUser.situationResponses?.length || 0
      });
      
      // MIGRATION: If user doesn't have isOnboarded flag locally,
      // use the backend value or default to false (will need to complete onboarding)
      if (parsedUser.isOnboarded === undefined) {
        console.log('📱 User missing isOnboarded flag, defaulting to false');
        parsedUser = { ...parsedUser, isOnboarded: false };
        await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
      }
      
      // Set user from local storage - LOCAL DATA IS PRIMARY
      setUser(parsedUser);
      
      // Only validate session if user is already onboarded
      // This prevents overwriting local onboarding data
      if (parsedUser.isOnboarded) {
        console.log('🔍 User is onboarded, validating session with backend...');
        try {
          const validation = await authApi.validateSession();
          
          if (!validation.valid) {
            // User was deleted or token is invalid
            console.warn('❌ Session invalid:', validation.message);
            await handleForceLogout();
          } else {
            console.log('✅ Session valid');
            // Merge backend data but PRESERVE local isOnboarded flag
            if (validation.user) {
              const updatedUser = { 
                ...parsedUser, 
                ...validation.user,
                isOnboarded: parsedUser.isOnboarded, // ALWAYS preserve local onboarding status
              };
              setUser(updatedUser);
              await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          console.log('⚠️ Could not validate session (offline?), using local data');
          // On error, keep local user (might be offline)
        }
      } else {
        console.log('📱 User not yet onboarded, skipping backend validation');
      }
    } catch (error) {
      console.error('Error loading local user:', error);
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

  // Mark onboarding as complete - sets local flag
  const completeOnboarding = useCallback(async () => {
    console.log('🎉 Marking onboarding as complete');
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, isOnboarded: true };
      
      // Save to AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(updatedUser)).catch(err => {
        console.error('Error saving onboarding status:', err);
      });
      
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
    completeOnboarding,
  }), [user, isLoading, login, logout, updateUser, completeOnboarding]);

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
