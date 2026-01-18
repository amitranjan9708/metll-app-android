import React, { useState, useCallback, useEffect } from 'react';
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
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { swipeApi, userApi } from '../services/api';
import { Profile, MatchData, SituationResponse } from '../types';
import { MatchModal } from '../components/MatchModal';
import { LocationPickerModal } from '../components/LocationPickerModal';
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

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        ageMin: 18,
        ageMax: 35,
        distanceMax: 50, // km
        genderPreference: 'all', // 'all', 'male', 'female', 'non-binary'
    });
    const [tempFilters, setTempFilters] = useState(filters);

    // Location State for "My Neighborhood"
    const [userLocation, setUserLocation] = useState<{
        latitude: number | null;
        longitude: number | null;
        city: string | null;
    }>({ latitude: null, longitude: null, city: null });
    const [locationLoading, setLocationLoading] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Match Modal State
    const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
    const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null);

    // Load user's dating preferences and location as default filters
    useEffect(() => {
        const loadUserPreferences = async () => {
            try {
                const response = await userApi.getUserProfile();
                if (response.success && response.data?.user) {
                    const userData = response.data.user;

                    // Load dating preferences
                    if (userData.datingPrefs) {
                        const prefs = userData.datingPrefs;
                        const newFilters = {
                            ageMin: prefs.ageMin || 18,
                            ageMax: prefs.ageMax || 35,
                            distanceMax: prefs.distanceMax || 50,
                            genderPreference: prefs.genderPreference?.[0] || 'all',
                        };
                        setFilters(newFilters);
                        setTempFilters(newFilters);
                    }

                    // Load user's location
                    if (userData.latitude && userData.longitude) {
                        setUserLocation({
                            latitude: userData.latitude,
                            longitude: userData.longitude,
                            city: userData.currentCity || null,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load user preferences:', error);
            }
        };
        if (user?.isDiscoverOnboarded) {
            loadUserPreferences();
        }
    }, [user?.isDiscoverOnboarded]);

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
            const data = await swipeApi.getProfiles(filters);
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

    // Handle location selection from the Location Picker Modal
    const handleLocationSelect = async (location: {
        latitude: number;
        longitude: number;
        city: string | null;
    }) => {
        try {
            setLocationLoading(true);

            // Update local state
            setUserLocation(location);

            // Save to backend
            const result = await userApi.updateProfile({
                latitude: location.latitude,
                longitude: location.longitude,
                currentCity: location.city || undefined,
            });

            if (result.success) {
                Alert.alert(
                    '📍 Location Updated',
                    location.city
                        ? `Your location is set to ${location.city}. Distance filters will now work!`
                        : 'Your location has been saved. Distance filters will now work!'
                );
            } else {
                console.warn('Failed to save location to backend');
            }
        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert('Error', 'Failed to save your location. Please try again.');
        } finally {
            setLocationLoading(false);
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

    // Helper to format activity status
    const getActivityStatus = (lastActiveAt?: string): { text: string; color: string } => {
        if (!lastActiveAt) return { text: '', color: '#6B6B6B' };

        const lastActive = new Date(lastActiveAt);
        const now = new Date();
        const diffMs = now.getTime() - lastActive.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 5) {
            return { text: 'Active now', color: '#10B981' };
        } else if (diffMins < 60) {
            return { text: `Active ${diffMins}m ago`, color: '#10B981' };
        } else if (diffHours < 24) {
            return { text: 'Active today', color: '#F59E0B' };
        } else if (diffDays === 1) {
            return { text: 'Active yesterday', color: '#6B6B6B' };
        } else if (diffDays < 7) {
            return { text: `Active ${diffDays}d ago`, color: '#6B6B6B' };
        } else {
            return { text: 'Active this week', color: '#6B6B6B' };
        }
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

    // Check if filters are non-default
    const hasActiveFilters = filters.ageMin !== 18 ||
        filters.ageMax !== 50 ||
        filters.distanceMax !== 50 ||
        filters.genderPreference !== 'all';

    const handleResetFilters = () => {
        const defaultFilters = {
            ageMin: 18,
            ageMax: 50,
            distanceMax: 50,
            genderPreference: 'all' as const,
        };
        setFilters(defaultFilters);
        setTempFilters(defaultFilters);
        // Refetch profiles with reset filters
        setTimeout(() => handleRefresh(), 100);
    };

    // Helper function to render the filter modal content
    const renderFilterModalContent = () => (
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
                    <View style={styles.ageRangeContainer}>
                        <View style={styles.ageInputContainer}>
                            <Text style={styles.ageInputLabel}>Min</Text>
                            <TextInput
                                style={styles.ageInput}
                                value={tempFilters.ageMin.toString()}
                                onChangeText={(text) => {
                                    const val = parseInt(text) || 18;
                                    if (val >= 18 && val <= 100 && val <= tempFilters.ageMax) {
                                        setTempFilters({ ...tempFilters, ageMin: val });
                                    }
                                }}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                        <Text style={styles.ageRangeSeparator}>-</Text>
                        <View style={styles.ageInputContainer}>
                            <Text style={styles.ageInputLabel}>Max</Text>
                            <TextInput
                                style={styles.ageInput}
                                value={tempFilters.ageMax.toString()}
                                onChangeText={(text) => {
                                    const val = parseInt(text) || 35;
                                    if (val >= 18 && val <= 100 && val >= tempFilters.ageMin) {
                                        setTempFilters({ ...tempFilters, ageMax: val });
                                    }
                                }}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                    </View>
                    <View style={styles.ageQuickButtons}>
                        {[
                            { min: 18, max: 25 },
                            { min: 26, max: 35 },
                            { min: 36, max: 45 },
                            { min: 46, max: 100 },
                        ].map((range, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.ageQuickBtn,
                                    tempFilters.ageMin === range.min && tempFilters.ageMax === range.max && styles.ageQuickBtnActive
                                ]}
                                onPress={() => setTempFilters({ ...tempFilters, ageMin: range.min, ageMax: range.max })}
                            >
                                <Text style={[
                                    styles.ageQuickBtnText,
                                    tempFilters.ageMin === range.min && tempFilters.ageMax === range.max && styles.ageQuickBtnTextActive
                                ]}>
                                    {range.min}-{range.max}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* My Neighborhood - Location */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>📍 My Neighborhood</Text>
                    <Text style={styles.filterSubLabel}>
                        Set your location to see distance to matches
                    </Text>

                    {userLocation.latitude && userLocation.longitude ? (
                        <View style={styles.locationStatus}>
                            <View style={styles.locationStatusContent}>
                                <Ionicons name="location" size={20} color="#10B981" />
                                <View>
                                    <Text style={styles.locationStatusText}>
                                        {userLocation.city || 'Location set'}
                                    </Text>
                                    <Text style={styles.locationCoordsText}>
                                        {userLocation.latitude.toFixed(2)}°, {userLocation.longitude.toFixed(2)}°
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.updateLocationBtn}
                                onPress={() => setShowLocationPicker(true)}
                                disabled={locationLoading}
                            >
                                {locationLoading ? (
                                    <ActivityIndicator size="small" color="#1A1A1A" />
                                ) : (
                                    <Text style={styles.updateLocationBtnText}>Change</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.getLocationBtn}
                            onPress={() => setShowLocationPicker(true)}
                            disabled={locationLoading}
                        >
                            {locationLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="map" size={20} color="#fff" />
                                    <Text style={styles.getLocationBtnText}>
                                        Set My Neighborhood
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {!userLocation.latitude && (
                        <Text style={styles.locationWarning}>
                            ⚠️ Distance filter won't work without your location
                        </Text>
                    )}
                </View>

                {/* Distance */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Maximum Distance (km)</Text>
                    <View style={styles.distanceInputContainer}>
                        <TextInput
                            style={styles.distanceInput}
                            value={tempFilters.distanceMax.toString()}
                            onChangeText={(text) => {
                                const val = parseInt(text) || 50;
                                if (val >= 1 && val <= 500) {
                                    setTempFilters({ ...tempFilters, distanceMax: val });
                                }
                            }}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                        <Text style={styles.distanceUnit}>km</Text>
                    </View>
                    <View style={styles.distanceQuickButtons}>
                        {[10, 25, 50, 100, 200].map((dist) => (
                            <TouchableOpacity
                                key={dist}
                                style={[
                                    styles.distanceQuickBtn,
                                    tempFilters.distanceMax === dist && styles.distanceQuickBtnActive
                                ]}
                                onPress={() => setTempFilters({ ...tempFilters, distanceMax: dist })}
                            >
                                <Text style={[
                                    styles.distanceQuickBtnText,
                                    tempFilters.distanceMax === dist && styles.distanceQuickBtnTextActive
                                ]}>
                                    {dist} km
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Gender */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Show Me</Text>
                    <View style={styles.genderOptions}>
                        {[
                            { value: 'all', label: 'Everyone' },
                            { value: 'male', label: 'Men' },
                            { value: 'female', label: 'Women' },
                            { value: 'non-binary', label: 'Non-Binary' },
                        ].map((g) => (
                            <TouchableOpacity
                                key={g.value}
                                style={[
                                    styles.genderOption,
                                    tempFilters.genderPreference === g.value && styles.genderOptionActive
                                ]}
                                onPress={() => setTempFilters({ ...tempFilters, genderPreference: g.value })}
                            >
                                <Text style={[
                                    styles.genderOptionText,
                                    tempFilters.genderPreference === g.value && styles.genderOptionTextActive
                                ]}>
                                    {g.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
                <TouchableOpacity
                    style={styles.resetFilterBtn}
                    onPress={() => {
                        const defaultFilters = {
                            ageMin: 18,
                            ageMax: 50,
                            distanceMax: 50,
                            genderPreference: 'all',
                        };
                        setTempFilters(defaultFilters);
                    }}
                >
                    <Text style={styles.resetFilterBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.applyFilterBtn}
                    onPress={async () => {
                        setFilters(tempFilters);
                        setShowFilters(false);
                        // Reload profiles with new filters
                        setLoading(true);
                        try {
                            const data = await swipeApi.getProfiles(tempFilters);
                            setProfiles(data);
                            setCurrentIndex(0);
                        } catch (error) {
                            console.error('Failed to load filtered profiles:', error);
                            Alert.alert('Error', 'Failed to apply filters. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (currentIndex >= profiles.length || !currentProfile) {
        return (
            <View style={styles.container}>
                {/* Header with Filters - same as profile page */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Text style={styles.headerTitle}>Discover</Text>
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterChip, hasActiveFilters && styles.filterChipActive]}
                            onPress={() => {
                                setTempFilters(filters);
                                setShowFilters(true);
                            }}
                        >
                            <Ionicons name="options-outline" size={16} color={hasActiveFilters ? "#fff" : "#1A1A1A"} />
                            <Text style={[styles.filterChipText, hasActiveFilters && styles.filterChipTextActive]}>Filters</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip} onPress={() => setShowFilters(true)}>
                            <Text style={styles.filterChipText}>{filters.ageMin}-{filters.ageMax} yrs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip} onPress={() => setShowFilters(true)}>
                            <Text style={styles.filterChipText}>{filters.distanceMax} km</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="search" size={48} color={theme.colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No profiles found</Text>
                    <Text style={styles.emptySubtitle}>
                        {hasActiveFilters
                            ? "Try adjusting your filters to see more people"
                            : "Check back later for new people near you"}
                    </Text>

                    {hasActiveFilters && (
                        <TouchableOpacity style={styles.resetFiltersBtn} onPress={handleResetFilters}>
                            <Ionicons name="refresh-outline" size={18} color="#fff" />
                            <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                        <Text style={styles.refreshBtnText}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Modal - needed for adjusting filters from empty state */}
                <Modal
                    visible={showFilters}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => {
                        setTempFilters(filters);
                        setShowFilters(false);
                    }}
                >
                    {renderFilterModalContent()}
                </Modal>

                {/* Location Picker Modal */}
                <LocationPickerModal
                    visible={showLocationPicker}
                    onClose={() => setShowLocationPicker(false)}
                    onLocationSelect={handleLocationSelect}
                    initialLocation={userLocation ? {
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        city: userLocation.city
                    } : undefined}
                />
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
                        onPress={() => {
                            setTempFilters(filters); // Sync temp filters with current filters
                            setShowFilters(true);
                        }}
                    >
                        <Ionicons name="options-outline" size={16} color="#1A1A1A" />
                        <Text style={styles.filterChipText}>Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterChip} onPress={() => setShowFilters(true)}>
                        <Text style={styles.filterChipText}>{filters.ageMin}-{filters.ageMax} yrs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterChip} onPress={() => setShowFilters(true)}>
                        <Text style={styles.filterChipText}>{filters.distanceMax} km</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sticky Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.profileHeaderLeft}>
                    {currentProfile.profilePhoto || getAllPhotos(currentProfile)[0] ? (
                        <Image
                            source={{ uri: currentProfile.profilePhoto || getAllPhotos(currentProfile)[0] }}
                            style={styles.profileHeaderAvatar}
                        />
                    ) : (
                        <View style={[styles.profileHeaderAvatar, styles.profileHeaderAvatarPlaceholder]}>
                            <Ionicons name="person" size={20} color="#999" />
                        </View>
                    )}
                    <View style={styles.profileHeaderInfo}>
                        <View style={styles.profileHeaderNameRow}>
                            <Text style={styles.profileHeaderName}>{currentProfile.name}</Text>
                            {currentProfile.age && (
                                <Text style={styles.profileHeaderAge}>, {currentProfile.age}</Text>
                            )}
                            {currentProfile.isVerified && (
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 4 }} />
                            )}
                        </View>
                        {(() => {
                            const activity = getActivityStatus((currentProfile as any).lastActiveAt);
                            return activity.text ? (
                                <View style={styles.activityContainer}>
                                    <View style={[styles.activityDot, { backgroundColor: activity.color }]} />
                                    <Text style={[styles.activityText, { color: activity.color }]}>
                                        {activity.text}
                                    </Text>
                                </View>
                            ) : null;
                        })()}
                    </View>
                </View>
                {currentProfile.distance !== null && currentProfile.distance !== undefined && (
                    <View style={styles.distanceBadge}>
                        <Ionicons name="location-outline" size={12} color="#6B6B6B" />
                        <Text style={styles.distanceText}>
                            {typeof currentProfile.distance === 'number'
                                ? `${Math.round(currentProfile.distance)} km`
                                : currentProfile.distance}
                        </Text>
                    </View>
                )}
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

            {/* Location Picker Modal */}
            <LocationPickerModal
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                onLocationSelect={handleLocationSelect}
                initialLocation={userLocation}
            />

            {/* Filter Modal */}
            <Modal
                visible={showFilters}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setTempFilters(filters);
                    setShowFilters(false);
                }}
            >
                {renderFilterModalContent()}
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
    resetFiltersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
        marginBottom: 12,
    },
    resetFiltersBtnText: {
        color: '#fff',
        fontSize: 15,
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
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterChipTextActive: {
        color: '#fff',
    },
    // Profile Header (sticky below filters)
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    profileHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileHeaderAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    profileHeaderAvatarPlaceholder: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderInfo: {
        flex: 1,
    },
    profileHeaderNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileHeaderName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    profileHeaderAge: {
        fontSize: 20,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    activityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    activityText: {
        fontSize: 13,
        fontWeight: '500',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
    },
    distanceText: {
        fontSize: 12,
        color: '#6B6B6B',
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
    filterSubLabel: {
        fontSize: 13,
        color: '#6B6B6B',
        marginBottom: 16,
        marginTop: -8,
    },
    // My Neighborhood styles
    locationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    locationStatusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    locationStatusText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#059669',
    },
    locationCoordsText: {
        fontSize: 11,
        color: '#6B6B6B',
        marginTop: 2,
    },
    updateLocationBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    updateLocationBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    getLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        borderRadius: 12,
    },
    getLocationBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    locationWarning: {
        fontSize: 13,
        color: '#D97706',
        marginTop: 12,
        textAlign: 'center',
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
    // Age Range Styles
    ageRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    ageInputContainer: {
        flex: 1,
    },
    ageInputLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B6B6B',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    ageInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    ageRangeSeparator: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 20,
    },
    ageQuickButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    ageQuickBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    ageQuickBtnActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    ageQuickBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    ageQuickBtnTextActive: {
        color: '#fff',
    },
    // Distance Styles
    distanceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    distanceInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    distanceUnit: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B6B6B',
        marginLeft: 8,
    },
    distanceQuickButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    distanceQuickBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    distanceQuickBtnActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    distanceQuickBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    distanceQuickBtnTextActive: {
        color: '#fff',
    },
    // Filter Modal Footer
    filterModalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    resetFilterBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    resetFilterBtnText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    applyFilterBtn: {
        flex: 2,
        backgroundColor: '#1A1A1A',
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
