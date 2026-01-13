import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { ChatHostSession, ChatHostMessage } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HostChatViewProps {
    session: ChatHostSession;
    messages: ChatHostMessage[];
    userName: string;
    userPhoto: string;
    currentUserId?: string | number;
    onAnswer: (answer: string, questionId?: string) => void;
    onExit: () => void;
}

// Typing indicator component
const TypingIndicator: React.FC<{ theme: any }> = ({ theme }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.delay(600 - delay),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    const translateY = (anim: Animated.Value) =>
        anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -8],
        });

    const styles = getTypingStyles(theme);

    return (
        <View style={styles.typingContainer}>
            <LinearGradient
                colors={theme.isDark
                    ? ['rgba(224, 122, 95, 0.2)', 'rgba(224, 122, 95, 0.1)']
                    : ['rgba(224, 122, 95, 0.15)', 'rgba(255, 255, 255, 0.9)']}
                style={styles.typingBubble}
            >
                <View style={styles.typingAvatarSmall}>
                    <Text style={styles.typingAvatarEmoji}>✨</Text>
                </View>
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, { transform: [{ translateY: translateY(dot1) }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: translateY(dot2) }] }]} />
                    <Animated.View style={[styles.dot, { transform: [{ translateY: translateY(dot3) }] }]} />
                </View>
            </LinearGradient>
        </View>
    );
};

// Progress bar component
const ConversationProgress: React.FC<{ stage: string; theme: any }> = ({ stage, theme }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    const stages = [
        { key: 'STAGE_1', label: 'Breaking Ice', icon: '❄️' },
        { key: 'STAGE_2', label: 'This or That', icon: '🎯' },
        { key: 'STAGE_3', label: 'Emoji Story', icon: '🎬' },
        { key: 'STAGE_4', label: 'Quick Fire', icon: '⚡' },
        { key: 'STAGE_4B', label: 'Would You Rather', icon: '🤔' },
        { key: 'STAGE_4C', label: 'Rate Yourself', icon: '📊' },
        { key: 'STAGE_4D', label: 'Two Truths', icon: '🎭' },
        { key: 'STAGE_5', label: 'Your Turn!', icon: '🎉' },
    ];

    const currentIndex = stages.findIndex(s => s.key === stage);
    const progress = currentIndex >= 0 ? (currentIndex + 1) / stages.length : 0;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const styles = getProgressStyles(theme);
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
                {stages.map((s, idx) => (
                    <View key={s.key} style={styles.stageLabelContainer}>
                        <Text style={[
                            styles.stageIcon,
                            idx <= currentIndex && styles.stageIconActive
                        ]}>
                            {s.icon}
                        </Text>
                    </View>
                ))}
            </View>
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>
                {stages[currentIndex]?.label || 'Getting Started'}
            </Text>
        </View>
    );
};

// Confetti particle
const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
    const translateY = useRef(new Animated.Value(-20)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const randomX = (Math.random() - 0.5) * 100;

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 150,
                duration: 1500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: randomX,
                duration: 1500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 1500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(rotate, {
                toValue: 1,
                duration: 1500,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: 10,
                height: 10,
                backgroundColor: color,
                borderRadius: 2,
                transform: [
                    { translateY },
                    { translateX },
                    { rotate: spin },
                ],
                opacity,
            }}
        />
    );
};

// Main component
export const HostChatView: React.FC<HostChatViewProps> = ({
    session,
    messages,
    userName,
    userPhoto,
    currentUserId,
    onAnswer,
    onExit,
}) => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const flatListRef = useRef<FlatList>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Show typing indicator before messages
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderType === 'host') {
                setIsTyping(false);
            }
        }
    }, [messages]);

    // Trigger confetti on stage changes
    useEffect(() => {
        if (session.currentStage && session.currentStage !== 'STAGE_1') {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        }
    }, [session.currentStage]);

    const handleOptionPress = (option: string, questionId?: string) => {
        setSelectedOption(option);
        // Animate selection
        setTimeout(() => {
            onAnswer(option, questionId);
            setSelectedOption(null);
        }, 300);
    };

    const renderMessage = ({ item, index }: { item: ChatHostMessage; index: number }) => {
        const isHost = item.senderType === 'host';
        const isOwn = item.senderType !== 'host' && item.senderId === Number(currentUserId);

        if (isHost) {
            return (
                <HostMessageBubble
                    message={item}
                    theme={theme}
                    onOptionPress={handleOptionPress}
                    selectedOption={selectedOption}
                    isLatest={index === messages.length - 1}
                />
            );
        }

        return (
            <UserMessageBubble
                message={item}
                isOwn={isOwn}
                theme={theme}
                userName={userName}
                userPhoto={userPhoto}
            />
        );
    };

    const confettiColors = ['#E07A5F', '#81B29A', '#F2CC8F', '#3D405B', '#E07A5F'];

    return (
        <View style={styles.container}>
            {/* Header with Luna */}
            <View style={styles.header}>
                <LinearGradient
                    colors={['#E07A5F', '#E8967E']}
                    style={styles.lunaAvatar}
                >
                    <Text style={styles.lunaEmoji}>✨</Text>
                </LinearGradient>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Luna</Text>
                    <Text style={styles.headerSubtitle}>Your conversation wingman</Text>
                </View>
                <TouchableOpacity style={styles.exitButton} onPress={onExit}>
                    <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <ConversationProgress stage={session.currentStage || 'STAGE_1'} theme={theme} />

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => `${item.id || index}-host`}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>✨</Text>
                        <Text style={styles.emptyText}>Luna is getting ready...</Text>
                    </View>
                }
                ListFooterComponent={isTyping ? <TypingIndicator theme={theme} /> : null}
            />

            {/* Confetti overlay */}
            {showConfetti && (
                <View style={styles.confettiContainer}>
                    {confettiColors.map((color, i) => (
                        <React.Fragment key={i}>
                            <ConfettiParticle delay={i * 50} color={color} />
                            <ConfettiParticle delay={i * 50 + 100} color={color} />
                            <ConfettiParticle delay={i * 50 + 200} color={color} />
                        </React.Fragment>
                    ))}
                </View>
            )}
        </View>
    );
};

