import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { swipeApi } from '../services/api';
import { MatchData, Profile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface LikerProfile extends Profile {
    likedAt?: string;
    additionalPhotos?: string[];
    school?: { name: string; city?: string; class?: string };
    college?: { name: string; department?: string; location?: string };
    office?: { name: string; designation?: string; department?: string };
}

export const MatchesScreen: React.FC = () => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const navigation = useNavigation<any>();

    const [activeTab, setActiveTab] = useState<'matches' | 'likes'>('matches');
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [likers, setLikers] = useState<LikerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<LikerProfile | null>(null);
    const [likeLoading, setLikeLoading] = useState(false);

    const loadData = async () => {
        try {
            const [matchesData, likersData] = await Promise.all([
                swipeApi.getMatches(),
                swipeApi.getWhoLikedMe(),
            ]);
            setMatches(matchesData);
            setLikers(likersData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleMatchPress = (matchId: number, matchedUser: any) => {
        navigation.navigate('Chat', {
            matchId,
            userName: matchedUser.name,
            userPhoto: matchedUser.profilePhoto || matchedUser.images?.[0]
        });
    };

    const handleLikeBack = async (profile: LikerProfile) => {
        setLikeLoading(true);
        try {
            const result = await swipeApi.swipe(profile.id, 'like');
            if (result.data?.isMatch) {
                Alert.alert(
                    "It's a Match! 🎉",
                    `You and ${profile.name} like each other!`,
                    [
                        {
                            text: 'Send a Message',
                            onPress: () => {
                                setSelectedProfile(null);
                                if (result.data?.match) {
                                    navigation.navigate('Chat', {
                                        matchId: result.data.match.id,
                                        userName: profile.name,
                                        userPhoto: profile.profilePhoto || profile.images?.[0]
                                    });
                                }
                                loadData();
                            }
                        },
                        {
                            text: 'Keep Browsing',
                            onPress: () => {
                                setSelectedProfile(null);
                                loadData();
                            },
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Like back error:', error);
            Alert.alert('Error', 'Failed to like back');
        } finally {
            setLikeLoading(false);
        }
    };

    const handlePass = async (profile: LikerProfile) => {
        setLikeLoading(true);
        try {
            await swipeApi.swipe(profile.id, 'pass');
            setSelectedProfile(null);
            // Remove from likers list
            setLikers(prev => prev.filter(l => l.id !== profile.id));
        } catch (error) {
            console.error('Pass error:', error);
        } finally {
            setLikeLoading(false);
        }
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
                        source={{ uri: item.matchedUser.profilePhoto || item.matchedUser.images?.[0] || 'https://via.placeholder.com/60' }}
                        style={styles.avatar}
                    />
                    {hasUnread && <View style={styles.activeBadge} />}
                </View>

                <View style={styles.matchInfo}>
                    <View style={styles.matchHeader}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.name, hasUnread && styles.nameUnread]}>
                                {item.matchedUser.name}
                            </Text>
                            {item.coffeeTicket && (
                                <View style={styles.coffeeTicketBadge}>
                                    <Text style={styles.coffeeTicketEmoji}>☕</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.time}>{lastMsgTime}</Text>
                    </View>

                    {item.coffeeTicket ? (
                        <Text style={styles.coffeeTicketText} numberOfLines={1}>
                            {/* add here a coffee emoji */}
                            <Text style={styles.coffeeTicketEmoji}>☕</Text> Yay! Coffee date on us!
                        </Text>
                    ) : (
                        <Text
                            style={[styles.messagePreview, hasUnread && styles.messageUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage?.content || "New match! Say hello 👋"}
                        </Text>
                    )}
                </View>

                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </TouchableOpacity>
        );
    };

    const renderLikerItem = ({ item }: { item: LikerProfile }) => {
        const likedTime = item.likedAt
            ? formatDistanceToNow(new Date(item.likedAt), { addSuffix: true })
            : 'recently';

        return (
            <TouchableOpacity
                style={styles.likerCard}
                onPress={() => setSelectedProfile(item)}
            >
                <Image
                    source={{ uri: item.profilePhoto || item.images?.[0] || 'https://via.placeholder.com/120' }}
                    style={styles.likerImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.likerGradient}
                >
                    <View style={styles.likerInfo}>
                        <Text style={styles.likerName}>{item.name}, {item.age}</Text>
                        <Text style={styles.likerTime}>Liked you {likedTime}</Text>
                    </View>
                    <View style={styles.heartBadge}>
                        <Ionicons name="heart" size={16} color="#fff" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />;

        if (activeTab === 'likes') {
            return (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="heart-outline" size={60} color={theme.colors.border} />
                    </View>
                    <Text style={styles.emptyTitle}>No likes yet</Text>
                    <Text style={styles.emptySubtitle}>When someone likes your profile, they'll appear here!</Text>
                </View>
            );
        }

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

    const renderProfileModal = () => {
        if (!selectedProfile) return null;

        const photos = [
            selectedProfile.profilePhoto,
            ...(selectedProfile.additionalPhotos || []),
            ...(selectedProfile.images || []),
        ].filter(Boolean);

        return (
            <Modal
                visible={!!selectedProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedProfile(null)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalClose}
                        onPress={() => setSelectedProfile(null)}
                    >
                        <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                        {/* Photos */}
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.photoCarousel}
                        >
                            {photos.map((photo, idx) => (
                                <Image
                                    key={idx}
                                    source={{ uri: photo || 'https://via.placeholder.com/300' }}
                                    style={styles.modalPhoto}
                                />
                            ))}
                        </ScrollView>

                        {/* Profile Info */}
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalName}>{selectedProfile.name}, {selectedProfile.age}</Text>
                                {selectedProfile.isVerified && (
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    </View>
                                )}
                            </View>

                            {selectedProfile.bio && (
                                <Text style={styles.modalBio}>{selectedProfile.bio}</Text>
                            )}

                            {/* Details */}
                            <View style={styles.detailsSection}>
                                {selectedProfile.school && (
                                    <View style={styles.detailItem}>
                                        <Ionicons name="book-outline" size={18} color={theme.colors.textSecondary} />
                                        <Text style={styles.detailText}>{selectedProfile.school.name}</Text>
                                    </View>
                                )}
                                {selectedProfile.college && (
                                    <View style={styles.detailItem}>
                                        <Ionicons name="school-outline" size={18} color={theme.colors.textSecondary} />
                                        <Text style={styles.detailText}>{selectedProfile.college.name}</Text>
                                    </View>
                                )}
                                {selectedProfile.office && (
                                    <View style={styles.detailItem}>
                                        <Ionicons name="briefcase-outline" size={18} color={theme.colors.textSecondary} />
                                        <Text style={styles.detailText}>{selectedProfile.office.name}</Text>
                                    </View>
                                )}
                            </View>

                            {selectedProfile.likedAt && (
                                <View style={styles.likedAtBanner}>
                                    <Ionicons name="heart" size={18} color="#EF4444" />
                                    <Text style={styles.likedAtText}>
                                        Liked you {formatDistanceToNow(new Date(selectedProfile.likedAt), { addSuffix: true })}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.passBtn]}
                            onPress={() => handlePass(selectedProfile)}
                            disabled={likeLoading}
                        >
                            <Ionicons name="close" size={32} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.likeBtn]}
                            onPress={() => handleLikeBack(selectedProfile)}
                            disabled={likeLoading}
                        >
                            {likeLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Ionicons name="heart" size={32} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Matches</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
                    onPress={() => setActiveTab('matches')}
                >
                    <Ionicons
                        name="chatbubbles"
                        size={18}
                        color={activeTab === 'matches' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>
                        Matches ({matches.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'likes' && styles.tabActive]}
                    onPress={() => setActiveTab('likes')}
                >
                    <Ionicons
                        name="heart"
                        size={18}
                        color={activeTab === 'likes' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text style={[styles.tabText, activeTab === 'likes' && styles.tabTextActive]}>
                        Likes ({likers.length})
                    </Text>
                    {likers.length > 0 && (
                        <View style={styles.likeBadge}>
                            <Text style={styles.likeBadgeText}>{likers.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {activeTab === 'matches' ? (
                <FlatList
                    key="matches-list"
                    data={matches}
                    renderItem={renderMatchItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.listContent, matches.length === 0 && { flex: 1 }]}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                />
            ) : (
                <FlatList
                    key="likes-list"
                    data={likers}
                    renderItem={renderLikerItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={[styles.likersGrid, likers.length === 0 && { flex: 1 }]}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                />
            )}

            {renderProfileModal()}
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
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        ...theme.typography.heading,
        fontSize: 28,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        backgroundColor: theme.colors.backgroundCard,
        gap: 6,
    },
    tabActive: {
        backgroundColor: theme.colors.primary + '15',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    tabTextActive: {
        color: theme.colors.primary,
    },
    likeBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 4,
    },
    likeBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    listContent: {
        paddingVertical: 10,
    },
    likersGrid: {
        padding: 12,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coffeeTicketBadge: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    coffeeTicketEmoji: {
        fontSize: 12,
    },
    coffeeTicketText: {
        fontSize: 14,
        color: '#B45309',
        fontWeight: '600',
    },
    likerCard: {
        width: (width - 36) / 2,
        height: 200,
        margin: 6,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.backgroundCard,
    },
    likerImage: {
        width: '100%',
        height: '100%',
    },
    likerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        justifyContent: 'flex-end',
        padding: 12,
    },
    likerInfo: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    likerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    likerTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    heartBadge: {
        position: 'absolute',
        top: -60,
        right: 0,
        backgroundColor: '#EF4444',
        padding: 6,
        borderRadius: 15,
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
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    modalScroll: {
        flex: 1,
    },
    photoCarousel: {
        height: 400,
    },
    modalPhoto: {
        width: width,
        height: 400,
        backgroundColor: theme.colors.backgroundCard,
    },
    modalContent: {
        padding: 20,
        paddingBottom: 100,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    modalName: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    verifiedBadge: {
        marginLeft: 4,
    },
    modalBio: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        lineHeight: 24,
        marginBottom: 20,
    },
    detailsSection: {
        gap: 12,
        marginBottom: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        fontSize: 15,
        color: theme.colors.textPrimary,
    },
    likedAtBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    likedAtText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    actionButtons: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    actionBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    passBtn: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    likeBtn: {
        backgroundColor: '#10B981',
    },
});
