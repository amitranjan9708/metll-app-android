import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SituationQuestion, SituationCategory } from '../types';

const { width } = Dimensions.get('window');

export const SITUATIONS: SituationQuestion[] = [
    // Dating & Relationships
    {
        id: 1,
        category: 'Dating',
        emoji: '💕',
        question: "Your date is 30 minutes late without texting. What do you do?",
        placeholder: "I would..."
    },
    {
        id: 2,
        category: 'Dating',
        emoji: '🌹',
        question: "You realize your date is your best friend's ex. What's your move?",
        placeholder: "I would..."
    },
    {
        id: 3,
        category: 'Dating',
        emoji: '💭',
        question: "Your crush posts about being single, but they've been ignoring your messages. What do you do?",
        placeholder: "I would..."
    },
    {
        id: 4,
        category: 'Dating',
        emoji: '🎭',
        question: "On the first date, they spend 20 minutes on their phone. How do you handle it?",
        placeholder: "I would..."
    },
    {
        id: 5,
        category: 'Dating',
        emoji: '🎪',
        question: "You accidentally like your crush's photo from 2 years ago. What's your next move?",
        placeholder: "I would..."
    },

    // Social Situations
    {
        id: 6,
        category: 'Social',
        emoji: '🎉',
        question: "You're at a party where you don't know anyone except the host who's busy. What do you do?",
        placeholder: "I would..."
    },
    {
        id: 7,
        category: 'Social',
        emoji: '🤝',
        question: "Your friend's partner hits on you when they're not around. How do you handle it?",
        placeholder: "I would..."
    },
    {
        id: 8,
        category: 'Social',
        emoji: '😬',
        question: "You witness someone being rude to a waiter. What's your reaction?",
        placeholder: "I would..."
    },
    {
        id: 9,
        category: 'Social',
        emoji: '🎤',
        question: "At karaoke, everyone's pressuring you to sing but you're shy. What do you do?",
        placeholder: "I would..."
    },
    {
        id: 10,
        category: 'Social',
        emoji: '🍕',
        question: "Your friends order pineapple pizza and you hate it. Do you speak up or eat it?",
        placeholder: "I would..."
    },

    // Adventure & Travel
    {
        id: 11,
        category: 'Adventure',
        emoji: '✈️',
        question: "You have $500 and 3 days off. Beach getaway or mountain trek?",
        placeholder: "I would choose..."
    },
    {
        id: 12,
        category: 'Adventure',
        emoji: '🗺️',
        question: "Lost in a new city with no internet. How do you find your way?",
        placeholder: "I would..."
    },
    {
        id: 13,
        category: 'Adventure',
        emoji: '🎢',
        question: "Your friends want to ride the scariest roller coaster. You're terrified. What do you do?",
        placeholder: "I would..."
    },
    {
        id: 14,
        category: 'Adventure',
        emoji: '🏕️',
        question: "Camping trip: You hear strange noises at 2 AM. What's your move?",
        placeholder: "I would..."
    },
    {
        id: 15,
        category: 'Adventure',
        emoji: '🚗',
        question: "Road trip DJ duty is yours. What's playing first?",
        placeholder: "I would play..."
    },

    // Life Choices
    {
        id: 16,
        category: 'Life',
        emoji: '💼',
        question: "Dream job offer but you have to relocate to another city. What influences your decision?",
        placeholder: "I would consider..."
    },
    {
        id: 17,
        category: 'Life',
        emoji: '🎓',
        question: "You find out your degree won't help in your dream career. Do you pivot or persist?",
        placeholder: "I would..."
    },
    {
        id: 18,
        category: 'Life',
        emoji: '🏠',
        question: "Your roommate never cleans up. How do you address it?",
        placeholder: "I would..."
    },
    {
        id: 19,
        category: 'Life',
        emoji: '💰',
        question: "You find ₹50,000 on the street. What's your first thought and action?",
        placeholder: "I would..."
    },
    {
        id: 20,
        category: 'Life',
        emoji: '⏰',
        question: "It's 11 PM and you're hungry. Order food, cook, or skip dinner?",
        placeholder: "I would..."
    },

    // Entertainment & Hobbies
    {
        id: 21,
        category: 'Entertainment',
        emoji: '🎬',
        question: "Your date wants to watch a 3-hour subtitled art film. You prefer action movies. What happens?",
        placeholder: "I would..."
    },
    {
        id: 22,
        category: 'Entertainment',
        emoji: '📚',
        question: "Someone spoils the ending of your favorite show. How do you react?",
        placeholder: "I would..."
    },
    {
        id: 23,
        category: 'Entertainment',
        emoji: '🎮',
        question: "You're losing badly in a game with friends. Rage quit, make excuses, or keep playing?",
        placeholder: "I would..."
    },
    {
        id: 24,
        category: 'Entertainment',
        emoji: '🎨',
        question: "Free weekend: Netflix marathon, paint/create something, or outdoor adventure?",
        placeholder: "I would choose..."
    },
    {
        id: 25,
        category: 'Entertainment',
        emoji: '🎵',
        question: "Concert tickets for your favorite artist drop today. They're expensive and you're broke. What do you do?",
        placeholder: "I would..."
    },

    // Ethical Dilemmas
    {
        id: 26,
        category: 'Ethics',
        emoji: '🤔',
        question: "You see your friend's partner on a dating app. Do you tell your friend?",
        placeholder: "I would..."
    },
    {
        id: 27,
        category: 'Ethics',
        emoji: '💳',
        question: "Cashier gives you extra ₹500 in change. Do you return it?",
        placeholder: "I would..."
    },
    {
        id: 28,
        category: 'Ethics',
        emoji: '🐕',
        question: "You find a lost, expensive-looking dog. Wait for owner, take to shelter, or keep it?",
        placeholder: "I would..."
    },
    {
        id: 29,
        category: 'Ethics',
        emoji: '📱',
        question: "Your crush accidentally sends you a screenshot meant for someone else, talking about you. What do you do?",
        placeholder: "I would..."
    },
    {
        id: 30,
        category: 'Ethics',
        emoji: '🎁',
        question: "You're regifted something you originally gave someone else. How do you feel and react?",
        placeholder: "I would..."
    }
];

