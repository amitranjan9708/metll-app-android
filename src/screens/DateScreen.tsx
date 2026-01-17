import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    ScrollView,
    RefreshControl,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { swipeApi } from '../services/api';
import { Profile, MatchData, SituationResponse } from '../types';
import { MatchModal } from '../components/MatchModal';
import { useAuth } from '../context/AuthContext';
import { SITUATIONS } from './SituationSelectionScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export const DateScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter State (mocked for now)
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        ageMin: 18,
        ageMax: 35,
        distance: 50, // km
        gender: 'all', // 'all', 'male', 'female'
    });

    // Match Modal State
    const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
    const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null);

    useFocusEffect(
        useCallback(() => {
            // Discover onboarding is MANDATORY - no bypass allowed
            // User must complete it to access Date/Discover page
            if (user && !user.isDiscoverOnboarded) {
                navigation.navigate('DiscoverOnboarding');
                return;
            }

            if (profiles.length === 0) {
                loadProfiles();
            }
        }, [user?.isDiscoverOnboarded])
    );

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await swipeApi.getProfiles();
            setProfiles(data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Failed to load profiles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfiles();
    };

    const handleRefresh = async () => {
        try {
            setLoading(true);
            // Reset all swipes for the current user
            await swipeApi.resetSwipes();
            console.log('✅ All swipes reset successfully');
            // Reload profiles after reset
            await loadProfiles();
        } catch (error) {
            console.error('Failed to reset swipes:', error);
            Alert.alert('Error', 'Failed to reset swipes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (likedElement?: string) => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        try {
            const response = await swipeApi.swipe(currentProfile.id, 'like');
            console.log('🔥 SWIPE RESPONSE:', JSON.stringify(response, null, 2));

            // Check both possible response structures
            const isMatch = response.success && response.data?.isMatch;
            const match = response.data?.match;

            console.log('🎯 isMatch:', isMatch, 'match:', match);

            if (isMatch && match) {
                setCurrentMatch(match as MatchData);
                setIsMatchModalVisible(true);
            }
            moveToNextProfile();
        } catch (error) {
            console.error('Like failed:', error);
        }
    };

    const handlePass = async () => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        try {
            await swipeApi.swipe(currentProfile.id, 'pass');
            moveToNextProfile();
        } catch (error) {
            console.error('Pass failed:', error);
        }
    };

    const moveToNextProfile = () => {
        if (currentIndex < profiles.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(profiles.length);
        }
    };

    const handleSendMessage = () => {
        setIsMatchModalVisible(false);
        if (currentMatch) {
            navigation.navigate('Chat', {
                matchId: currentMatch.id,
                userName: currentMatch.matchedUser.name,
                userPhoto: currentMatch.matchedUser.profilePhoto || currentMatch.matchedUser.images?.[0]
            });
        }
    };

    const getAllPhotos = (profile: Profile): string[] => {
        const photos: string[] = [];
        if (profile.profilePhoto) photos.push(profile.profilePhoto);
        if (profile.additionalPhotos) photos.push(...profile.additionalPhotos);
        if (profile.images) photos.push(...profile.images);
        return photos.filter((photo, index, self) => self.indexOf(photo) === index);
    };

    const getQuestionById = (questionId: number) => {
        return SITUATIONS.find(s => s.id === questionId);
    };

    const styles = getStyles(theme, insets);
    const currentProfile = profiles[currentIndex];

    if (loading && profiles.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Finding people near you...</Text>
                </View>
            </View>
        );
    }

    if (currentIndex >= profiles.length || !currentProfile) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="search" size={48} color={theme.colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No more profiles</Text>
                    <Text style={styles.emptySubtitle}>Check back later for new people near you</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                        <Text style={styles.refreshBtnText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const allPhotos = getAllPhotos(currentProfile);
    const situationResponses = currentProfile.situationResponses || [];

    // Build profile elements with randomized order (except first photo + info)
    const profileElements: any[] = [];

    // Always show first photo at top
    if (allPhotos[0]) {
        profileElements.push({ type: 'photo', url: allPhotos[0], index: 0 });
    }

    // Add profile info after first photo
    profileElements.push({ type: 'info' });

    // Create array of remaining photos and prompts to shuffle
    const shuffleElements: any[] = [];

    // Add remaining photos
    allPhotos.slice(1).forEach((url, idx) => {
        shuffleElements.push({ type: 'photo', url, index: idx + 1 });
    });

    // Add prompts (max 3)
    situationResponses.slice(0, 3).forEach((resp, idx) => {
        shuffleElements.push({ type: 'prompt', data: resp, index: idx });
    });

    // Shuffle the elements using Fisher-Yates algorithm
    for (let i = shuffleElements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffleElements[i], shuffleElements[j]] = [shuffleElements[j], shuffleElements[i]];
    }

    // Add shuffled elements to profile
    profileElements.push(...shuffleElements);

    return (
        <View style={styles.container}>
            {/* Header with Filters */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.headerTitle}>Discover</Text>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={styles.filterChip}
                        onPress={() => setShowFilters(true)}
                    >
                        <Ionicons name="options-outline" size={16} color="#1A1A1A" />
                        <Text style={styles.filterChipText}>Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterChip}>
                        <Text style={styles.filterChipText}>{filters.ageMin}-{filters.ageMax} yrs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterChip}>
                        <Text style={styles.filterChipText}>{filters.distance} km</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {profileElements.map((element, idx) => {
                    if (element.type === 'photo') {
                        return (
                            <View key={`photo-${idx}`} style={styles.photoCard}>
                                <Image
                                    source={{ uri: element.url }}
                                    style={styles.profilePhoto}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    style={styles.photoLikeBtn}
                                    onPress={() => handleLike(`photo-${element.index}`)}
                                >
                                    <Ionicons name="heart-outline" size={24} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    if (element.type === 'info') {
                        return (
                            <View key="info" style={styles.infoCard}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.profileName}>{currentProfile.name}</Text>
                                    {currentProfile.age && (
                                        <Text style={styles.profileAge}>, {currentProfile.age}</Text>
                                    )}
                                    {currentProfile.isVerified && (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        </View>
                                    )}
                                </View>

                                {currentProfile.bio && (
                                    <Text style={styles.profileBio}>{currentProfile.bio}</Text>
                                )}

                                <View style={styles.detailsRow}>
                                    {(currentProfile as any).school && (
                                        <View style={styles.detailChip}>
                                            <Ionicons name="book-outline" size={14} color="#6B6B6B" />
                                            <Text style={styles.detailChipText}>{(currentProfile as any).school.name}</Text>
                                        </View>
                                    )}
                                    {(currentProfile as any).college && (
                                        <View style={styles.detailChip}>
                                            <Ionicons name="school-outline" size={14} color="#6B6B6B" />
                                            <Text style={styles.detailChipText}>{(currentProfile as any).college.name}</Text>
                                        </View>
                                    )}
                                    {(currentProfile as any).office && (
                                        <View style={styles.detailChip}>
                                            <Ionicons name="briefcase-outline" size={14} color="#6B6B6B" />
                                            <Text style={styles.detailChipText}>{(currentProfile as any).office.name}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    }

                    if (element.type === 'prompt') {
                        const question = getQuestionById(element.data.questionId);
                        if (!question) return null;

                        return (
                            <View key={`prompt-${idx}`} style={styles.promptCard}>
                                <View style={styles.promptHeader}>
                                    <Text style={styles.promptEmoji}>{question.emoji}</Text>
                                    <Text style={styles.promptCategory}>{question.category}</Text>
                                </View>
                                <Text style={styles.promptQuestion}>{question.question}</Text>
                                <Text style={styles.promptAnswer}>{element.data.answer}</Text>
                                <TouchableOpacity
                                    style={styles.promptLikeBtn}
                                    onPress={() => handleLike(`prompt-${element.index}`)}
                                >
                                    <Ionicons name="heart-outline" size={22} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    return null;
                })}

                {/* Bottom spacing for action buttons */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.passBtn} onPress={handlePass}>
                    <Ionicons name="close" size={28} color="#1A1A1A" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike()}>
                    <Ionicons name="heart" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            <MatchModal
                visible={isMatchModalVisible}
                currentUser={user}
                matchedUser={currentMatch?.matchedUser || null}
                onSendMessage={handleSendMessage}
                onKeepSwiping={() => setIsMatchModalVisible(false)}
            />

            {/* Filter Modal */}
            <Modal
                visible={showFilters}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.filterModal}>
                    <View style={styles.filterModalHeader}>
                        <Text style={styles.filterModalTitle}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={28} color="#1A1A1A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filterModalContent}>
                        {/* Age Range */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Age Range</Text>
                            <View style={styles.filterValue}>
                                <Text style={styles.filterValueText}>{filters.ageMin} - {filters.ageMax} years</Text>
                            </View>
                            <Text style={styles.filterHint}>Slider coming soon</Text>
                        </View>

                        {/* Distance */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Maximum Distance</Text>
                            <View style={styles.filterValue}>
                                <Text style={styles.filterValueText}>{filters.distance} km</Text>
                            </View>
                            <Text style={styles.filterHint}>Slider coming soon</Text>
                        </View>

                        {/* Gender */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Show Me</Text>
                            <View style={styles.genderOptions}>
                                {['all', 'male', 'female'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.genderOption,
                                            filters.gender === g && styles.genderOptionActive
                                        ]}
                                        onPress={() => setFilters({ ...filters, gender: g })}
                                    >
                                        <Text style={[
                                            styles.genderOptionText,
                                            filters.gender === g && styles.genderOptionTextActive
                                        ]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.applyFilterBtn}
                        onPress={() => {
                            setShowFilters(false);
                            Alert.alert('Applied', 'Filters applied (mock)');
                        }}
                    >
                        <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const getStyles = (theme: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    refreshBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
    },
    refreshBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Header
    header: {
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    filterChipText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    // Photo Cards
    photoCard: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
    },
    profilePhoto: {
        width: '100%',
        aspectRatio: 0.75,
        backgroundColor: theme.colors.backgroundCard,
    },
    photoLikeBtn: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    // Info Card
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    profileAge: {
        fontSize: 28,
        fontWeight: '400',
        color: '#6B6B6B',
    },
    verifiedBadge: {
        marginLeft: 8,
    },
    profileBio: {
        fontSize: 16,
        color: '#4A4A4A',
        lineHeight: 24,
        marginBottom: 16,
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    detailChipText: {
        fontSize: 14,
        color: '#4A4A4A',
    },
    // Prompt Cards - Modern Design
    promptCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 24,
        marginBottom: 12,
        position: 'relative',
        minHeight: 180,
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    promptEmoji: {
        fontSize: 20,
    },
    promptCategory: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    promptQuestion: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    promptAnswer: {
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
        lineHeight: 30,
        paddingRight: 50,
    },
    promptLikeBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Action Buttons
    actionContainer: {
        position: 'absolute',
        bottom: insets.bottom + 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    passBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#1A1A1A',
        ...theme.shadows.md,
    },
    likeBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    // Filter Modal
    filterModal: {
        flex: 1,
        backgroundColor: '#fff',
    },
    filterModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    filterModalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    filterModalContent: {
        flex: 1,
        padding: 20,
    },
    filterSection: {
        marginBottom: 32,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    filterValue: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    filterValueText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    filterHint: {
        fontSize: 13,
        color: '#9B9B9B',
        fontStyle: 'italic',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
    },
    genderOptionActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    genderOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    genderOptionTextActive: {
        color: '#fff',
    },
    applyFilterBtn: {
        backgroundColor: '#1A1A1A',
        marginHorizontal: 20,
        marginBottom: 40,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    applyFilterBtnText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
});
