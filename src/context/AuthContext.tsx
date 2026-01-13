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
      // Check both user data and token
      const [userData, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('authToken')
      ]);
      
      console.log('📱 Loading user data:', {
        hasUserData: !!userData,
        hasToken: !!token
      });
      
      if (!userData) {
        // No local user, stay logged out
        console.log('📱 No local user data found');
        setIsLoading(false);
        return;
      }

      // If we have user but no token, something went wrong - but keep user for now
      if (!token) {
        console.warn('⚠️ User data found but no auth token. User may need to login again.');
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
      
      // Set user from local storage IMMEDIATELY - LOCAL DATA IS PRIMARY
      setUser(parsedUser);
      
      // Only validate session if user is already onboarded AND we have a token
      // This prevents overwriting local onboarding data
      if (parsedUser.isOnboarded && token) {
        console.log('🔍 User is onboarded and has token, validating session with backend...');
        try {
          const validation = await authApi.validateSession();
          
          if (!validation.valid) {
            // User was deleted or token is invalid
            console.warn('❌ Session invalid:', validation.message);
            // Only logout if it's a real auth error, not a network error
            if (validation.message && !validation.message.includes('Network')) {
              await handleForceLogout();
            } else {
              console.log('⚠️ Network error during validation, keeping local user');
            }
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
        } catch (error: any) {
          console.log('⚠️ Could not validate session (offline?), using local data:', error.message);
          // On error, keep local user (might be offline)
          // Don't logout on network errors
        }
      } else {
        if (!token) {
          console.log('📱 No auth token found, skipping validation');
        } else {
          console.log('📱 User not yet onboarded, skipping backend validation');
        }
      }
    } catch (error) {
      console.error('Error loading local user:', error);
      // On error, don't clear user - might be a parsing issue
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize callbacks to prevent unnecessary re-renders
  const login = useCallback(async (userData: User) => {
    console.log('AuthContext login called with:', userData);
    try {
      // Save user data to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ User saved to AsyncStorage');
      
      // Verify it was saved
      const saved = await AsyncStorage.getItem('user');
      if (saved) {
        console.log('✅ Verified user data persisted');
      } else {
        console.error('❌ Failed to verify user data persistence');
      }
      
      // Also verify token exists
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        console.log('✅ Auth token found in storage');
      } else {
        console.warn('⚠️ No auth token found in storage after login');
      }
      
      setUser(userData);
      console.log('✅ User state updated, isAuthenticated will be true');
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear all user-related data from local storage
      const keysToRemove = [
        'user',
        '@user_profile_cache',
        'authToken',
      ];
      
      // Also clear chat storage (if exists)
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter(k => k.startsWith('@chat_') || k.startsWith('@chat_sync_'));
      
      await AsyncStorage.multiRemove([...keysToRemove, ...chatKeys]);
      setUser(null);
      console.log('✅ All local data cleared on logout');
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