const CATEGORIES: (SituationCategory | 'All')[] = ['All', 'Dating', 'Social', 'Adventure', 'Life', 'Entertainment', 'Ethics'];

const CATEGORY_COLORS: Record<SituationCategory, string> = {
    Dating: '#E8A4B8',
    Social: '#6B7FBF',
    Adventure: '#4CAF50',
    Life: '#FF9800',
    Entertainment: '#9C27B0',
    Ethics: '#607D8B',
};

export const SituationSelectionScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [selectedCategory, setSelectedCategory] = useState<SituationCategory | 'All'>('All');
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(SITUATIONS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Stagger card animations
        SITUATIONS.forEach((_, index) => {
            Animated.timing(cardAnims[index], {
                toValue: 1,
                duration: 300,
                delay: 100 + index * 30,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const filteredSituations = selectedCategory === 'All'
        ? SITUATIONS
        : SITUATIONS.filter(s => s.category === selectedCategory);

    const toggleQuestion = (id: number) => {
        if (selectedQuestions.includes(id)) {
            setSelectedQuestions(prev => prev.filter(q => q !== id));
        } else if (selectedQuestions.length < 5) {
            setSelectedQuestions(prev => [...prev, id]);
        }
    };

    const handleContinue = () => {
        if (selectedQuestions.length === 5) {
            const selected = SITUATIONS.filter(s => selectedQuestions.includes(s.id));
            navigation.navigate('SituationAnswer', { selectedQuestions: selected });
        }
    };

    const isSelected = (id: number) => selectedQuestions.includes(id);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[theme.colors.background, theme.colors.background + '00']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Choose 5 Situations</Text>
                    <View style={styles.counterBadge}>
                        <Text style={styles.counterText}>{selectedQuestions.length}/5</Text>
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressStep, styles.progressComplete]} />
                        <View style={[styles.progressStep, styles.progressActive]} />
                        <View style={styles.progressStep} />
                    </View>
                    <Text style={styles.progressText}>Step 2 of 3</Text>
                </View>

                {/* Category Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryContainer}
                >
                    {CATEGORIES.map(category => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryTab,
                                selectedCategory === category && styles.categoryTabActive,
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text
                                style={[
                                    styles.categoryTabText,
                                    selectedCategory === category && styles.categoryTabTextActive,
                                ]}
                            >
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            {/* Questions Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.questionsContainer}
                showsVerticalScrollIndicator={false}
            >
                {filteredSituations.map((situation, index) => {
                    const selected = isSelected(situation.id);
                    const categoryColor = CATEGORY_COLORS[situation.category];

                    return (
                        <Animated.View
                            key={situation.id}
                            style={{
                                opacity: cardAnims[index] || 1,
                                transform: [
                                    {
                                        translateY: (cardAnims[index] || new Animated.Value(1)).interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.questionCard,
                                    selected && styles.questionCardSelected,
                                    selected && { borderColor: categoryColor },
                                ]}
                                onPress={() => toggleQuestion(situation.id)}
                                activeOpacity={0.7}
                                disabled={!selected && selectedQuestions.length >= 5}
                            >
                                {/* Selection indicator */}
                                <View style={[
                                    styles.selectionIndicator,
                                    selected && { backgroundColor: categoryColor },
                                ]}>
                                    {selected ? (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    ) : (
                                        <Text style={styles.selectionNumber}>
                                            {selectedQuestions.length < 5 ? '' : ''}
                                        </Text>
                                    )}
                                </View>

                                {/* Emoji */}
                                <Text style={styles.questionEmoji}>{situation.emoji}</Text>

                                {/* Category Badge */}
                                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                                    <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                                        {situation.category}
                                    </Text>
                                </View>

                                {/* Question */}
                                <Text style={styles.questionText} numberOfLines={3}>
                                    {situation.question}
                                </Text>

                                {/* Disabled overlay */}
                                {!selected && selectedQuestions.length >= 5 && (
                                    <View style={styles.disabledOverlay} />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.bottomAction}>
                <Button
                    title={selectedQuestions.length === 5 ? "Continue" : `Select ${5 - selectedQuestions.length} more`}
                    onPress={handleContinue}
                    disabled={selectedQuestions.length !== 5}
                    style={styles.continueBtn}
                />
            </View>
        </View>
    );
};

const cardWidth = (width - 48 - 12) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 16,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.subheading,
        color: theme.colors.textPrimary,
    },
    counterBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    counterText: {
        ...theme.typography.caption,
        color: '#fff',
        fontWeight: '700',
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.md,
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
    categoryScroll: {
        maxHeight: 40,
    },
    categoryContainer: {
        paddingHorizontal: theme.spacing.lg,
        gap: 8,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.backgroundLight,
    },
    categoryTabActive: {
        backgroundColor: theme.colors.primary,
    },
    categoryTabText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    categoryTabTextActive: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    questionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: theme.spacing.lg,
        gap: 12,
        paddingBottom: 100,
    },
    questionCard: {
        width: cardWidth,
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        position: 'relative',
        minHeight: 160,
        ...theme.shadows.sm,
    },
    questionCardSelected: {
        borderWidth: 2,
        ...theme.shadows.md,
    },
    selectionIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionNumber: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    questionEmoji: {
        fontSize: 32,
        marginBottom: theme.spacing.sm,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.sm,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    questionText: {
        ...theme.typography.caption,
        color: theme.colors.textPrimary,
        lineHeight: 18,
    },
    disabledOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.background,
        opacity: 0.6,
        borderRadius: theme.borderRadius.lg,
    },
    bottomAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        paddingBottom: 34,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    continueBtn: {},
});
