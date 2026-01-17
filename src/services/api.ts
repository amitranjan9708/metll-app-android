import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, MatchData, SwipeResponse, Message, MatchedUser, ChatHostSession, ChatHostMessage } from '../types';
import { cache } from './cache';

// Configure API base URL
const LOCAL_IP = '192.168.1.9'; // Computer's LAN IP
const PRODUCTION_URL = 'https://metll-backend-1.onrender.com/api';

// Set to true for production builds, false for local development
const USE_PRODUCTION_API = false; // Changed to false for local development

const getBaseUrl = () => {
    // Check environment variable first - PRIORITIZE .ENV AS REQUESTED
    if (process.env.EXPO_PUBLIC_API_URL) {
        const url = process.env.EXPO_PUBLIC_API_URL.trim();
        // Allow both http and https
        if (url.startsWith('http://') || url.startsWith('https://')) {
            console.log(' Using API URL from .env:', url);
            return url;
        }
    }

    // Use production or local based on flag
    if (USE_PRODUCTION_API) {
        return PRODUCTION_URL;
    }

    // For web platform, use localhost; for mobile, use local IP
    if (Platform.OS === 'web') {
        return 'http://localhost:3000/api';
    }

    return `http://${LOCAL_IP}:3000/api`;
};

const API_BASE_URL = getBaseUrl();
console.log('🌐 API Base URL configured:', API_BASE_URL, '(Platform:', Platform.OS, ')');

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
        situationResponses: [
            { questionId: 1, answer: "When the dog owner apologized and offered to replace my coffee, we ended up chatting for an hour and became great friends!", answeredAt: new Date().toISOString() },
            { questionId: 2, answer: "Tell them their presentation was great but offer a tip for next time in private", answeredAt: new Date().toISOString() },
        ],
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
        situationResponses: [
            { questionId: 3, answer: "I'd introduce myself and maybe try a new dance move to impress them!", answeredAt: new Date().toISOString() },
        ],
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
        situationResponses: [
            { questionId: 4, answer: "When life gives you lemons, I make lemon water and start my workout!", answeredAt: new Date().toISOString() },
            { questionId: 5, answer: "Sleep in, make pancakes, then hit the gym for a fun workout with friends", answeredAt: new Date().toISOString() },
        ],
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
    console.log(`   ${method} ${API_BASE_URL.startsWith('http') ? '' : 'LOCAL:'}${API_BASE_URL}${endpoint}`);
    if (body) {
        console.log(`   Body:`, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    }
};

const logResponse = (method: string, endpoint: string, status: number, data: any, duration: number) => {
    if (!ENABLE_API_LOGGING) return;
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(`\n📥 API RESPONSE ${statusEmoji}`);
    console.log(`   ${method} ${endpoint} - Status: ${status} (${duration}ms)`);
    if (data && typeof data === 'object') {
        console.log(`   Data:`, JSON.stringify(data, null, 2));
    } else {
        console.log(`   Data:`, data);
    }
};

const logError = (method: string, endpoint: string, error: any) => {
    if (!ENABLE_API_LOGGING) return;
    console.log(`\n❌ API ERROR`);
    console.log(`   ${method} ${API_BASE_URL}${endpoint}`);
    console.log(`   Error:`, error);
    if (error && error.message) console.log(`   Message:`, error.message);
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
    if (options.body && typeof options.body === 'string' && headers['Content-Type'] === 'application/json') {
        try {
            logRequest(method, endpoint, JSON.parse(options.body));
        } catch {
            logRequest(method, endpoint, options.body);
        }
    } else {
        logRequest(method, endpoint, options.body);
    }

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

// Helper for authenticated FormData requests (for file uploads)
const authFetchFormData = async (endpoint: string, formData: FormData, options: RequestInit = {}): Promise<Response> => {
    const token = await getAuthToken();
    const method = options.method || 'POST';
    const startTime = Date.now();

    // IMPORTANT: For FormData, we must NOT set Content-Type header.
    // The browser/RN will set it automatically with the correct boundary.
    const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    logRequest(method, endpoint, '[FormData Upload]');

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            method,
            headers,
            body: formData,
        });

        if (response.status === 401 && onUnauthorizedCallback) {
            onUnauthorizedCallback();
        }

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
        console.log('✅ Auth token saved to AsyncStorage');

        // Verify it was saved
        const saved = await AsyncStorage.getItem('authToken');
        if (saved === token) {
            console.log('✅ Verified auth token persisted correctly');
        } else {
            console.error('❌ Auth token verification failed - token mismatch');
        }
    } catch (error) {
        console.error('❌ Error saving auth token:', error);
        throw error; // Re-throw to ensure caller knows it failed
    }
};

