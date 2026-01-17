import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Notification } from '../services/api';

// Get icon based on notification type
const getNotificationIcon = (type: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
        case 'match':
            return { name: 'heart', color: '#FF6B6B' };
        case 'message':
            return { name: 'chatbubble', color: '#4ECDC4' };
        case 'voice_note':
            return { name: 'mic', color: '#9B59B6' };
        case 'call':
            return { name: 'call', color: '#3498DB' };
        case 'like':
            return { name: 'heart-outline', color: '#E74C3C' };
        case 'profile_view':
            return { name: 'eye', color: '#95A5A6' };
        case 'referral_reward':
        case 'reward_used':
            return { name: 'gift', color: '#F39C12' };
        case 'report':
            return { name: 'shield-checkmark', color: '#27AE60' };
        case 'unmatch':
            return { name: 'heart-dislike', color: '#7F8C8D' };
        default:
            return { name: 'notifications', color: '#3498DB' };
    }
};

// Format time ago
const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

interface NotificationItemProps {
    notification: Notification;
    onPress: () => void;
    colors: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, colors }) => {
    const icon = getNotificationIcon(notification.type);

    return (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                { backgroundColor: notification.isRead ? colors.background : colors.cardBackground },
                !notification.isRead && styles.unreadItem,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                {notification.imageUrl ? (
                    <Image source={{ uri: notification.imageUrl }} style={styles.notificationImage} />
                ) : (
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                )}
            </View>

            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                    {notification.title}
                </Text>
                <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
                    {notification.body}
                </Text>
                <Text style={[styles.time, { color: colors.textSecondary }]}>
                    {formatTimeAgo(notification.createdAt)}
                </Text>
            </View>

            {!notification.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
            )}
        </TouchableOpacity>
    );
};

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { colors } = useTheme();
    const {
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    const handleNotificationPress = useCallback((notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Navigate based on type
        const data = notification.data as Record<string, string> | undefined;
        switch (notification.type) {
            case 'match':
            case 'unmatch':
                navigation.navigate('Matches');
                break;
            case 'message':
            case 'voice_note':
                if (data?.matchId) {
                    navigation.navigate('Chat', { matchId: parseInt(data.matchId) });
                } else {
                    navigation.navigate('Matches');
                }
                break;
            case 'call':
                navigation.navigate('Matches');
                break;
            case 'like':
            case 'profile_view':
                navigation.navigate('Likes');
                break;
            case 'referral_reward':
            case 'reward_used':
                navigation.navigate('ProfileMain');
                break;
            default:
                break;
        }
    }, [navigation, markAsRead]);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Notifications
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                You'll see notifications here when you get matches, messages, and more!
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    Notifications
                </Text>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                        <Text style={[styles.markAllText, { color: colors.accent }]}>
                            Mark all read
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Notification List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={() => handleNotificationPress(item)}
                        colors={colors}
                    />
                )}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
                ListEmptyComponent={!loading ? renderEmptyState : null}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshNotifications}
                        tintColor={colors.primary}
                    />
                }
                ItemSeparatorComponent={() => (
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                )}
            />

            {loading && notifications.length === 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
    },
    markAllButton: {
        padding: 8,
    },
    markAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    unreadItem: {
        borderLeftWidth: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 8,
    },
    separator: {
        height: 1,
        marginLeft: 76,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyList: {
        flexGrow: 1,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NotificationsScreen;
