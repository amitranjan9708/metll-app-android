import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { swipeApi } from '../services/api';
import { Profile, MatchData } from '../types';
import { MatchModal } from '../components/MatchModal';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export const DateScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const { user } = useAuth();

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Match Modal State
    const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
    const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null);

    const position = useRef(new Animated.ValueXY()).current;

    // Load profiles when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (profiles.length === 0) {
                loadProfiles();
            }
        }, [])
    );

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await swipeApi.getProfiles();
            setProfiles(data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Failed to load profiles:', error);
            // Optionally show error toast
        } finally {
            setLoading(false);
        }
    };

    // Rotation interpolation based on movement
    const rotate = position.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp',
    });

    // Like opacity (swiping right)
    const likeOpacity = position.x.interpolate({
        inputRange: [0, width / 4],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Nope opacity (swiping left)
    const nopeOpacity = position.x.interpolate({
        inputRange: [-width / 4, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const nextCardOpacity = position.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: [1, 0.5, 1],
        extrapolate: 'clamp',
    });

    const nextCardScale = position.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: [1, 0.96, 1],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > 120) {
                    forceSwipe('right');
                } else if (gesture.dx < -120) {
                    forceSwipe('left');
                } else {
                    resetPosition();
                }
            },
        })
    ).current;

    const forceSwipe = (direction: 'right' | 'left') => {
        const x = direction === 'right' ? width + 100 : -width - 100;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: false,
        }).start(() => onSwipeComplete(direction));
    };

    const onSwipeComplete = async (direction: 'right' | 'left') => {
        const currentProfile = profiles[currentIndex];

        // Optimistically move to next card
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prevIndex => prevIndex + 1);

        // API Call
        try {
            const response = await swipeApi.swipe(currentProfile.id, direction === 'right' ? 'like' : 'pass');

            // Check if we have a match
            if (response.success && response.data?.isMatch && response.data?.match) {
                // Show Match Modal
                setCurrentMatch(response.data.match as MatchData);
                setIsMatchModalVisible(true);
            }
        } catch (error) {
            console.error('Swipe failed:', error);
        }
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false,
        }).start();
    };

    const handleSendMessage = () => {
        setIsMatchModalVisible(false);
        if (currentMatch) {
            navigation.navigate('Chat', {
                matchId: currentMatch.id,
                userName: currentMatch.matchedUser.name,
                userPhoto: currentMatch.matchedUser.profilePhoto || currentMatch.matchedUser.images[0]
            });
        }
    };

    const styles = getStyles(theme);

    const renderNoMoreProfiles = () => {
        if (loading) return (
            <View style={styles.noMoreContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );

        return (
            <View style={styles.noMoreContainer}>
                <View style={[styles.noMoreIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="people" size={50} color={theme.colors.primary} />
                </View>
                <Text style={[styles.noMoreText, { color: theme.colors.textPrimary }]}>
                    No more profiles nearby
                </Text>
                <Text style={[styles.noMoreSubtext, { color: theme.colors.textSecondary }]}>
                    Check back later for more matches!
                </Text>
                <Button title="Refresh" onPress={loadProfiles} variant="outline" style={{ marginTop: 20 }} />
            </View>
        );
    };

    const renderCards = () => {
        if (currentIndex >= profiles.length) {
            return renderNoMoreProfiles();
        }

        return profiles.map((item, index) => {
            if (index < currentIndex) return null;

            // Logic for stacking cards
            if (index === currentIndex) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[
                            styles.cardContainer,
                            {
                                transform: [
                                    { translateX: position.x },
                                    { translateY: position.y },
                                    { rotate: rotate },
                                ],
                                zIndex: 10,
                            }
                        ]}
                        {...panResponder.panHandlers}
                    >
                        <Card style={styles.card} variant="default">
                            <Image
                                source={{ uri: item.profilePhoto || item.images[0] || 'https://via.placeholder.com/400' }}
                                style={styles.cardImage}
                            />

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.profileHeader}>
                                    <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                                    {item.isVerified && (
                                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={{ marginLeft: 8 }} />
                                    )}
                                </View>
                                <Text style={styles.cardDistance}>{item.distance || 'Nearby'}</Text>
                                <Text style={styles.cardBio} numberOfLines={3}>{item.bio}</Text>
                            </LinearGradient>

                            {/* OVERLAY LABELS */}
                            <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
                                <Text style={styles.likeText}>LIKE</Text>
                            </Animated.View>

                            <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
                                <Text style={styles.nopeText}>NOPE</Text>
                            </Animated.View>
                        </Card>
                    </Animated.View>
                );
            } else if (index === currentIndex + 1) {
                // Next card in stack
                return (
                    <Animated.View
                        key={item.id}
                        style={[
                            styles.cardContainer,
                            {
                                opacity: nextCardOpacity,
                                transform: [{ scale: nextCardScale }],
                                zIndex: 5,
                            }
                        ]}
                    >
                        <Card style={styles.card} variant="default">
                            <Image
                                source={{ uri: item.profilePhoto || item.images[0] || 'https://via.placeholder.com/400' }}
                                style={styles.cardImage}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                                <Text style={styles.cardDistance}>{item.distance || 'Nearby'}</Text>
                                <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
                            </LinearGradient>
                        </Card>
                    </Animated.View>
                );
            } else {
                return null;
            }
        }).reverse(); // Reverse so top card is last rendered (on top)
    };

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.backgroundLight]}
            style={styles.container}
        >
            <View style={styles.content}>
                {renderCards()}
            </View>

            {currentIndex < profiles.length && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.passBtn]}
                        onPress={() => forceSwipe('left')}
                    >
                        <Ionicons name="close" size={30} color="#EF5350" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.superLikeBtn]}
                        onPress={() => { }}
                    >
                        <Ionicons name="star" size={24} color="#3B82F6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.likeBtn]}
                        onPress={() => forceSwipe('right')}
                    >
                        <Ionicons name="heart" size={30} color="#4CAF50" />
                    </TouchableOpacity>
                </View>
            )}

            <MatchModal
                visible={isMatchModalVisible}
                currentUser={user}
                matchedUser={currentMatch?.matchedUser || null}
                onSendMessage={handleSendMessage}
                onKeepSwiping={() => setIsMatchModalVisible(false)}
            />
        </LinearGradient>
    );
};

