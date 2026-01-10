import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { swipeApi } from '../services/api';
import { MatchData } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const MatchesScreen: React.FC = () => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const navigation = useNavigation<any>();

    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMatches = async () => {
        try {
            const data = await swipeApi.getMatches();
            setMatches(data);
        } catch (error) {
            console.error('Failed to load matches:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMatches();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadMatches();
    };

    const handleMatchPress = (matchId: number, matchedUser: any) => {
        navigation.navigate('Chat', {
            matchId,
            userName: matchedUser.name,
            userPhoto: matchedUser.profilePhoto || matchedUser.images[0]
        });
    };

    const renderMatchItem = ({ item }: { item: MatchData }) => {
        const hasUnread = (item.unreadCount || 0) > 0;
        const lastMsgTime = item.lastMessage
            ? formatDistanceToNow(new Date(item.lastMessage.createdAt), { addSuffix: true })
            : formatDistanceToNow(new Date(item.matchedAt), { addSuffix: true });

        return (
            <TouchableOpacity
                style={styles.matchItem}
                onPress={() => handleMatchPress(item.id, item.matchedUser)}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.matchedUser.profilePhoto || item.matchedUser.images[0] || 'https://via.placeholder.com/60' }}
                        style={styles.avatar}
                    />
                    {hasUnread && <View style={styles.activeBadge} />}
                </View>

                <View style={styles.matchInfo}>
                    <View style={styles.matchHeader}>
                        <Text style={[styles.name, hasUnread && styles.nameUnread]}>
                            {item.matchedUser.name}
                        </Text>
                        <Text style={styles.time}>{lastMsgTime}</Text>
                    </View>

                    <Text
                        style={[styles.messagePreview, hasUnread && styles.messageUnread]}
                        numberOfLines={1}
                    >
                        {item.lastMessage?.content || "New match! Say hello 👋"}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />;

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons name="heart-dislike-outline" size={60} color={theme.colors.border} />
                </View>
                <Text style={styles.emptyTitle}>No matches yet</Text>
                <Text style={styles.emptySubtitle}>Start swiping to find people you vibe with!</Text>
                <TouchableOpacity
                    style={styles.findMatchButton}
                    onPress={() => navigation.navigate('Date')}
                >
                    <Text style={styles.findMatchButtonText}>Find Matches</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Matches</Text>
                {/* <Ionicons name="search" size={24} color={theme.colors.textPrimary} /> */}
            </View>

            <FlatList
                data={matches}
                renderItem={renderMatchItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, matches.length === 0 && { flex: 1 }]}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
            />
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50, // More top padding for status bar
        paddingBottom: 20,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        ...theme.typography.heading,
        fontSize: 28,
    },
    listContent: {
        paddingVertical: 10,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0', // Very light divider
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eee',
    },
    activeBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    matchInfo: {
        flex: 1,
        marginRight: 10,
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    nameUnread: {
        fontWeight: '800',
    },
    time: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    messagePreview: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    messageUnread: {
        color: theme.colors.textPrimary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    findMatchButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        ...theme.shadows.md,
    },
    findMatchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