export const authApi = {
    /**
     * Register a new user
     */
    register: async (name: string, phoneNumber: string, password: string, referralCode?: string): Promise<AuthResponse> => {
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
            const body = { name, phoneNumber, password, referralCode };
            logRequest('POST', '/auth/register', { name, phoneNumber, referralCode });
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
            console.log('🌐 Making login request to:', `${API_BASE_URL}/auth/login`);
            console.log('📤 Request body:', { phoneNumber: phoneNumber.substring(0, 5) + '***' });
            logRequest('POST', '/auth/login', { phoneNumber });
            const startTime = Date.now();

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            console.log('📥 Login response status:', response.status);
            const data = await response.json();
            const duration = Date.now() - startTime;
            console.log('📥 Login response data:', data);
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
            // Clear all cache on logout
            await cache.clearAll();
            console.log('Cache cleared on logout');
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

            // Only treat 401 as invalid - other errors might be temporary
            if (response.status === 401) {
                // Real auth error - token invalid or user deleted
                return { valid: false, message: data.message || 'Unauthorized - token invalid' };
            }

            // If response is not successful but not 401, might be server error
            if (!data.success && response.status !== 401) {
                console.warn('⚠️ Backend returned error but not 401, assuming valid:', data.message);
                return { valid: true, message: 'Backend error but not auth-related' };
            }

            return { valid: true, user: data.data?.user };
        } catch (error: any) {
            logError('GET', '/auth/me', error);
            // Network error - don't log out, might just be offline or connection issue
            // Return valid=true so user stays logged in
            return { valid: true, message: `Network error: ${error.message || 'Connection failed'}` };
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

            // Invalidate cache after successful upload so fresh data is fetched
            if (data.success) {
                await cache.remove('cache:user_profile');
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
};

// ==========================================
// Report API
// ==========================================

export const reportApi = {
    /**
     * Report and block a user
     */
    submitReport: async (reportedUserId: number, category: string, reason: string, matchId?: number): Promise<{ success: boolean; message: string }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                message: 'User reported and blocked successfully.',
            };
        }

        try {
            const body = { reportedUserId, category, reason, matchId };
            logRequest('POST', '/report', body);
            const startTime = Date.now();

            const response = await authFetch('/report', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/report', response.status, data, duration);

            // Invalidate matches cache so the user is removed from any lists immediately
            await cache.invalidateMatches();
            // Also invalidate profiles as they shouldn't see them in swipes again
            await cache.invalidateProfiles();

            return data;
        } catch (error) {
            logError('POST', '/report', error);
            throw error;
        }
    }
};

// ==========================================
// User API
// ==========================================

