import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { notificationApi, Notification } from '../services/api';
import {
    setupPushNotifications,
    setupNotificationChannels,
    unregisterTokenFromBackend,
    addNotificationReceivedListener,
    addNotificationResponseListener,
    getNavigationFromNotification,
    setBadgeCount,
} from '../services/notification';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    setupNotifications: () => Promise<boolean>;
    cleanupNotifications: () => Promise<void>;
    pendingNavigation: { screen: string; params?: Record<string, any> } | null;
    clearPendingNavigation: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<{ screen: string; params?: Record<string, any> } | null>(null);

    const notificationReceivedListener = useRef<Notifications.Subscription>();
    const notificationResponseListener = useRef<Notifications.Subscription>();

    // Fetch notifications from backend
    const refreshNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const [notifResult, countResult] = await Promise.all([
                notificationApi.getNotifications(1, 50),
                notificationApi.getUnreadCount(),
            ]);

            if (notifResult.success && notifResult.data) {
                setNotifications(notifResult.data.notifications);
            }

            if (countResult.success && countResult.data) {
                setUnreadCount(countResult.data.count);
                await setBadgeCount(countResult.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            const result = await notificationApi.markAsRead(notificationId);
            if (result.success) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                await setBadgeCount(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [unreadCount]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const result = await notificationApi.markAllAsRead();
            if (result.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                await setBadgeCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    // Setup push notifications
    const setupNotifications = useCallback(async (): Promise<boolean> => {
        try {
            await setupNotificationChannels();
            const success = await setupPushNotifications();

            if (success) {
                // Refresh notifications after setup
                await refreshNotifications();
            }

            return success;
        } catch (error) {
            console.error('Failed to setup notifications:', error);
            return false;
        }
    }, [refreshNotifications]);

    // Cleanup notifications (on logout)
    const cleanupNotifications = useCallback(async () => {
        await unregisterTokenFromBackend();
        setNotifications([]);
        setUnreadCount(0);
        await setBadgeCount(0);
    }, []);

    // Clear pending navigation
    const clearPendingNavigation = useCallback(() => {
        setPendingNavigation(null);
    }, []);

    // Handle foreground notification received
    const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
        console.log('📬 Foreground notification received:', notification.request.content.title);
        // Refresh to get latest notifications
        refreshNotifications();
    }, [refreshNotifications]);

    // Handle notification tap (background/killed)
    const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as Record<string, string>;
        console.log('👆 Notification tapped:', data);

        const navParams = getNavigationFromNotification(data);
        if (navParams) {
            setPendingNavigation(navParams);
        }

        // Mark as read if we have the notification ID
        if (data.notificationId) {
            markAsRead(parseInt(data.notificationId));
        }
    }, [markAsRead]);

    // Set up notification listeners
    useEffect(() => {
        notificationReceivedListener.current = addNotificationReceivedListener(handleNotificationReceived);
        notificationResponseListener.current = addNotificationResponseListener(handleNotificationResponse);

        return () => {
            notificationReceivedListener.current?.remove();
            notificationResponseListener.current?.remove();
        };
    }, [handleNotificationReceived, handleNotificationResponse]);

    // Refresh on app foreground
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                refreshNotifications();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [refreshNotifications]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        setupNotifications,
        cleanupNotifications,
        pendingNavigation,
        clearPendingNavigation,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;
