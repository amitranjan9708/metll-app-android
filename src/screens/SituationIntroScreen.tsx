import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const SituationIntroScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const emojiAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entry animations
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(emojiAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(cardAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous bounce animation for emoji
        Animated.loop(
            Animated.sequence([
                Animated.timing(emojiAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(emojiAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleGetStarted = () => {
        navigation.navigate('SituationSelection');
    };

    const handleSkip = () => {
        Alert.alert(
            'Skip Personality Questions?',
            'These questions help others understand you better and can lead to better matches. You can always complete them later.',
            [
                { text: 'Go Back', style: 'cancel' },
                {
                    text: 'Skip for Now',
                    style: 'destructive',
                    onPress: () => navigation.navigate('Main'),
                },
            ]
        );
    };

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.backgroundLight, theme.colors.background]}
            style={styles.container}
        >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressStep, styles.progressActive]} />
                    <View style={styles.progressStep} />
                    <View style={styles.progressStep} />
                </View>
                <Text style={styles.progressText}>Step 1 of 3</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Animated Emoji */}
                <Animated.View
                    style={[
                        styles.emojiContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: emojiAnim }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
                        style={styles.emojiBackground}
                    >
                        <Text style={styles.emoji}>💬</Text>
                    </LinearGradient>
                    <View style={styles.emojiGlow} />
                </Animated.View>

                {/* Header Text */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <Text style={styles.title}>Show Your Personality</Text>
                    <Text style={styles.subtitle}>
                        Answer 5 fun situations to help others understand you better. Your responses will appear on your profile.
                    </Text>
                </Animated.View>

                {/* Example Preview Card */}
                <Animated.View
                    style={[
                        styles.previewCard,
                        {
                            opacity: cardAnim,
                            transform: [
                                { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                            ],
                        },
                    ]}
                >
                    <Card variant="romantic" style={styles.exampleCard}>
                        <View style={styles.exampleHeader}>
                            <Text style={styles.exampleEmoji}>💕</Text>
                            <View style={styles.exampleCategory}>
                                <Text style={styles.exampleCategoryText}>Dating</Text>
                            </View>
                        </View>
                        <Text style={styles.exampleQuestion}>
                            "Your date is 30 minutes late without texting. What do you do?"
                        </Text>
                        <View style={styles.exampleAnswer}>
                            <Ionicons name="chatbubble-outline" size={14} color={theme.colors.primary} />
                            <Text style={styles.exampleAnswerText}>
                                "I'd wait 15 more mins, then text to check if everything's okay..."
                            </Text>
                        </View>
                    </Card>
                </Animated.View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <Button
                    title="Get Started"
                    onPress={handleGetStarted}
                    style={styles.getStartedBtn}
                />
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: theme.spacing.lg,
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    progressBar: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    progressStep: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.border,
    },
    progressActive: {
        backgroundColor: theme.colors.primary,
    },
    progressText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    emojiContainer: {
        marginBottom: theme.spacing.xl,
        position: 'relative',
    },
    emojiBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.glow,
    },
    emoji: {
        fontSize: 56,
    },
    emojiGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: theme.colors.primary,
        opacity: 0.15,
        top: -10,
        left: -10,
        zIndex: -1,
    },
    title: {
        ...theme.typography.heading,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    previewCard: {
        width: '100%',
    },
    exampleCard: {
        padding: theme.spacing.lg,
    },
    exampleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    exampleEmoji: {
        fontSize: 24,
        marginRight: theme.spacing.sm,
    },
    exampleCategory: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    exampleCategoryText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    exampleQuestion: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        fontStyle: 'italic',
        marginBottom: theme.spacing.md,
        lineHeight: 22,
    },
    exampleAnswer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: theme.colors.backgroundLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    exampleAnswerText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    },
    bottomActions: {
        paddingBottom: 40,
    },
    getStartedBtn: {
        marginBottom: theme.spacing.md,
    },
    skipBtn: {
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    skipText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
});