// Simplified Button component for internal use if needed, 
// but reusing the one imported from components is better.
const Button = ({ title, onPress, variant = 'primary', style }: any) => {
    const theme = useTheme();
    const isOutline = variant === 'outline';
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                {
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 24,
                    backgroundColor: isOutline ? 'transparent' : theme.colors.primary,
                    borderWidth: isOutline ? 1 : 0,
                    borderColor: theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                style
            ]}
        >
            <Text style={{
                color: isOutline ? theme.colors.primary : '#fff',
                fontWeight: '600'
            }}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    noMoreContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        flex: 1,
    },
    noMoreIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    noMoreText: {
        ...theme.typography.heading,
        textAlign: 'center',
        marginBottom: 8,
    },
    noMoreSubtext: {
        ...theme.typography.body,
        textAlign: 'center',
        marginBottom: 24,
    },
    cardContainer: {
        width: width - 32,
        height: height * 0.65,
        position: 'absolute',
        borderRadius: 20,
    },
    card: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        padding: 0, // Override default padding
        borderWidth: 0,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        justifyContent: 'flex-end',
        padding: 20,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardName: {
        ...theme.typography.heading,
        color: '#fff',
        fontSize: 28,
    },
    cardDistance: {
        ...theme.typography.caption,
        color: '#fff',
        opacity: 0.8,
        marginTop: 0,
    },
    cardBio: {
        ...theme.typography.body,
        color: '#fff',
        marginTop: 8,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    likeLabel: {
        position: 'absolute',
        top: 50,
        left: 40,
        borderWidth: 4,
        borderColor: '#4CAF50',
        paddingHorizontal: 10,
        borderRadius: 8,
        transform: [{ rotate: '-30deg' }],
    },
    likeText: {
        color: '#4CAF50',
        fontSize: 32,
        fontWeight: '800',
    },
    nopeLabel: {
        position: 'absolute',
        top: 50,
        right: 40,
        borderWidth: 4,
        borderColor: '#EF5350',
        paddingHorizontal: 10,
        borderRadius: 8,
        transform: [{ rotate: '30deg' }],
    },
    nopeText: {
        color: '#EF5350',
        fontSize: 32,
        fontWeight: '800',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
        gap: 20,
    },
    actionBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundCard,
        ...theme.shadows.md,
    },
    passBtn: {
        // border: '1px solid #EF5350',
    },
    likeBtn: {
        // border: '1px solid #4CAF50',
    },
    superLikeBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginTop: 20, // Sit lower
    },
});
