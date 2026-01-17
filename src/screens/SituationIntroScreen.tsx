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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useTheme } from '../theme/useTheme';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

export const SituationIntroScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme);
    const { updateUser, completeOnboarding, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout? Your progress will be lost.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

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
                    onPress: async () => {
                        try {
                        // Save empty responses locally
                        await updateUser({ 
                            situationResponses: [] 
                        });
                        
                        // Mark onboarding as complete - sets local isOnboarded flag
                        await completeOnboarding();
                        
                            // Explicitly navigate to Main screen after a short delay to ensure state updates
                            // Use global navigationRef since we're switching stacks
                            setTimeout(() => {
                                if (navigationRef.isReady()) {
                                    navigationRef.reset({
                                        index: 0,
                                        routes: [{ name: 'Main' }],
                                    });
                                }
                            }, 100);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to skip questions. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.backgroundLight, theme.colors.background]}
            style={[styles.container, { paddingTop: insets.top + theme.spacing.lg }]}
        >
            {/* Header with logout */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

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

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    logoutText: {
        marginLeft: 6,
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
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