export const userApi = {
    /**
     * Get user profile from backend
     * GET /api/user/profile
     */
    getUserProfile: async (): Promise<{ success: boolean; message?: string; data?: { user: any } }> => {
        // Check cache first
        const cached = await cache.getUserProfile();
        if (cached) {
            console.log('📦 Using cached user profile');
            return { success: true, data: { user: cached } };
        }

        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const mockResponse = {
                success: true,
                data: {
                    user: {
                        id: '1',
                        name: 'User',
                        email: 'user@example.com',
                        phone: '+919876543210',
                        photo: null,
                        additionalPhotos: [],
                        verificationVideo: null,
                        school: null,
                        college: null,
                        office: null,
                        homeLocation: null,
                        situationResponses: null,
                    },
                },
            };
            logMock('userApi.getUserProfile()', mockResponse);
            if (mockResponse.data?.user) {
                await cache.setUserProfile(mockResponse.data.user);
            }
            return mockResponse;
        }

        try {
            logRequest('GET', '/user/profile', undefined);
            const startTime = Date.now();

            const response = await authFetch('/user/profile', {
                method: 'GET',
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('GET', '/user/profile', response.status, data, duration);

            // Cache the user profile
            if (data.success && data.data?.user) {
                await cache.setUserProfile(data.data.user);
            }

            return data;
        } catch (error) {
            logError('GET', '/user/profile', error);
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
        age?: number | null;
        gender?: string;
        height?: number | null;
        latitude?: number | null;
        longitude?: number | null;
        currentCity?: string;
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
            logMock('userApi.updateProfile()', mockResponse);
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

            // Invalidate user profile cache after update
            if (data.success) {
                await cache.remove('cache:user_profile');
                // Also invalidate matches cache as profile changes might affect matches
                await cache.invalidateMatches();
            }

            return data;
        } catch (error) {
            logError('PUT', '/user/profile', error);
            // Don't throw - profile updates should fail silently and retry later
            return { success: false, message: 'Failed to sync profile' };
        }
    },

    /**
     * Delete user account permanently
     * DELETE /api/user/account
     */
    deleteAccount: async (): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            logMock('authApi.deleteAccount()', { success: true });
            return { success: true, message: 'Account deleted' };
        }

        try {
            logRequest('DELETE', '/user/account', undefined);
            const startTime = Date.now();

            const response = await authFetch('/user/account', {
                method: 'DELETE',
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('DELETE', '/user/account', response.status, data, duration);

            return data;
        } catch (error) {
            logError('DELETE', '/user/account', error);
            return { success: false, message: 'Failed to delete account' };
        }
    },

    /**
     * Save dating preferences
     * POST /api/user/dating-preferences
     */
    saveDatingPreferences: async (preferences: {
        relationshipType?: string;
        datingIntention?: string;
        genderPreference?: string[];
        ageMin?: number;
        ageMax?: number;
        distanceMax?: number;
        children?: string;
        familyPlans?: string;
        smoking?: string;
        drinking?: string;
        drugs?: string;
        politics?: string;
        education?: string;
    }): Promise<{ success: boolean; message?: string; data?: any }> => {
        try {
            logRequest('POST', '/user/dating-preferences', preferences);
            const startTime = Date.now();

            const response = await authFetch('/user/dating-preferences', {
                method: 'POST',
                body: JSON.stringify(preferences),
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/user/dating-preferences', response.status, data, duration);

            return data;
        } catch (error) {
            logError('POST', '/user/dating-preferences', error);
            return { success: false, message: 'Failed to save dating preferences' };
        }
    },

    /**
     * Get dating preferences
     * GET /api/user/dating-preferences
     */
    getDatingPreferences: async (): Promise<{ success: boolean; message?: string; data?: any }> => {
        try {
            logRequest('GET', '/user/dating-preferences', undefined);
            const startTime = Date.now();

            const response = await authFetch('/user/dating-preferences', {
                method: 'GET',
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('GET', '/user/dating-preferences', response.status, data, duration);

            return data;
        } catch (error) {
            logError('GET', '/user/dating-preferences', error);
            return { success: false, message: 'Failed to get dating preferences' };
        }
    },

    /**
     * Complete discover onboarding
     * POST /api/user/complete-discover-onboarding
     */
    completeDiscoverOnboarding: async (): Promise<{ success: boolean; message?: string; data?: any }> => {
        try {
            logRequest('POST', '/user/complete-discover-onboarding', undefined);
            const startTime = Date.now();

            const response = await authFetch('/user/complete-discover-onboarding', {
                method: 'POST',
            });

            const data = await response.json();
            const duration = Date.now() - startTime;
            logResponse('POST', '/user/complete-discover-onboarding', response.status, data, duration);

            return data;
        } catch (error) {
            logError('POST', '/user/complete-discover-onboarding', error);
            return { success: false, message: 'Failed to complete discover onboarding' };
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
    getProfiles: async (filters?: {
        ageMin?: number;
        ageMax?: number;
        distanceMax?: number;
        genderPreference?: string;
    }): Promise<Profile[]> => {
        // Check if filters are applied - if so, skip cache and fetch fresh data
        const hasFilters = filters && (
            filters.ageMin !== undefined ||
            filters.ageMax !== undefined ||
            filters.distanceMax !== undefined ||
            (filters.genderPreference && filters.genderPreference !== 'all')
        );

        // Only use cache if no filters are applied
        if (!hasFilters) {
            const cachedWithAge = await cache.getProfilesWithAge();
            if (cachedWithAge && cachedWithAge.data.length > 0) {
                console.log('📦 Using cached profiles (no filters)');
                // Only refresh in background if cache is getting stale (more than 50% of expiry time)
                const PROFILES_CACHE_EXPIRY = 60 * 1000; // 1 minute
                const STALE_THRESHOLD = PROFILES_CACHE_EXPIRY * 0.5; // 50% = 30 seconds
                if (cachedWithAge.age > STALE_THRESHOLD) {
                    console.log('🔄 Profiles cache is getting stale, refreshing in background...');
                    authFetch('/swipe/profiles')
                        .then(response => response.json())
                        .then(data => {
                            if (data.success && data.data) {
                                cache.setProfiles(data.data);
                            }
                        })
                        .catch(err => console.error('Background profile fetch error:', err));
                } else {
                    console.log('✅ Profiles cache is fresh, skipping background refresh');
                }
                return cachedWithAge.data;
            }
        } else {
            console.log('🔍 Filters applied, skipping cache:', filters);
        }

        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            logMock('swipeApi.getProfiles()', MOCK_PROFILES);
            await cache.setProfiles(MOCK_PROFILES);
            return MOCK_PROFILES;
        }

        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters?.ageMin !== undefined) queryParams.append('ageMin', filters.ageMin.toString());
            if (filters?.ageMax !== undefined) queryParams.append('ageMax', filters.ageMax.toString());
            if (filters?.distanceMax !== undefined) queryParams.append('distanceMax', filters.distanceMax.toString());
            if (filters?.genderPreference && filters.genderPreference !== 'all') {
                queryParams.append('genderPreference', filters.genderPreference);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/swipe/profiles?${queryString}` : '/swipe/profiles';
            
            console.log('🌐 Fetching profiles with URL:', url);

            const response = await authFetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get profiles');
            }

            // Only cache unfiltered results
            if (!hasFilters) {
                await cache.setProfiles(data.data);
            }

            console.log(`✅ Fetched ${data.data?.length || 0} profiles with filters`);
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
            // Invalidate profiles cache after swipe
            await cache.invalidateProfiles();
            if (isMatch) {
                // Invalidate matches cache if there's a match
                await cache.invalidateMatches();
            }
            return result;
        }

        try {
            const response = await authFetch('/swipe', {
                method: 'POST',
                body: JSON.stringify({ targetUserId, direction }),
            });

            const data = await response.json();

            // Invalidate profiles cache after swipe
            await cache.invalidateProfiles();
            if (data.data?.isMatch) {
                // Invalidate matches cache if there's a match
                await cache.invalidateMatches();
            }

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
        // Check cache first
        const cachedWithAge = await cache.getMatchesWithAge();
        if (cachedWithAge) {
            console.log('📦 Using cached matches');
            // Only refresh in background if cache is getting stale (more than 50% of expiry time)
            const MATCHES_CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes
            const STALE_THRESHOLD = MATCHES_CACHE_EXPIRY * 0.5; // 50% = 1 minute
            if (cachedWithAge.age > STALE_THRESHOLD) {
                console.log('🔄 Matches cache is getting stale, refreshing in background...');
                authFetch('/swipe/matches')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.data) {
                            cache.setMatches(data.data);
                        }
                    })
                    .catch(err => console.error('Background matches fetch error:', err));
            } else {
                console.log('✅ Matches cache is fresh, skipping background refresh');
            }
            return cachedWithAge.data;
        }

        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            logMock('swipeApi.getMatches()', MOCK_MATCHES);
            await cache.setMatches(MOCK_MATCHES);
            return MOCK_MATCHES;
        }

        try {
            const response = await authFetch('/swipe/matches');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get matches');
            }

            // Cache the matches
            await cache.setMatches(data.data);

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
            // Invalidate matches cache after unmatch
            await cache.invalidateMatches();
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
            // Invalidate matches cache after unmatch
            await cache.invalidateMatches();
            // Also invalidate chat room cache
            await cache.invalidateChatRoom(matchId);
        } catch (error) {
            console.error('Unmatch error:', error);
            throw error;
        }
    },

    /**
     * Reset all swipes for the current user (delete all swipe records)
     */
    resetSwipes: async (): Promise<{ success: boolean; message?: string; data?: { deletedCount: number } }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            logMock('swipeApi.resetSwipes()', { success: true, deletedCount: 5 });
            // Invalidate profiles cache after reset
            await cache.invalidateProfiles();
            return { success: true, data: { deletedCount: 5 } };
        }

        try {
            const response = await authFetch('/swipe/reset', {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to reset swipes');
            }
            // Invalidate profiles cache after reset
            await cache.invalidateProfiles();
            return data;
        } catch (error) {
            console.error('Reset swipes error:', error);
            throw error;
        }
    },

    /**
     * Get users who have liked the current user (pending likes)
     */
    getWhoLikedMe: async (): Promise<Profile[]> => {
        // Check cache first
        const cachedWithAge = await cache.getWhoLikedMeWithAge();
        if (cachedWithAge) {
            console.log('📦 Using cached who liked me');
            // Only refresh in background if cache is getting stale (more than 50% of expiry time)
            const WHO_LIKED_ME_CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes
            const STALE_THRESHOLD = WHO_LIKED_ME_CACHE_EXPIRY * 0.5; // 50% = 1 minute
            if (cachedWithAge.age > STALE_THRESHOLD) {
                console.log('🔄 Who liked me cache is getting stale, refreshing in background...');
                authFetch('/swipe/likes')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.data) {
                            cache.setWhoLikedMe(data.data);
                        }
                    })
                    .catch(err => console.error('Background who liked me fetch error:', err));
            } else {
                console.log('✅ Who liked me cache is fresh, skipping background refresh');
            }
            return cachedWithAge.data;
        }

        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            // Return subset of mock profiles as "who liked me"
            const mockLikes = MOCK_PROFILES.slice(0, 2).map(p => ({
                ...p,
                likedAt: new Date().toISOString(),
            }));
            logMock('swipeApi.getWhoLikedMe()', mockLikes);
            await cache.setWhoLikedMe(mockLikes);
            return mockLikes;
        }

        try {
            const response = await authFetch('/swipe/likes');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get likes');
            }

            // Cache the likes
            await cache.setWhoLikedMe(data.data);

            return data.data;
        } catch (error) {
            console.error('Get who liked me error:', error);
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
        // Check cache first (shorter expiry for chat)
        const cachedWithAge = await cache.getChatRoomWithAge(matchId);
        if (cachedWithAge) {
            console.log('📦 Using cached chat room');
            // Only refresh in background if cache is getting stale (more than 50% of expiry time)
            // Chat room cache expires in 30 seconds, so refresh if older than 15 seconds
            const CHAT_CACHE_EXPIRY = 30 * 1000; // 30 seconds
            const STALE_THRESHOLD = CHAT_CACHE_EXPIRY * 0.5; // 50% = 15 seconds
            if (cachedWithAge.age > STALE_THRESHOLD) {
                console.log('🔄 Cache is getting stale, refreshing in background...');
                authFetch(`/chat/${matchId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.data) {
                            cache.setChatRoom(matchId, data.data);
                        }
                    })
                    .catch(err => console.error('Background chat fetch error:', err));
            } else {
                console.log('✅ Cache is fresh, skipping background refresh');
            }
            return cachedWithAge.data;
        }

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
            await cache.setChatRoom(matchId, result);
            return result;
        }

        try {
            const response = await authFetch(`/chat/${matchId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get chat room');
            }

            // Cache the chat room
            await cache.setChatRoom(matchId, data.data);

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
            // Invalidate chat room cache after sending message
            await cache.invalidateChatRoom(matchId);
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

            // Invalidate chat room cache after sending message
            await cache.invalidateChatRoom(matchId);

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

// ==========================================
// Calls API
// ==========================================

export const callsApi = {
    /**
     * Initiate a new call
     */
    initiateCall: async (matchId: number, type: 'voice' | 'video' = 'voice'): Promise<{
        callId: number;
        channelName: string;
        token: string;
        appId: string;
        receiver: { id: number; name: string; photo?: string };
    }> => {
        try {
            const response = await authFetch('/calls/initiate', {
                method: 'POST',
                body: JSON.stringify({ matchId, type }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to initiate call');
            }

            return data.data;
        } catch (error) {
            console.error('Initiate call error:', error);
            throw error;
        }
    },

    /**
     * Answer an incoming call
     */
    answerCall: async (callId: number): Promise<{ callId: number; channelName: string }> => {
        try {
            const response = await authFetch(`/calls/${callId}/answer`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to answer call');
            }

            return data.data;
        } catch (error) {
            console.error('Answer call error:', error);
            throw error;
        }
    },

    /**
     * Decline an incoming call
     */
    declineCall: async (callId: number): Promise<void> => {
        try {
            const response = await authFetch(`/calls/${callId}/decline`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to decline call');
            }
        } catch (error) {
            console.error('Decline call error:', error);
            throw error;
        }
    },

    /**
     * End an active call
     */
    endCall: async (callId: number): Promise<{ callId: number; duration?: number }> => {
        try {
            const response = await authFetch(`/calls/${callId}/end`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to end call');
            }

            return data.data;
        } catch (error) {
            console.error('End call error:', error);
            throw error;
        }
    },
};

// ==========================================
// AI Host API
// ==========================================

export const hostApi = {
    /**
     * Get AI host session for a match
     */
    getHostSession: async (matchId: number): Promise<{ success: boolean; data?: ChatHostSession }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                success: true,
                data: {
                    id: 1,
                    chatRoomId: matchId,
                    matchId,
                    status: 'pending',
                    currentStage: 'STAGE_0',
                    user1OptIn: false,
                    user2OptIn: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            };
        }

        try {
            const response = await authFetch(`/host/${matchId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get host session error:', error);
            throw error;
        }
    },

    /**
     * Opt-in to AI host
     */
    optIn: async (matchId: number): Promise<{ success: boolean; data?: ChatHostSession }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
        }

        try {
            const response = await authFetch(`/host/${matchId}/opt-in`, {
                method: 'POST',
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Opt-in error:', error);
            throw error;
        }
    },

    /**
     * Opt-out of AI host
     */
    optOut: async (matchId: number): Promise<{ success: boolean }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
        }

        try {
            const response = await authFetch(`/host/${matchId}/opt-out`, {
                method: 'POST',
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Opt-out error:', error);
            throw error;
        }
    },

    /**
     * Submit answer to host question
     */
    submitAnswer: async (matchId: number, answer: string, questionId?: string): Promise<{ success: boolean }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
        }

        try {
            const response = await authFetch(`/host/${matchId}/answer`, {
                method: 'POST',
                body: JSON.stringify({ answer, questionId }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Submit answer error:', error);
            throw error;
        }
    },

    /**
     * Get host messages
     */
    getHostMessages: async (matchId: number): Promise<{ success: boolean; data?: ChatHostMessage[] }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true, data: [] };
        }

        try {
            const response = await authFetch(`/host/${matchId}/messages`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get host messages error:', error);
            throw error;
        }
    },

    /**
     * Exit host session
     */
    exitHost: async (matchId: number): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
        }

        try {
            const response = await authFetch(`/host/${matchId}/exit`, {
                method: 'POST',
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Exit host error:', error);
            throw error;
        }
    },
};

// ==========================================
// Referral API
// ==========================================

export const referralApi = {
    /**
     * Get referral stats and rewards
     */
    getStats: async (): Promise<{ success: boolean; data?: { stats: any, rewards: any[] } }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                success: true,
                data: {
                    stats: {
                        referralCode: 'METLL-MOCK123',
                        totalReferrals: 5,
                        rewardsEarned: 1,
                        rewardsUsed: 0,
                    },
                    rewards: [
                        { id: 1, type: 'coffee_date', status: 'available', earnedAt: new Date().toISOString() }
                    ]
                }
            };
        }

        try {
            const response = await authFetch('/referrals/stats');
            return await response.json();
        } catch (error) {
            logError('GET', '/referrals/stats', error);
            throw error;
        }
    },

    /**
     * Redeem a reward
     */
    redeemReward: async (): Promise<{ success: boolean; message?: string; data?: { reward: any } }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                success: true,
                message: 'Reward redeemed!',
                data: { reward: { id: 1, status: 'used', usedAt: new Date().toISOString() } }
            };
        }

        try {
            const response = await authFetch('/referrals/redeem', { method: 'POST' });
            return await response.json();
        } catch (error) {
            logError('POST', '/referrals/redeem', error);
            throw error;
        }
    }
};