// Host message bubble component
const HostMessageBubble: React.FC<{
    message: ChatHostMessage;
    theme: any;
    onOptionPress: (option: string, questionId?: string) => void;
    selectedOption: string | null;
    isLatest: boolean;
}> = ({ message, theme, onOptionPress, selectedOption, isLatest }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const styles = getHostBubbleStyles(theme);
    const isQuestion = message.messageType === 'question' || message.messageType === 'game_prompt';
    const hasOptions = message.metadata?.options && message.metadata.options.length > 0;
    const isReaction = message.metadata?.isReaction;

    const getMessageIcon = () => {
        if (isReaction) return null;
        if (message.metadata?.isHandoff) return '🎉';
        if (message.metadata?.isReveal) return '🏆';
        if (message.metadata?.gameType === 'this_or_that') return '🎯';
        if (message.metadata?.gameType === 'emoji_story') return '🎬';
        if (message.metadata?.gameType === 'quick_fire') return '⚡';
        if (message.metadata?.gameType === 'would_you_rather') return '🤔';
        if (message.metadata?.gameType === 'rate_scale') return '📊';
        if (message.metadata?.gameType === 'two_truths') return '🎭';
        if (message.messageType === 'question') return '💭';
        return '✨';
    };

    const icon = getMessageIcon();

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
                    ? ['rgba(224, 122, 95, 0.2)', 'rgba(224, 122, 95, 0.08)']
                    : ['rgba(224, 122, 95, 0.12)', 'rgba(255, 255, 255, 0.95)']}
                style={[styles.bubble, isReaction && styles.reactionBubble]}
            >
                {icon && !isReaction && (
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>{icon}</Text>
                    </View>
                )}
                <Text style={[styles.messageText, isReaction && styles.reactionText]}>
                    {message.content}
                </Text>

                {/* Options for games */}
                {hasOptions && isLatest && (
                    <View style={styles.optionsContainer}>
                        {message.metadata!.options!.map((option, idx) => {
                            const isSelected = selectedOption === option;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.optionButton,
                                        isSelected && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => onOptionPress(option, message.metadata?.questionId)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected,
                                    ]}>
                                        {option}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={16} color="#fff" style={styles.optionCheck} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );
};

// User message bubble
const UserMessageBubble: React.FC<{
    message: ChatHostMessage;
    isOwn: boolean;
    theme: any;
    userName: string;
    userPhoto: string;
}> = ({ message, isOwn, theme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    const styles = getUserBubbleStyles(theme);

    return (
        <Animated.View
            style={[
                styles.container,
                isOwn ? styles.containerOwn : styles.containerOther,
                { opacity: fadeAnim },
            ]}
        >
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
                    {message.content}
                </Text>
            </View>
        </Animated.View>
    );
};

// Styles
const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.isDark
            ? 'rgba(224, 122, 95, 0.08)'
            : 'rgba(224, 122, 95, 0.05)',
    },
    lunaAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lunaEmoji: {
        fontSize: 20,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    exitButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        padding: 16,
        paddingBottom: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 100,
        pointerEvents: 'none',
    },
});

const getTypingStyles = (theme: any) => StyleSheet.create({
    typingContainer: {
        paddingVertical: 8,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
    },
    typingAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    typingAvatarEmoji: {
        fontSize: 12,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
});

const getProgressStyles = (theme: any) => StyleSheet.create({
    progressContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    stageLabelContainer: {
        alignItems: 'center',
    },
    stageIcon: {
        fontSize: 16,
        opacity: 0.4,
    },
    stageIconActive: {
        opacity: 1,
    },
    progressTrack: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
    },
});

const getHostBubbleStyles = (theme: any) => StyleSheet.create({
    container: {
        marginBottom: 16,
        alignItems: 'center',
    },
    bubble: {
        maxWidth: SCREEN_WIDTH * 0.85,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary + '25',
    },
    reactionBubble: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    iconContainer: {
        marginBottom: 8,
    },
    icon: {
        fontSize: 24,
    },
    messageText: {
        fontSize: 16,
        color: theme.colors.textPrimary,
        lineHeight: 24,
    },
    reactionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    optionsContainer: {
        marginTop: 16,
        gap: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.isDark
            ? 'rgba(224, 122, 95, 0.2)'
            : 'rgba(224, 122, 95, 0.15)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: theme.colors.primary + '50',
    },
    optionButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    optionTextSelected: {
        color: '#fff',
    },
    optionCheck: {
        marginLeft: 8,
    },
});

const getUserBubbleStyles = (theme: any) => StyleSheet.create({
    container: {
        marginBottom: 12,
        flexDirection: 'row',
    },
    containerOwn: {
        justifyContent: 'flex-end',
    },
    containerOther: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleOwn: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 6,
    },
    bubbleOther: {
        backgroundColor: theme.colors.backgroundCard,
        borderBottomLeftRadius: 6,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
    },
    textOwn: {
        color: '#fff',
    },
    textOther: {
        color: theme.colors.textPrimary,
    },
});

export default HostChatView;
