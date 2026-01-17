import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, MatchData } from '../types';

// ChatRoomData is defined in api.ts, but we'll use a generic type here
type ChatRoomData = any;

// Cache keys
const CACHE_KEYS = {
    USER_PROFILE: 'cache:user_profile',
    MATCHES: 'cache:matches',
    PROFILES: 'cache:profiles',
    WHO_LIKED_ME: 'cache:who_liked_me',
    CHAT_ROOM: (matchId: number) => `cache:chat_room:${matchId}`,
    HOST_SESSION: (matchId: number) => `cache:host_session:${matchId}`,
    CACHE_TIMESTAMPS: 'cache:timestamps',
} as const;

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
    USER_PROFILE: 5 * 60 * 1000, // 5 minutes
    MATCHES: 2 * 60 * 1000, // 2 minutes
    PROFILES: 1 * 60 * 1000, // 1 minute
    WHO_LIKED_ME: 2 * 60 * 1000, // 2 minutes
    CHAT_ROOM: 30 * 1000, // 30 seconds
    HOST_SESSION: 10 * 1000, // 10 seconds
} as const;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface CacheTimestamps {
    [key: string]: number;
}

/**
 * Cache service for storing and retrieving API responses
 */
class CacheService {
    /**
     * Get cached data if it exists and hasn't expired
     */
    async get<T>(key: string, maxAge: number): Promise<T | null> {
        try {
            const cached = await AsyncStorage.getItem(key);
            if (!cached) {
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(cached);
            const age = Date.now() - entry.timestamp;

            if (age > maxAge) {
                // Cache expired, remove it
                await AsyncStorage.removeItem(key);
                console.log(`🗑️ Cache expired for ${key}`);
                return null;
            }

            console.log(`✅ Cache hit for ${key} (age: ${Math.round(age / 1000)}s)`);
            return entry.data;
        } catch (error) {
            console.error(`Error reading cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Get cached data with age information
     * Returns { data, age } if cache exists and is valid, null otherwise
     */
    async getWithAge<T>(key: string, maxAge: number): Promise<{ data: T; age: number } | null> {
        try {
            const cached = await AsyncStorage.getItem(key);
            if (!cached) {
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(cached);
            const age = Date.now() - entry.timestamp;

            if (age > maxAge) {
                // Cache expired, remove it
                await AsyncStorage.removeItem(key);
                console.log(`🗑️ Cache expired for ${key}`);
                return null;
            }

            console.log(`✅ Cache hit for ${key} (age: ${Math.round(age / 1000)}s)`);
            return { data: entry.data, age };
        } catch (error) {
            console.error(`Error reading cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Store data in cache
     */
    async set<T>(key: string, data: T): Promise<void> {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(key, JSON.stringify(entry));
            console.log(`💾 Cached ${key}`);
        } catch (error) {
            console.error(`Error writing cache for ${key}:`, error);
        }
    }

    /**
     * Remove a specific cache entry
     */
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
            console.log(`🗑️ Removed cache for ${key}`);
        } catch (error) {
            console.error(`Error removing cache for ${key}:`, error);
        }
    }

    /**
     * Clear all cache entries
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith('cache:'));
            await AsyncStorage.multiRemove(cacheKeys);
            console.log(`🗑️ Cleared all cache (${cacheKeys.length} entries)`);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    /**
     * Invalidate specific cache types
     */
    async invalidate(type: 'matches' | 'profiles' | 'who_liked_me' | 'all'): Promise<void> {
        try {
            if (type === 'all') {
                await this.clearAll();
                return;
            }

            const keys = await AsyncStorage.getAllKeys();
            const keysToRemove = keys.filter(key => {
                if (type === 'matches') {
                    return key === CACHE_KEYS.MATCHES;
                }
                if (type === 'profiles') {
                    return key === CACHE_KEYS.PROFILES;
                }
                if (type === 'who_liked_me') {
                    return key === CACHE_KEYS.WHO_LIKED_ME;
                }
                return false;
            });

            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
                console.log(`🗑️ Invalidated cache for ${type}`);
            }
        } catch (error) {
            console.error(`Error invalidating cache for ${type}:`, error);
        }
    }

    /**
     * Invalidate chat room cache for a specific match
     */
    async invalidateChatRoom(matchId: number): Promise<void> {
        await this.remove(CACHE_KEYS.CHAT_ROOM(matchId));
    }

