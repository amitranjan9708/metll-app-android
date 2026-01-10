import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, MatchData, SwipeResponse, Message, MatchedUser } from '../types';

// Configure API base URL (update for production)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        return token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

// Helper for authenticated requests
const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
};

// ==========================================
// Swipe API
// ==========================================

export const swipeApi = {
    /**
     * Get profiles available to swipe on
     */
    getProfiles: async (): Promise<Profile[]> => {
        try {
            const response = await authFetch('/swipe/profiles');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get profiles');
            }

            return data.data;
        } catch (error) {
            console.error('Get profiles error:', error);
            throw error;
        }
    },

    /**
     * Record a swipe action (like or pass)
     */
    swipe: async (targetUserId: number, direction: 'like' | 'pass'): Promise<SwipeResponse> => {
        try {
            const response = await authFetch('/swipe', {
                method: 'POST',
                body: JSON.stringify({ targetUserId, direction }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Swipe error:', error);
            throw error;
        }
    },

    /**
     * Get all matches
     */
    getMatches: async (): Promise<MatchData[]> => {
        try {
            const response = await authFetch('/swipe/matches');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get matches');
            }

            return data.data;
        } catch (error) {
            console.error('Get matches error:', error);
            throw error;
        }
    },

    /**
     * Get a single match by ID
     */
    getMatch: async (matchId: number): Promise<MatchData> => {
        try {
            const response = await authFetch(`/swipe/matches/${matchId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get match');
            }

            return data.data;
        } catch (error) {
            console.error('Get match error:', error);
            throw error;
        }
    },
    /**
     * Unmatch a user
     */
    unmatch: async (matchId: number): Promise<void> => {
        try {
            const response = await authFetch(`/swipe/matches/${matchId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to unmatch');
            }
        } catch (error) {
            console.error('Unmatch error:', error);
            throw error;
        }
    },
};

// ==========================================
// Chat API
// ==========================================

export interface ChatRoomData {
    matchId: number;
    matchedUser: MatchedUser;
    chatRoom: {
        id: number;
        messages: Message[];
    } | null;
}

export const chatApi = {
    /**
     * Get chat room with messages
     */
    getChatRoom: async (matchId: number): Promise<ChatRoomData> => {
        try {
            const response = await authFetch(`/chat/${matchId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get chat room');
            }

            return data.data;
        } catch (error) {
            console.error('Get chat room error:', error);
            throw error;
        }
    },

    /**
     * Send a message (HTTP fallback)
     */
    sendMessage: async (matchId: number, content: string | null, type: 'text' | 'image' | 'video' = 'text', mediaUrl?: string): Promise<Message> => {
        try {
            const response = await authFetch(`/chat/${matchId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content, type, mediaUrl }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to send message');
            }

            return data.data;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    },

    /**
     * Mark messages as read
     */
    markAsRead: async (matchId: number): Promise<void> => {
        try {
            await authFetch(`/chat/${matchId}/read`, {
                method: 'PUT',
            });
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    },

    /**
     * Upload chat media
     */
    uploadMedia: async (fileUri: string, type: 'image' | 'video'): Promise<{ url: string, type: string, publicId: string }> => {
        try {
            const formData = new FormData();
            const filename = fileUri.split('/').pop() || 'media';
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : (type === 'image' ? 'jpg' : 'mp4');

            // @ts-ignore - ReactNative FormData
            formData.append('file', {
                uri: fileUri,
                name: filename,
                type: type === 'image' ? `image/${ext}` : `video/${ext}`,
            });

            const token = await getAuthToken();
            const response = await fetch(`${API_BASE_URL}/chat/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to upload media');
            }

            return data.data;

        } catch (error) {
            console.error('Upload media error:', error);
            throw error;
        }
    },
};

// Export API URL for Socket.io
export const getApiBaseUrl = (): string => {
    // Return base URL without /api for Socket.io
    return API_BASE_URL.replace('/api', '');
};

export { getAuthToken };