// ==========================================
// Media API (Voice Notes & GIFs)
// ==========================================

export const mediaApi = {
    /**
     * Upload voice note to server
     */
    uploadVoiceNote: async (audioUri: string, waveformData?: number[]): Promise<{
        url: string;
        duration: number;
        publicId: string;
        waveformData?: number[];
    }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                url: audioUri,
                duration: 5,
                publicId: `mock_voice_${Date.now()}`,
                waveformData: waveformData || [],
            };
        }

        try {
            const formData = new FormData();
            const filename = audioUri.split('/').pop() || 'voice_note.m4a';

            // @ts-ignore - ReactNative FormData
            formData.append('audio', {
                uri: audioUri,
                name: filename,
                type: 'audio/m4a',
            });

            if (waveformData) {
                formData.append('waveformData', JSON.stringify(waveformData));
            }

            const response = await authFetchFormData('/media/voice-note', formData);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to upload voice note');
            }

            return data.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Send voice note message
     */
    sendVoiceNote: async (
        matchId: number,
        audioUrl: string,
        duration: number,
        waveformData?: number[],
        transcript?: string
    ): Promise<any> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                id: Date.now(),
                type: 'voice_note',
                mediaUrl: audioUrl,
                duration,
                waveformData,
                transcript,
                isOwn: true,
                createdAt: new Date().toISOString(),
            };
        }

        try {
            const response = await authFetch('/media/voice-note/send', {
                method: 'POST',
                body: JSON.stringify({
                    matchId,
                    audioUrl,
                    duration,
                    waveformData,
                    transcript,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to send voice note');
            }

            return data.data;
        } catch (error) {
            logError('POST', '/media/voice-note/send', error);
            throw error;
        }
    },

    /**
     * Search GIFs
     */
    searchGifs: async (query: string, limit: number = 20, offset: number = 0): Promise<{
        gifs: Array<{
            id: string;
            title: string;
            url: string;
            previewUrl: string;
            width: number;
            height: number;
            originalUrl?: string;
        }>;
        pagination: { offset: number; count: number; total_count: number };
    }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                gifs: [],
                pagination: { offset: 0, count: 0, total_count: 0 },
            };
        }

        try {
            const response = await authFetch(`/media/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to search GIFs');
            }

            return data.data;
        } catch (error) {
            logError('GET', '/media/gifs/search', error);
            throw error;
        }
    },

    /**
     * Get trending GIFs
     */
    getTrendingGifs: async (limit: number = 20, offset: number = 0): Promise<{
        gifs: Array<{
            id: string;
            title: string;
            url: string;
            previewUrl: string;
            width: number;
            height: number;
        }>;
        pagination: { offset: number; count: number; total_count: number };
    }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                gifs: [],
                pagination: { offset: 0, count: 0, total_count: 0 },
            };
        }

        try {
            const response = await authFetch(`/media/gifs/trending?limit=${limit}&offset=${offset}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get trending GIFs');
            }

            return data.data;
        } catch (error) {
            logError('GET', '/media/gifs/trending', error);
            throw error;
        }
    },



    /**
     * Send GIF message
     */
    sendGif: async (
        matchId: number,
        gifUrl: string,
        gifId: string,
        width?: number,
        height?: number
    ): Promise<any> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                id: Date.now(),
                type: 'gif',
                mediaUrl: gifUrl,
                gifId,
                gifWidth: width,
                gifHeight: height,
                isOwn: true,
                createdAt: new Date().toISOString(),
            };
        }

        try {
            const response = await authFetch('/media/gif/send', {
                method: 'POST',
                body: JSON.stringify({
                    matchId,
                    gifUrl,
                    gifId,
                    width,
                    height,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to send GIF');
            }

            return data.data;
        } catch (error) {
            logError('POST', '/media/gif/send', error);
            throw error;
        }
    },
};

// ==========================================
// Verification API
// ==========================================

export const verificationApi = {
    /**
     * Get verification status
     */
    getStatus: async (): Promise<{
        profilePhoto: string | null;
        isVerified: boolean;
        verificationStatus: 'pending' | 'photo_uploaded' | 'liveness_pending' | 'verified' | 'failed';
        verificationScore: number | null;
        verificationDate: string | null;
        nextStep: string | null;
        progress: number;
    }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                profilePhoto: null,
                isVerified: false,
                verificationStatus: 'pending',
                verificationScore: null,
                verificationDate: null,
                nextStep: 'photo',
                progress: 0,
            };
        }

        try {
            const response = await authFetch('/verification/status');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get verification status');
            }

            return data.data;
        } catch (error) {
            console.error('Get verification status error:', error);
            throw error;
        }
    },

    /**
     * Upload verification photo
     */
    uploadPhoto: async (photoUri: string): Promise<{
        profilePhoto: string;
        verificationStatus: string;
        qualityScore: number;
        nextStep: string;
    }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                profilePhoto: photoUri,
                verificationStatus: 'photo_uploaded',
                qualityScore: 95,
                nextStep: 'liveness',
            };
        }

        try {
            const formData = new FormData();
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : 'jpg';

            // @ts-ignore
            formData.append('photo', {
                uri: photoUri,
                name: filename,
                type: `image/${ext}`,
            });

            const token = await getAuthToken();
            const response = await fetch(`${API_BASE_URL}/verification/photo`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to upload photo');
            }

            return data.data;
        } catch (error) {
            console.error('Upload verification photo error:', error);
            throw error;
        }
    },

    /**
     * Verify liveness with video
     */
    verifyLiveness: async (videoUri: string): Promise<{
        isVerified: boolean;
        verificationStatus: string;
        verificationScore: number;
        verificationDate: string;
        videoUrl?: string;
    }> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return {
                isVerified: true,
                verificationStatus: 'verified',
                verificationScore: 98,
                verificationDate: new Date().toISOString(),
                videoUrl: videoUri,
            };
        }

        try {
            const formData = new FormData();
            const filename = videoUri.split('/').pop() || 'video.mp4';

            // @ts-ignore
            formData.append('video', {
                uri: videoUri,
                name: filename,
                type: 'video/mp4',
            });

            const token = await getAuthToken();
            const response = await fetch(`${API_BASE_URL}/verification/liveness`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                // Return data even if success is false (for failed verification details)
                if (data.data) {
                    throw new Error(data.message || 'Verification failed');
                }
                throw new Error(data.message || 'Failed to verify liveness');
            }

            return data.data;
        } catch (error: any) {
            console.error('Liveness verification error:', error);
            throw error;
        }
    },
};

