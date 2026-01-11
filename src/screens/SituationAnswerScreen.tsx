import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SituationQuestion, SituationResponse, SituationCategory } from '../types';
import { useAuth } from '../context/AuthContext';

type RouteParams = {
    SituationAnswer: {
        selectedQuestions: SituationQuestion[];
    };
};

const CATEGORY_COLORS: Record<SituationCategory, string> = {
    Dating: '#E8A4B8',
    Social: '#6B7FBF',
    Adventure: '#4CAF50',
    Life: '#FF9800',
    Entertainment: '#9C27B0',
    Ethics: '#607D8B',
};

export const SituationAnswerScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RouteParams, 'SituationAnswer'>>();
    const insets = useSafeAreaInsets();
    const { updateUser } = useAuth();

    const { selectedQuestions } = route.params;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const currentQuestion = selectedQuestions[currentIndex];
    const currentAnswer = answers[currentQuestion?.id] || '';
    const wordCount = currentAnswer.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isAnswerValid = currentAnswer.trim().length > 0 && wordCount <= 100;

    useEffect(() => {
        // Animate progress bar
        Animated.timing(progressAnim, {
            toValue: (currentIndex + 1) / selectedQuestions.length,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [currentIndex]);

    const animateTransition = (direction: 'forward' | 'back') => {
        const exitValue = direction === 'forward' ? -50 : 50;
        const enterValue = direction === 'forward' ? 50 : -50;

        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: exitValue,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(slideAnim, {
                toValue: enterValue,
                duration: 0,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    };

    const handleAnswerChange = (text: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: text,
        }));
    };

    const handleNext = () => {
        if (!isAnswerValid) {
            Alert.alert('Answer Required', 'Please write an answer (max 100 words) before continuing.');
            return;
        }

        if (currentIndex < selectedQuestions.length - 1) {
            animateTransition('forward');
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            animateTransition('back');
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        } else {
            navigation.goBack();
        }
    };

    const handleComplete = async () => {
        if (!isAnswerValid) {
            Alert.alert('Answer Required', 'Please write an answer before completing.');
            return;
        }

        // Create situation responses array
        const responses: SituationResponse[] = selectedQuestions.map(q => ({
            questionId: q.id,
            answer: answers[q.id] || '',
            answeredAt: new Date().toISOString(),
        }));

        try {
            await updateUser({ situationResponses: responses });
            // Navigation will automatically switch to Main app due to auth state change
            // (user now has situation responses, so needsOnboarding becomes false)
        } catch (error) {
            Alert.alert('Error', 'Failed to save your answers. Please try again.');
        }
    };

    const isLastQuestion = currentIndex === selectedQuestions.length - 1;
    const categoryColor = currentQuestion ? CATEGORY_COLORS[currentQuestion.category] : theme.colors.primary;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={[theme.colors.background, theme.colors.backgroundLight]}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Question {currentIndex + 1} of {selectedQuestions.length}</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressStep, styles.progressComplete]} />
                        <View style={[styles.progressStep, styles.progressComplete]} />
                        <View style={[styles.progressStep, styles.progressActive]} />
                    </View>
                    <Text style={styles.progressText}>Step 3 of 3</Text>
                </View>

                {/* Visual Progress */}
                <View style={styles.questionProgressContainer}>
                    <View style={styles.questionProgressBar}>
                        <Animated.View
                            style={[
                                styles.questionProgressFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    backgroundColor: categoryColor,
                                },
                            ]}
                        />
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Question Card */}
                    <Animated.View
                        style={[
                            styles.questionCardContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateX: slideAnim }],
                            },
                        ]}
                    >
                        <Card variant="elevated" style={styles.questionCard}>
                            {/* Emoji & Category */}
                            <View style={styles.questionHeader}>
                                <Text style={styles.emoji}>{currentQuestion?.emoji}</Text>
                                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                                        {currentQuestion?.category}
                                    </Text>
                                </View>
                            </View>

                            {/* Question Text */}
                            <Text style={styles.questionText}>{currentQuestion?.question}</Text>
                        </Card>

                        {/* Answer Input */}
                        <View style={styles.answerContainer}>
                            <Text style={styles.answerLabel}>Your Response</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder={currentQuestion?.placeholder || "I would..."}
                                    placeholderTextColor={theme.colors.textSecondary}
                                    multiline
                                    textAlignVertical="top"
                                    value={currentAnswer}
                                    onChangeText={handleAnswerChange}
                                    maxLength={600} // Roughly 100 words
                                />
                            </View>

                            {/* Word Counter */}
                            <View style={styles.wordCountContainer}>
                                <Text style={[
                                    styles.wordCount,
                                    wordCount > 100 && styles.wordCountError,
                                ]}>
                                    {wordCount}/100 words
                                </Text>
                                {wordCount > 100 && (
                                    <Text style={styles.wordCountWarning}>
                                        Please keep your answer under 100 words
                                    </Text>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <Button
                        title={isLastQuestion ? "Complete" : "Next"}
                        onPress={isLastQuestion ? handleComplete : handleNext}
                        disabled={!isAnswerValid}
                        style={styles.nextBtn}
                    />

                    {/* Question Dots */}
                    <View style={styles.dotsContainer}>
                        {selectedQuestions.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentIndex && styles.dotActive,
                                    index < currentIndex && styles.dotComplete,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.subheading,
        color: theme.colors.textPrimary,
    },
    headerRight: {
        width: 40,
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
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
    progressComplete: {
        backgroundColor: theme.colors.accent,
    },
    progressText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    questionProgressContainer: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    questionProgressBar: {
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    questionProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    questionCardContainer: {},
    questionCard: {
        marginBottom: theme.spacing.xl,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    emoji: {
        fontSize: 48,
        marginRight: theme.spacing.md,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    categoryText: {
        ...theme.typography.caption,
        fontWeight: '600',
    },
    questionText: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        fontSize: 18,
        lineHeight: 28,
    },
    answerContainer: {
        marginTop: theme.spacing.md,
    },
    answerLabel: {
        ...theme.typography.bodyBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    inputWrapper: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.sm,
    },
    textInput: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        padding: theme.spacing.lg,
        minHeight: 150,
    },
    wordCountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    wordCount: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    wordCountError: {
        color: '#E74C3C',
    },
    wordCountWarning: {
        ...theme.typography.caption,
        color: '#E74C3C',
        flex: 1,
        textAlign: 'right',
    },
    bottomActions: {
        padding: theme.spacing.lg,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    nextBtn: {
        marginBottom: theme.spacing.md,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
    },
    dotActive: {
        backgroundColor: theme.colors.primary,
        width: 24,
    },
    dotComplete: {
        backgroundColor: theme.colors.accent,
    },
});