    /**
     * Invalidate host session cache for a specific match
     */
    async invalidateHostSession(matchId: number): Promise<void> {
        await this.remove(CACHE_KEYS.HOST_SESSION(matchId));
    }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Cache wrapper functions for specific data types
 */
export const cache = {
    // User Profile
    getUserProfile: async (): Promise<any | null> => {
        return cacheService.get(CACHE_KEYS.USER_PROFILE, CACHE_EXPIRY.USER_PROFILE);
    },
    setUserProfile: async (profile: any): Promise<void> => {
        return cacheService.set(CACHE_KEYS.USER_PROFILE, profile);
    },

    // Matches
    getMatches: async (): Promise<MatchData[] | null> => {
        return cacheService.get(CACHE_KEYS.MATCHES, CACHE_EXPIRY.MATCHES);
    },
    getMatchesWithAge: async (): Promise<{ data: MatchData[]; age: number } | null> => {
        return cacheService.getWithAge(CACHE_KEYS.MATCHES, CACHE_EXPIRY.MATCHES);
    },
    setMatches: async (matches: MatchData[]): Promise<void> => {
        return cacheService.set(CACHE_KEYS.MATCHES, matches);
    },
    invalidateMatches: async (): Promise<void> => {
        return cacheService.invalidate('matches');
    },

    // Profiles (swipe profiles)
    getProfiles: async (): Promise<Profile[] | null> => {
        return cacheService.get(CACHE_KEYS.PROFILES, CACHE_EXPIRY.PROFILES);
    },
    getProfilesWithAge: async (): Promise<{ data: Profile[]; age: number } | null> => {
        return cacheService.getWithAge(CACHE_KEYS.PROFILES, CACHE_EXPIRY.PROFILES);
    },
    setProfiles: async (profiles: Profile[]): Promise<void> => {
        return cacheService.set(CACHE_KEYS.PROFILES, profiles);
    },
    invalidateProfiles: async (): Promise<void> => {
        return cacheService.invalidate('profiles');
    },

    // Who Liked Me
    getWhoLikedMe: async (): Promise<Profile[] | null> => {
        return cacheService.get(CACHE_KEYS.WHO_LIKED_ME, CACHE_EXPIRY.WHO_LIKED_ME);
    },
    getWhoLikedMeWithAge: async (): Promise<{ data: Profile[]; age: number } | null> => {
        return cacheService.getWithAge(CACHE_KEYS.WHO_LIKED_ME, CACHE_EXPIRY.WHO_LIKED_ME);
    },
    setWhoLikedMe: async (profiles: Profile[]): Promise<void> => {
        return cacheService.set(CACHE_KEYS.WHO_LIKED_ME, profiles);
    },
    invalidateWhoLikedMe: async (): Promise<void> => {
        return cacheService.invalidate('who_liked_me');
    },

    // Chat Room
    getChatRoom: async (matchId: number): Promise<ChatRoomData | null> => {
        return cacheService.get(CACHE_KEYS.CHAT_ROOM(matchId), CACHE_EXPIRY.CHAT_ROOM);
    },
    getChatRoomWithAge: async (matchId: number): Promise<{ data: ChatRoomData; age: number } | null> => {
        return cacheService.getWithAge(CACHE_KEYS.CHAT_ROOM(matchId), CACHE_EXPIRY.CHAT_ROOM);
    },
    setChatRoom: async (matchId: number, chatRoom: ChatRoomData): Promise<void> => {
        return cacheService.set(CACHE_KEYS.CHAT_ROOM(matchId), chatRoom);
    },
    invalidateChatRoom: async (matchId: number): Promise<void> => {
        return cacheService.invalidateChatRoom(matchId);
    },

    // Host Session
    getHostSession: async (matchId: number): Promise<any | null> => {
        return cacheService.get(CACHE_KEYS.HOST_SESSION(matchId), CACHE_EXPIRY.HOST_SESSION);
    },
    setHostSession: async (matchId: number, session: any): Promise<void> => {
        return cacheService.set(CACHE_KEYS.HOST_SESSION(matchId), session);
    },
    invalidateHostSession: async (matchId: number): Promise<void> => {
        return cacheService.invalidateHostSession(matchId);
    },

    // Clear all cache (useful for logout)
    clearAll: async (): Promise<void> => {
        return cacheService.clearAll();
    },
    // Generic remove
    remove: async (key: string): Promise<void> => {
        return cacheService.remove(key);
    },
};
