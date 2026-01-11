import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, MatchData, SwipeResponse, Message, MatchedUser } from '../types';

// Configure API base URL
const LOCAL_IP = '192.168.0.10'; // Your machine's local IP
const PRODUCTION_URL = 'https://metll-backend-1.onrender.com/api';

// Set to true for production builds, false for local development
const USE_PRODUCTION_API = true;

const getBaseUrl = () => {
    // Check environment variable first
    if (process.env.EXPO_PUBLIC_API_URL) {
        const url = process.env.EXPO_PUBLIC_API_URL.trim();
        // Validate it's a proper URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
    }
    
    // Use production or local based on flag
    if (USE_PRODUCTION_API) {
        return PRODUCTION_URL;
    }
    
    return `http://${LOCAL_IP}:3000/api`;
};

const API_BASE_URL = getBaseUrl();

// Set to true to use mock data (for development without backend)
// Set to false when backend is running
const USE_MOCK_DATA = false;

// ==========================================
// Mock Data for Development
// ==========================================

const MOCK_PROFILES: Profile[] = [
    {
        id: 1,
        name: 'Priya',
        age: 25,
        bio: 'Coffee enthusiast, bookworm, and weekend hiker. Looking for someone to share sunsets with.',
        images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
        profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        distance: '3.2 km',
        isVerified: true,
    },
    {
        id: 2,
        name: 'Ananya',
        age: 23,
        bio: 'Music lover and aspiring chef. Let\'s cook something amazing together!',
        images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'],
        profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
        distance: '5.8 km',
        isVerified: false,
    },
    {
        id: 3,
        name: 'Neha',
        age: 27,
        bio: 'Fitness junkie by day, Netflix binger by night. Looking for my gym buddy!',
        images: ['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
        profilePhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
        distance: '2.1 km',
        isVerified: true,
    },
];

const MOCK_MATCHES: MatchData[] = [
    {
        id: 1,
        matchedUser: {
            id: 4,
            name: 'Kavya',
            profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
            images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
            isVerified: true,
        },
        matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastMessage: {
            id: 1,
            content: 'Hey! How are you?',
            senderId: 4,
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            type: 'text',
            isRead: false,
        },
        unreadCount: 1,
    },
    {
        id: 2,
        matchedUser: {
            id: 5,
            name: 'Isha',
            profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
            images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
            isVerified: true,
        },
        matchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastMessage: undefined,
        unreadCount: 0,
    },
];

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

// API Logging - set to false in production
const ENABLE_API_LOGGING = true;

const logRequest = (method: string, endpoint: string, body?: any) => {
    if (!ENABLE_API_LOGGING) return;
    console.log(`\n📤 API REQUEST`);
    console.log(`   ${method} ${API_BASE_URL}${endpoint}`);
    if (body) {
        console.log(`   Body:`, JSON.stringify(body, null, 2));
    }
};

const logResponse = (method: string, endpoint: string, status: number, data: any, duration: number) => {
    if (!ENABLE_API_LOGGING) return;
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(`\n📥 API RESPONSE ${statusEmoji}`);
    console.log(`   ${method} ${endpoint} - Status: ${status} (${duration}ms)`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
};

const logError = (method: string, endpoint: string, error: any) => {
    if (!ENABLE_API_LOGGING) return;
    console.log(`\n❌ API ERROR`);
    console.log(`   ${method} ${endpoint}`);
    console.log(`   Error:`, error);
};

const logMock = (functionName: string, data: any) => {
    if (!ENABLE_API_LOGGING) return;
    console.log(`\n🎭 MOCK DATA`);
    console.log(`   ${functionName}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
};

// Global callback for handling 401 errors (user deleted/token invalid)
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (callback: () => void) => {
    onUnauthorizedCallback = callback;
};

// Helper for authenticated requests
const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAuthToken();
    const method = options.method || 'GET';
    const startTime = Date.now();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    // Log request
    logRequest(method, endpoint, options.body ? JSON.parse(options.body as string) : undefined);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Handle 401 Unauthorized - user deleted or token invalid
        if (response.status === 401) {
            console.warn('🔒 Unauthorized: User session invalid, logging out...');
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
        }

        // Clone response to log it without consuming
        const clonedResponse = response.clone();
        const duration = Date.now() - startTime;
        
        try {
            const responseData = await clonedResponse.json();
            logResponse(method, endpoint, response.status, responseData, duration);
        } catch {
            logResponse(method, endpoint, response.status, '[Non-JSON response]', duration);
        }

        return response;
    } catch (error) {
        logError(method, endpoint, error);
        throw error;
    }
};

// ==========================================
// Auth API
// ==========================================

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: {
            id: number;
            name: string;
            email?: string;
            phone: string;
        };
        token: string;
    };
}

// Helper to save auth token
const saveAuthToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem('authToken', token);
        console.log('Auth token saved');
    } catch (error) {
        console.error('Error saving auth token:', error);
    }
};

export const authApi = {
    /**
     * Register a new user
     */
    register: async (name: string, phoneNumber: string, password: string): Promise<AuthResponse> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockResponse: AuthResponse = {
                success: true,
                message: 'Registration successful. OTP sent.',
                data: {
                    user: { id: Date.now(), name, phone: phoneNumber },
                    token: '', // No token until OTP verified
                },
            };
            logMock('authApi.register()', mockResponse);
            return mockResponse;
        }

        try {
            const body = { name, phoneNumber, password };
            logRequest('POST', '/auth/register', { name, phoneNumber });
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/auth/register', response.status, data, duration);

            return data;
        } catch (error) {
            logError('POST', '/auth/register', error);
            throw error;
        }
    },

    /**
     * Verify OTP and complete login
     */
    verifyOtp: async (phone: string, otp: string): Promise<AuthResponse> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockResponse: AuthResponse = {
                success: true,
                message: 'OTP verified successfully',
                data: {
                    user: { id: Date.now(), name: 'User', phone },
                    token: `mock_token_${Date.now()}`,
                },
            };
            if (mockResponse.data?.token) {
                await saveAuthToken(mockResponse.data.token);
            }
            logMock('authApi.verifyOtp()', mockResponse);
            return mockResponse;
        }

        try {
            logRequest('POST', '/auth/verify-otp', { phone, otp });
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/auth/verify-otp', response.status, data, duration);

            if (data.success && data.data?.token) {
                await saveAuthToken(data.data.token);
            }

            return data;
        } catch (error) {
            logError('POST', '/auth/verify-otp', error);
            throw error;
        }
    },

    /**
     * Login with phone and password
     */
    login: async (phoneNumber: string, password: string): Promise<AuthResponse> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockResponse: AuthResponse = {
                success: true,
                message: 'Login successful',
                data: {
                    user: { id: Date.now(), name: 'User', phone: phoneNumber },
                    token: `mock_token_${Date.now()}`,
                },
            };
            if (mockResponse.data?.token) {
                await saveAuthToken(mockResponse.data.token);
            }
            logMock('authApi.login()', mockResponse);
            return mockResponse;
        }

        try {
            const body = { phoneNumber, password };
            logRequest('POST', '/auth/login', { phoneNumber });
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/auth/login', response.status, data, duration);

            if (data.success && data.data?.token) {
                await saveAuthToken(data.data.token);
            }

            return data;
        } catch (error) {
            logError('POST', '/auth/login', error);
            throw error;
        }
    },

    /**
     * Request password reset OTP
     */
    requestPasswordReset: async (phoneNumber: string): Promise<AuthResponse> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockResponse: AuthResponse = {
                success: true,
                message: 'OTP sent successfully',
            };
            logMock('authApi.requestPasswordReset()', mockResponse);
            return mockResponse;
        }

        try {
            const body = { phoneNumber };
            logRequest('POST', '/auth/forgot-password', { phoneNumber });
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/auth/forgot-password', response.status, data, duration);

            return data;
        } catch (error) {
            logError('POST', '/auth/forgot-password', error);
            throw error;
        }
    },

    /**
     * Reset password with OTP
     */
    resetPassword: async (phoneNumber: string, otp: string, newPassword: string): Promise<AuthResponse> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockResponse: AuthResponse = {
                success: true,
                message: 'Password reset successfully',
            };
            logMock('authApi.resetPassword()', mockResponse);
            return mockResponse;
        }

        try {
            const body = { phoneNumber, otp, newPassword };
            logRequest('POST', '/auth/reset-password', { phoneNumber });
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/auth/reset-password', response.status, data, duration);

            return data;
        } catch (error) {
            logError('POST', '/auth/reset-password', error);
            throw error;
        }
    },

    /**
     * Logout - clear auth token
     */
    logout: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('authToken');
            console.log('Auth token removed');
        } catch (error) {
            console.error('Error removing auth token:', error);
        }
    },

    /**
     * Validate session - check if user still exists in backend
     * Call this on app startup to verify user wasn't deleted
     */
    validateSession: async (): Promise<{ valid: boolean; user?: any; message?: string }> => {
        const token = await getAuthToken();
        
        if (!token) {
            return { valid: false, message: 'No token found' };
        }

        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { valid: true };
        }

        try {
            logRequest('GET', '/auth/me', undefined);
            const startTime = Date.now();
            
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('GET', '/auth/me', response.status, data, duration);

            if (response.status === 401 || !data.success) {
                // User deleted or token invalid
                return { valid: false, message: data.message || 'Session invalid' };
            }

            return { valid: true, user: data.data?.user };
        } catch (error: any) {
            logError('GET', '/auth/me', error);
            // Network error - don't log out, might just be offline
            return { valid: true, message: 'Network error, assuming valid' };
        }
    },

    /**
     * Upload profile picture (first step in onboarding)
     * Backend uploads to Cloudinary and returns the URL
     */
    uploadProfilePicture: async (imageUri: string): Promise<{ success: boolean; message?: string; data?: { photo: string; userId: number } }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                message: 'Profile picture uploaded',
                data: { photo: imageUri, userId: 1 },
            };
        }

        try {
            const token = await getAuthToken();
            const formData = new FormData();
            
            // Get file info from URI
            const uriParts = imageUri.split('/');
            const fileName = uriParts[uriParts.length - 1];
            
            formData.append('photo', {
                uri: imageUri,
                type: 'image/jpeg',
                name: fileName || 'profile.jpg',
            } as any);

            logRequest('POST', '/user/profile-picture', { fileName });
            const startTime = Date.now();

            const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/user/profile-picture', response.status, data, duration);

            if (response.status === 401 && onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }

            return data;
        } catch (error) {
            logError('POST', '/user/profile-picture', error);
            throw error;
        }
    },

    /**
     * Upload additional photos (after profile picture)
     * Backend uploads to Cloudinary and returns URLs
     */
    uploadPhotos: async (imageUris: string[]): Promise<{ success: boolean; message?: string; data?: { uploadedUrls: string[]; allPhotos: string[] } }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                message: 'Photos uploaded',
                data: { uploadedUrls: imageUris, allPhotos: imageUris },
            };
        }

        try {
            const token = await getAuthToken();
            const formData = new FormData();
            
            imageUris.forEach((uri, index) => {
                const uriParts = uri.split('/');
                const fileName = uriParts[uriParts.length - 1];
                
                formData.append('images', {
                    uri: uri,
                    type: 'image/jpeg',
                    name: fileName || `photo${index}.jpg`,
                } as any);
            });

            logRequest('POST', '/user/photos', { count: imageUris.length });
            const startTime = Date.now();

            const response = await fetch(`${API_BASE_URL}/user/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/user/photos', response.status, data, duration);

            if (response.status === 401 && onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }

            return data;
        } catch (error) {
            logError('POST', '/user/photos', error);
            throw error;
        }
    },

    /**
     * Delete a photo by index
     * For profile picture, use index 0
     * For additional photos, use index 1-5 (maps to 0-4 on backend)
     */
    deletePhoto: async (index: number): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true, message: 'Photo deleted' };
        }

        try {
            const token = await getAuthToken();
            
            // For additional photos, the backend uses 0-based index
            // Our index 1 = backend index 0, etc.
            const backendIndex = index > 0 ? index - 1 : 0;
            const endpoint = index === 0 
                ? '/user/profile-picture'  // Delete profile picture
                : `/user/photos/${backendIndex}`;  // Delete additional photo
            
            logRequest('DELETE', endpoint, { index });
            const startTime = Date.now();

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('DELETE', endpoint, response.status, data, duration);

            if (response.status === 401 && onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }

            return data;
        } catch (error) {
            logError('DELETE', '/user/photos', error);
            return { success: false, message: 'Failed to delete photo' };
        }
    },

    /**
     * Upload verification video
     * Backend uploads to Cloudinary and returns URL
     */
    uploadVerificationVideo: async (videoUri: string): Promise<{ success: boolean; message?: string; data?: { video: string } }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                message: 'Video uploaded',
                data: { video: videoUri },
            };
        }

        try {
            const token = await getAuthToken();
            const formData = new FormData();
            
            const uriParts = videoUri.split('/');
            const fileName = uriParts[uriParts.length - 1];
            
            formData.append('video', {
                uri: videoUri,
                type: 'video/mp4',
                name: fileName || 'verification.mp4',
            } as any);

            logRequest('POST', '/user/verification-video', { fileName });
            const startTime = Date.now();

            const response = await fetch(`${API_BASE_URL}/user/verification-video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/user/verification-video', response.status, data, duration);

            if (response.status === 401 && onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }

            return data;
        } catch (error) {
            logError('POST', '/user/verification-video', error);
            throw error;
        }
    },

    /**
     * Update user profile (sync with backend)
     * This sends profile data to the backend
     */
    updateProfile: async (profileData: {
        name?: string;
        bio?: string;
        age?: number;
        gender?: string;
        photo?: string;
        additionalPhotos?: string[];
        verificationVideo?: string;
        school?: any;
        college?: any;
        office?: any;
        homeLocation?: any;
        situationResponses?: any[];
    }): Promise<{ success: boolean; message?: string; data?: any }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const mockResponse = {
                success: true,
                message: 'Profile updated successfully',
                data: profileData,
            };
            logMock('authApi.updateProfile()', mockResponse);
            return mockResponse;
        }

        try {
            logRequest('PUT', '/user/profile', profileData);
            const startTime = Date.now();
            
            const response = await authFetch('/user/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('PUT', '/user/profile', response.status, data, duration);

            return data;
        } catch (error) {
            logError('PUT', '/user/profile', error);
            // Don't throw - profile updates should fail silently and retry later
            return { success: false, message: 'Failed to sync profile' };
        }
    },
};

// ==========================================
// Swipe API
// ==========================================

export const swipeApi = {
    /**
     * Get profiles available to swipe on
     */
    getProfiles: async (): Promise<Profile[]> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            logMock('swipeApi.getProfiles()', MOCK_PROFILES);
            return MOCK_PROFILES;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const isMatch = direction === 'like' && Math.random() < 0.3;
            const profile = MOCK_PROFILES.find(p => p.id === targetUserId) || MOCK_PROFILES[0];
            const result = {
                success: true,
                message: isMatch ? 'It\'s a match!' : 'Swiped',
                data: {
                    direction,
                    isMatch,
                    match: isMatch ? {
                        id: Date.now(),
                        matchedUser: {
                            id: profile.id,
                            name: profile.name,
                            images: profile.images,
                            profilePhoto: profile.profilePhoto,
                            bio: profile.bio,
                            age: profile.age,
                            isVerified: profile.isVerified,
                        },
                        matchedAt: new Date().toISOString(),
                    } : undefined,
                },
            };
            logMock(`swipeApi.swipe(${targetUserId}, ${direction})`, result);
            return result;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            logMock('swipeApi.getMatches()', MOCK_MATCHES);
            return MOCK_MATCHES;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const match = MOCK_MATCHES.find(m => m.id === matchId);
            if (!match) throw new Error('Match not found');
            logMock(`swipeApi.getMatch(${matchId})`, match);
            return match;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            logMock(`swipeApi.unmatch(${matchId})`, { success: true });
            return;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const match = MOCK_MATCHES.find(m => m.id === matchId);
            const result = {
                matchId,
                matchedUser: match?.matchedUser || MOCK_MATCHES[0].matchedUser,
                chatRoom: {
                    id: matchId,
                    messages: match?.lastMessage ? [match.lastMessage as Message] : [],
                },
            };
            logMock(`chatApi.getChatRoom(${matchId})`, result);
            return result;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const result = {
                id: Date.now(),
                content: content,
                senderId: 0,
                createdAt: new Date().toISOString(),
                type,
                mediaUrl,
                isRead: true,
                isOwn: true,
            };
            logMock(`chatApi.sendMessage(${matchId}, "${content}")`, result);
            return result;
        }

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
        if (USE_MOCK_DATA) {
            logMock(`chatApi.markAsRead(${matchId})`, { success: true });
            return;
        }

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
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const result = {
                url: fileUri,
                type,
                publicId: `mock_${Date.now()}`,
            };
            logMock(`chatApi.uploadMedia(${type})`, result);
            return result;
        }

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
