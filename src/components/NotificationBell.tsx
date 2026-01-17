import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface NotificationBellProps {
    onPress: () => void;
    size?: number;
    color?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onPress, size = 24, color }) => {
    const { colors } = useTheme();
    const { unreadCount } = useNotifications();

    const iconColor = color || colors.textPrimary;

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <Ionicons name="notifications-outline" size={size} color={iconColor} />
            {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default NotificationBell;