// ==========================================
// Notification API
// ==========================================

export interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    imageUrl?: string;
    priority: string;
    isRead: boolean;
    isSent: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const notificationApi = {
    /**
     * Register FCM push token with backend
     */
    registerToken: async (
        token: string,
        platform: 'android' | 'ios' | 'web',
        deviceId?: string
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await authFetch('/notifications/register', {
                method: 'POST',
                body: JSON.stringify({ token, platform, deviceId }),
            });
            return await response.json();
        } catch (error) {
            console.error('Register token error:', error);
            return { success: false, message: 'Failed to register token' };
        }
    },

    /**
     * Unregister FCM token (on logout)
     */
    unregisterToken: async (token: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await authFetch('/notifications/unregister', {
                method: 'DELETE',
                body: JSON.stringify({ token }),
            });
            return await response.json();
        } catch (error) {
            console.error('Unregister token error:', error);
            return { success: false, message: 'Failed to unregister token' };
        }
    },

    /**
     * Get notifications (paginated)
     */
    getNotifications: async (page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: NotificationsResponse }> => {
        try {
            const response = await authFetch(`/notifications?page=${page}&limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Get notifications error:', error);
            return { success: false };
        }
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (): Promise<{ success: boolean; data?: { count: number } }> => {
        try {
            const response = await authFetch('/notifications/unread-count');
            return await response.json();
        } catch (error) {
            console.error('Get unread count error:', error);
            return { success: false };
        }
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (notificationId: number): Promise<{ success: boolean }> => {
        try {
            const response = await authFetch(`/notifications/${notificationId}/read`, {
                method: 'PUT',
            });
            return await response.json();
        } catch (error) {
            console.error('Mark as read error:', error);
            return { success: false };
        }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<{ success: boolean }> => {
        try {
            const response = await authFetch('/notifications/read-all', {
                method: 'PUT',
            });
            return await response.json();
        } catch (error) {
            console.error('Mark all as read error:', error);
            return { success: false };
        }
    },
};

// Export API URL for Socket.io
export const getApiBaseUrl = (): string => {
    // Return base URL without /api for Socket.io
    return API_BASE_URL.replace('/api', '');
};

export { getAuthToken };
