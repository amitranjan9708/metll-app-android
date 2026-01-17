import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationApi } from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Storage key for FCM token
const FCM_TOKEN_KEY = 'fcmPushToken';

/**
 * Request notification permissions and get push token
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    if (!Device.isDevice) {
        console.log('⚠️ Push notifications require a physical device');
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return null;
    }

    // Get the push token
    try {
        // For Expo, we use getExpoPushTokenAsync for Expo push service
        // For FCM directly, use getDevicePushTokenAsync
        const tokenData = await Notifications.getDevicePushTokenAsync();
        const token = tokenData.data;

        console.log('✅ Got FCM push token:', token.substring(0, 20) + '...');

        // Save token locally
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

        return token;
    } catch (error) {
        console.error('❌ Failed to get push token:', error);
        return null;
    }
};

/**
 * Register push token with backend
 */
export const registerTokenWithBackend = async (token: string): Promise<boolean> => {
    try {
        const platform = Platform.OS as 'android' | 'ios' | 'web';
        const deviceId = Device.modelId || undefined;

        const result = await notificationApi.registerToken(token, platform, deviceId);

        if (result.success) {
            console.log('✅ Push token registered with backend');
            return true;
        } else {
            console.error('❌ Failed to register token:', result.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error registering token with backend:', error);
        return false;
    }
};

/**
 * Unregister push token from backend (call on logout)
 */
export const unregisterTokenFromBackend = async (): Promise<boolean> => {
    try {
        const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
        if (!token) {
            console.log('ℹ️ No FCM token to unregister');
            return true;
        }

        const result = await notificationApi.unregisterToken(token);

        if (result.success) {
            await AsyncStorage.removeItem(FCM_TOKEN_KEY);
            console.log('✅ Push token unregistered');
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ Error unregistering token:', error);
        return false;
    }
};

/**
 * Full push notification setup - call after login
 */
export const setupPushNotifications = async (): Promise<boolean> => {
    const token = await registerForPushNotificationsAsync();

    if (!token) {
        console.log('⚠️ Push notification setup failed - no token');
        return false;
    }

    const registered = await registerTokenWithBackend(token);
    return registered;
};

/**
 * Set up Android notification channels
 */
export const setupNotificationChannels = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;

    // Critical notifications (matches, calls)
    await Notifications.setNotificationChannelAsync('metll_critical', {
        name: 'Matches & Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: 'default',
    });

    // High priority (messages)
    await Notifications.setNotificationChannelAsync('metll_high', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
        sound: 'default',
    });

    // Medium priority (likes, rewards)
    await Notifications.setNotificationChannelAsync('metll_medium', {
        name: 'Activity',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
    });

    // Low priority (profile views)
    await Notifications.setNotificationChannelAsync('metll_low', {
        name: 'Updates',
        importance: Notifications.AndroidImportance.LOW,
    });

    console.log('✅ Android notification channels configured');
};

/**
 * Add listener for foreground notifications
 */
export const addNotificationReceivedListener = (
    callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
    return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add listener for notification taps (background/killed)
 */
export const addNotificationResponseListener = (
    callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
    return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get the notification that launched the app (if any)
 */
export const getLastNotificationResponse = async (): Promise<Notifications.NotificationResponse | null> => {
    return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
    await Notifications.setBadgeCountAsync(count);
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
    await Notifications.dismissAllNotificationsAsync();
};

/**
 * Handle notification data and navigate
 * Returns navigation params based on notification type
 */
export const getNavigationFromNotification = (
    data: Record<string, string>
): { screen: string; params?: Record<string, any> } | null => {
    const { type, matchId, callId, notificationId } = data;

    switch (type) {
        case 'match':
            return { screen: 'Matches' };
        case 'message':
        case 'voice_note':
            return matchId
                ? { screen: 'Chat', params: { matchId: parseInt(matchId) } }
                : { screen: 'Matches' };
        case 'call':
            return callId
                ? { screen: 'IncomingCall', params: { callId: parseInt(callId) } }
                : { screen: 'Matches' };
        case 'like':
        case 'profile_view':
            return { screen: 'Likes' };
        case 'referral_reward':
        case 'reward_used':
            return { screen: 'Profile' };
        case 'report':
            return { screen: 'Settings' };
        case 'unmatch':
            return { screen: 'Matches' };
        default:
            return { screen: 'Notifications' };
    }
};
