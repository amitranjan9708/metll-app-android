import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    TouchableOpacity,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';

const { width, height } = Dimensions.get('window');

// Dummy Data
const DUMMY_PROFILES = [
    {
        id: '1',
        name: 'Sarah',
        age: 24,
        distance: '3 km away',
        bio: 'Coffee lover ☕ | Travel enthusiast ✈️',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '2',
        name: 'Jessica',
        age: 26,
        distance: '5 km away',
        bio: 'Art student 🎨 | Looking for someone to explore museums with.',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        name: 'Emily',
        age: 23,
        distance: '12 km away',
        bio: 'Music is life 🎵 | Let\'s go to a concert!',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '4',
        name: 'Maya',
        age: 25,
        distance: '2 km away',
        bio: 'Foodie 🍕 | Yoga instructor 🧘‍♀️',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1a17283620f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '5',
        name: 'Olivia',
        age: 22,
        distance: '8 km away',
        bio: 'Dog mom 🐶 | Adventure seeker',
        photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
];

export const DateScreen: React.FC = () => {
    const theme = useTheme();
    const [profiles, setProfiles] = useState(DUMMY_PROFILES);
    const [currentIndex, setCurrentIndex] = useState(0);

    const position = useRef(new Animated.ValueXY()).current;

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
            useNativeDriver: false, // Layout changes not supported by native driver
        }).start(() => onSwipeComplete(direction));
    };

    const onSwipeComplete = (direction: 'right' | 'left') => {
        // Logic for match or pass can go here
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prevIndex => prevIndex + 1);
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false,
        }).start();
    };

    const styles = getStyles(theme);

    const renderNoMoreProfiles = () => {
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
                <Button title="Refresh" onPress={() => setCurrentIndex(0)} variant="outline" style={{ marginTop: 20 }} />
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
                            <Image source={{ uri: item.photo }} style={styles.cardImage} />

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                                <Text style={styles.cardDistance}>{item.distance}</Text>
                                <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
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
                            <Image source={{ uri: item.photo }} style={styles.cardImage} />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                                <Text style={styles.cardDistance}>{item.distance}</Text>
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

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
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
        height: 160,
        justifyContent: 'flex-end',
        padding: 20,
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
        marginTop: 4,
    },
    cardBio: {
        ...theme.typography.body,
        color: '#fff',
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
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
