import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';

interface HostOptInBannerProps {
    onOptIn: () => void;
    onOptOut: () => void;
    isLoading: boolean;
    partnerName: string;
    partnerOptedIn?: boolean;
}

export const HostOptInBanner: React.FC<HostOptInBannerProps> = ({
    onOptIn,
    onOptOut,
    isLoading,
    partnerName,
    partnerOptedIn,
}) => {
    const theme = useTheme();
    const styles = getStyles(theme);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
        ]).start();

        // Wave animation for avatar
        Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(waveAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
            ])
        ).start();

        // Pulse animation for CTA button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Sparkle animation
        Animated.loop(
            Animated.timing(sparkleAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const waveRotation = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '20deg'],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <LinearGradient
                colors={theme.isDark
                    ? ['rgba(224, 122, 95, 0.15)', 'rgba(224, 122, 95, 0.05)']
                    : ['rgba(224, 122, 95, 0.12)', 'rgba(255, 255, 255, 0.9)']}
                style={styles.gradientCard}
            >
                {/* AI Avatar */}
                <View style={styles.avatarSection}>
                    <LinearGradient
                        colors={['#E07A5F', '#E8967E']}
                        style={styles.avatarGradient}
                    >
                        <Animated.View style={{ transform: [{ rotate: waveRotation }] }}>
                            <Text style={styles.avatarEmoji}>👋</Text>
                        </Animated.View>
                    </LinearGradient>
                    <View style={styles.avatarBadge}>
                        <Text style={styles.avatarBadgeText}>Luna</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Meet Luna, your conversation wingman!</Text>
                <Text style={styles.subtitle}>
                    I'll help you and {partnerName} break the ice with fun games and questions ✨
                </Text>

                {/* Benefit Pills */}
                <View style={styles.benefitsContainer}>
                    <View style={styles.benefitPill}>
                        <Text style={styles.benefitEmoji}>🎮</Text>
                        <Text style={styles.benefitText}>Fun games</Text>
                    </View>
                    <View style={styles.benefitPill}>
                        <Text style={styles.benefitEmoji}>💬</Text>
                        <Text style={styles.benefitText}>Break the ice</Text>
                    </View>
                    <View style={styles.benefitPill}>
                        <Text style={styles.benefitEmoji}>🎯</Text>
                        <Text style={styles.benefitText}>Find common ground</Text>
                    </View>
                </View>

                {/* Partner Status */}
                {partnerOptedIn && (
                    <View style={styles.partnerStatus}>
                        <Text style={styles.partnerStatusText}>
                            ✨ {partnerName} is ready to play!
                        </Text>
                    </View>
                )}

                {/* CTA Buttons */}
                <Animated.View style={[styles.ctaContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onOptIn}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#E07A5F', '#D96A50']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Let's Go! 🚀</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onOptOut}
                    disabled={isLoading}
                    activeOpacity={0.6}
                >
                    <Text style={styles.secondaryButtonText}>I'll chat myself</Text>
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        margin: 16,
    },
    gradientCard: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
        ...theme.shadows.md,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.glow,
    },
    avatarEmoji: {
        fontSize: 36,
    },
    avatarBadge: {
        position: 'absolute',
        bottom: -8,
        backgroundColor: theme.colors.background,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    avatarBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    benefitsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    benefitPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(224, 122, 95, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    benefitEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    benefitText: {
        fontSize: 12,
        color: theme.colors.textPrimary,
        fontWeight: '600',
    },
    partnerStatus: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    partnerStatusText: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    ctaContainer: {
        width: '100%',
    },
    primaryButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    primaryButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        paddingVertical: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
});

export default HostOptInBanner;
