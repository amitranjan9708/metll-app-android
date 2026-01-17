import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/useTheme';
import { useAuth } from '../context/AuthContext';
import { userApi, authApi } from '../services/api';
import { DatingPreferences } from '../types';

const { width } = Dimensions.get('window');

type DiscoverStep = 'intro' | 'photos' | 'preferences' | 'lifestyle' | 'complete';

const STEPS: DiscoverStep[] = ['intro', 'photos', 'preferences', 'lifestyle', 'complete'];

const MAX_ADDITIONAL_PHOTOS = 5;

// Preference options
const RELATIONSHIP_TYPES = [
    { value: 'friends_first', label: 'Friends First', emoji: '👋' },
    { value: 'monogamy', label: 'Monogamy', emoji: '💑' },
    { value: 'non_monogamy', label: 'Non-Monogamy', emoji: '💫' },
    { value: 'open_to_all', label: 'Open to All', emoji: '🌈' },
    { value: 'figuring_out', label: 'Figuring Out', emoji: '🤔' },
];

const DATING_INTENTIONS = [
    { value: 'casual', label: 'Casual Dating', emoji: '🌴' },
    { value: 'serious', label: 'Serious Relationship', emoji: '💝' },
    { value: 'marriage', label: 'Marriage', emoji: '💍' },
    { value: 'open_to_all', label: 'Open to All', emoji: '✨' },
];

const GENDER_OPTIONS = [
    { value: 'male', label: 'Men' },
    { value: 'female', label: 'Women' },
    { value: 'non-binary', label: 'Non-Binary' },
    { value: 'all', label: 'Everyone' },
];

const LIFESTYLE_OPTIONS = {
    smoking: [
        { value: 'never', label: 'Never' },
        { value: 'sometimes', label: 'Sometimes' },
        { value: 'regularly', label: 'Regularly' },
        { value: 'prefer_not_say', label: 'Prefer not to say' },
    ],
    drinking: [
        { value: 'never', label: 'Never' },
        { value: 'socially', label: 'Socially' },
        { value: 'regularly', label: 'Regularly' },
        { value: 'prefer_not_say', label: 'Prefer not to say' },
    ],
    children: [
        { value: 'have', label: 'Have kids' },
        { value: 'want', label: 'Want kids' },
        { value: 'dont_want', label: "Don't want" },
        { value: 'open', label: 'Open to it' },
    ],
};

export const DiscoverOnboardingScreen: React.FC = () => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { completeDiscoverOnboarding } = useAuth();

    const [currentStep, setCurrentStep] = useState<DiscoverStep>('intro');
    const [loading, setLoading] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Photos state
    const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

    // Preferences state
    const [preferences, setPreferences] = useState<Partial<DatingPreferences>>({
        relationshipType: 'open_to_all',
        datingIntention: 'open_to_all',
        genderPreference: ['all'],
        ageMin: 18,
        ageMax: 35,
        distanceMax: 50,
        smoking: undefined,
        drinking: undefined,
        children: undefined,
    });

    const stepIndex = STEPS.indexOf(currentStep);

    const animateTransition = (direction: 'forward' | 'back') => {
        const toValue = direction === 'forward' ? -width : width;
        Animated.sequence([
            Animated.timing(slideAnim, {
                toValue,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            animateTransition('forward');
            setCurrentStep(STEPS[stepIndex + 1]);
        }
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            animateTransition('back');
            setCurrentStep(STEPS[stepIndex - 1]);
        }
    };

    const handleComplete = async () => {
        try {
            setLoading(true);

            // Save preferences to backend
            const prefsResult = await userApi.saveDatingPreferences(preferences);
            if (!prefsResult.success) {
                console.warn('Failed to save preferences:', prefsResult.message);
            }

            // Mark discover onboarding as complete on backend
            await userApi.completeDiscoverOnboarding();

            // Update local state
            await completeDiscoverOnboarding();

            // Navigate to main app
            navigation.replace('Main');
        } catch (error) {
            console.error('Failed to complete discover onboarding:', error);
            Alert.alert('Error', 'Failed to save preferences. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Go back to Home screen instead of Date
        // User can onboard later by going to Date tab
        navigation.navigate('Main', {
            screen: 'Home'
        });
    };

    const toggleGenderPreference = (value: string) => {
        const current = preferences.genderPreference || [];
        if (value === 'all') {
            setPreferences(p => ({ ...p, genderPreference: ['all'] }));
        } else {
            const filtered = current.filter(v => v !== 'all');
            if (filtered.includes(value)) {
                setPreferences(p => ({ ...p, genderPreference: filtered.filter(v => v !== value) }));
            } else {
                setPreferences(p => ({ ...p, genderPreference: [...filtered, value] }));
            }
        }
    };

    const handlePickPhoto = async () => {
        if (additionalPhotos.length >= MAX_ADDITIONAL_PHOTOS) {
            Alert.alert('Maximum Photos', `You can only add up to ${MAX_ADDITIONAL_PHOTOS} additional photos.`);
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAdditionalPhotos(prev => [...prev, result.assets[0].uri]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleRemovePhoto = (index: number) => {
        setAdditionalPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadPhotos = async () => {
        if (additionalPhotos.length === 0) {
            handleNext();
            return;
        }

        try {
            setUploadingPhotos(true);
            const result = await authApi.uploadPhotos(additionalPhotos);
            if (!result.success) {
                console.warn('Failed to upload photos:', result.message);
                Alert.alert('Warning', 'Some photos may not have been uploaded. You can add more later.');
            }
            handleNext();
        } catch (error) {
            console.error('Error uploading photos:', error);
            Alert.alert('Error', 'Failed to upload photos. You can try again later from your profile.');
            handleNext();
        } finally {
            setUploadingPhotos(false);
        }
    };

    const renderPhotosStep = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Add More Photos</Text>
            <Text style={styles.sectionSubtitle}>
                Show off your personality! Add up to {MAX_ADDITIONAL_PHOTOS} additional photos to your profile.
            </Text>

            <View style={styles.photosGrid}>
                {additionalPhotos.map((uri, index) => (
                    <View key={index} style={styles.photoContainer}>
                        <Image source={{ uri }} style={styles.photoImage} />
                        <TouchableOpacity
                            style={styles.removePhotoButton}
                            onPress={() => handleRemovePhoto(index)}
                        >
                            <Ionicons name="close-circle" size={28} color="#ff4444" />
                        </TouchableOpacity>
                    </View>
                ))}

                {additionalPhotos.length < MAX_ADDITIONAL_PHOTOS && (
                    <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhoto}>
                        <Ionicons name="add" size={40} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.addPhotoText}>Add Photo</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.photoTip}>
                💡 Tip: Photos showing your hobbies and interests get more matches!
            </Text>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderIntroStep = () => (
        <View style={styles.stepContent}>
            <View style={styles.introContainer}>
                <Text style={styles.introEmoji}>🌹</Text>
                <Text style={styles.introTitle}>Welcome to Discover</Text>
                <Text style={styles.introSubtitle}>
                    Let's set up your dating preferences to show you the most compatible matches
                </Text>

                <View style={styles.introFeatures}>
                    <View style={styles.featureRow}>
                        <Ionicons name="heart" size={24} color={theme.colors.primary} />
                        <Text style={styles.featureText}>Find compatible matches</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="options" size={24} color={theme.colors.primary} />
                        <Text style={styles.featureText}>Set your preferences</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
                        <Text style={styles.featureText}>Control who you see</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderPreferencesStep = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>What are you looking for?</Text>

            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Relationship Type</Text>
                <View style={styles.optionsGrid}>
                    {RELATIONSHIP_TYPES.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionChip,
                                preferences.relationshipType === option.value && styles.optionChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, relationshipType: option.value as any }))}
                        >
                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            <Text style={[
                                styles.optionChipText,
                                preferences.relationshipType === option.value && styles.optionChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Dating Intention</Text>
                <View style={styles.optionsGrid}>
                    {DATING_INTENTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionChip,
                                preferences.datingIntention === option.value && styles.optionChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, datingIntention: option.value as any }))}
                        >
                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            <Text style={[
                                styles.optionChipText,
                                preferences.datingIntention === option.value && styles.optionChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Show me</Text>
                <View style={styles.optionsRow}>
                    {GENDER_OPTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.genderChip,
                                preferences.genderPreference?.includes(option.value) && styles.genderChipSelected,
                            ]}
                            onPress={() => toggleGenderPreference(option.value)}
                        >
                            <Text style={[
                                styles.genderChipText,
                                preferences.genderPreference?.includes(option.value) && styles.genderChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderLifestyleStep = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>A bit about your lifestyle</Text>
            <Text style={styles.sectionSubtitle}>These are optional but help find better matches</Text>

            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>🚬 Smoking</Text>
                <View style={styles.optionsRow}>
                    {LIFESTYLE_OPTIONS.smoking.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.lifestyleChip,
                                preferences.smoking === option.value && styles.lifestyleChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, smoking: option.value }))}
                        >
                            <Text style={[
                                styles.lifestyleChipText,
                                preferences.smoking === option.value && styles.lifestyleChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>🍷 Drinking</Text>
                <View style={styles.optionsRow}>
                    {LIFESTYLE_OPTIONS.drinking.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.lifestyleChip,
                                preferences.drinking === option.value && styles.lifestyleChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, drinking: option.value }))}
                        >
                            <Text style={[
                                styles.lifestyleChipText,
                                preferences.drinking === option.value && styles.lifestyleChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>👶 Children</Text>
                <View style={styles.optionsRow}>
                    {LIFESTYLE_OPTIONS.children.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.lifestyleChip,
                                preferences.children === option.value && styles.lifestyleChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, children: option.value }))}
                        >
                            <Text style={[
                                styles.lifestyleChipText,
                                preferences.children === option.value && styles.lifestyleChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderCompleteStep = () => (
        <View style={styles.stepContent}>
            <View style={styles.completeContainer}>
                <Text style={styles.completeEmoji}>🎉</Text>
                <Text style={styles.completeTitle}>You're all set!</Text>
                <Text style={styles.completeSubtitle}>
                    Start discovering amazing people who match your preferences
                </Text>
            </View>
        </View>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 'intro':
                return renderIntroStep();
            case 'photos':
                return renderPhotosStep();
            case 'preferences':
                return renderPreferencesStep();
            case 'lifestyle':
                return renderLifestyleStep();
            case 'complete':
                return renderCompleteStep();
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header */}
            <View style={styles.header}>
                {currentStep === 'intro' ? (
                    <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                ) : stepIndex > 0 && currentStep !== 'complete' ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButton} />
                )}

                <View style={styles.progressContainer}>
                    {STEPS.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressDot,
                                index <= stepIndex && styles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.skipButton} />
            </View>

            {/* Content */}
            <Animated.View
                style={[styles.content, { transform: [{ translateX: slideAnim }] }]}
            >
                {renderStep()}
            </Animated.View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                {currentStep === 'complete' ? (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleComplete}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Start Discovering</Text>
                        )}
                    </TouchableOpacity>
                ) : currentStep === 'photos' ? (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleUploadPhotos}
                        disabled={uploadingPhotos}
                    >
                        {uploadingPhotos ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.primaryButtonText}>
                                    {additionalPhotos.length > 0 ? 'Upload & Continue' : 'Skip for Now'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                        <Text style={styles.primaryButtonText}>
                            {currentStep === 'intro' ? "Let's Go" : 'Continue'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const getStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
        },
        backButton: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        skipButton: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        progressContainer: {
            flexDirection: 'row',
            gap: 8,
        },
        progressDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.3)',
        },
        progressDotActive: {
            backgroundColor: '#fff',
        },
        content: {
            flex: 1,
        },
        stepContent: {
            flex: 1,
            paddingHorizontal: 24,
        },
        footer: {
            paddingHorizontal: 24,
            paddingTop: 16,
        },
        primaryButton: {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        primaryButtonText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '700',
        },
        // Intro step
        introContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        introEmoji: {
            fontSize: 72,
            marginBottom: 24,
        },
        introTitle: {
            fontSize: 32,
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: 12,
        },
        introSubtitle: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 48,
            paddingHorizontal: 20,
        },
        introFeatures: {
            gap: 16,
        },
        featureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        featureText: {
            fontSize: 16,
            color: '#fff',
            fontWeight: '500',
        },
        // Preferences
        sectionTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: '#fff',
            marginBottom: 8,
            marginTop: 16,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 24,
        },
        // Photos
        photosGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 8,
        },
        photoContainer: {
            width: (width - 64) / 3,
            height: (width - 64) / 3 * 1.3,
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
        },
        photoImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        removePhotoButton: {
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: '#fff',
            borderRadius: 14,
        },
        addPhotoButton: {
            width: (width - 64) / 3,
            height: (width - 64) / 3 * 1.3,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
        },
        addPhotoText: {
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            marginTop: 4,
        },
        photoTip: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            marginTop: 24,
            paddingHorizontal: 20,
        },
        optionGroup: {
            marginBottom: 32,
        },
        optionLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: '#fff',
            marginBottom: 12,
        },
        optionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        optionsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        optionChip: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 24,
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        optionChipSelected: {
            backgroundColor: '#fff',
            borderColor: '#fff',
        },
        optionEmoji: {
            fontSize: 18,
        },
        optionChipText: {
            fontSize: 14,
            color: '#fff',
            fontWeight: '500',
        },
        optionChipTextSelected: {
            color: theme.colors.primary,
        },
        genderChip: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        genderChipSelected: {
            backgroundColor: '#fff',
            borderColor: '#fff',
        },
        genderChipText: {
            fontSize: 14,
            color: '#fff',
            fontWeight: '500',
        },
        genderChipTextSelected: {
            color: theme.colors.primary,
        },
        // Lifestyle
        lifestyleChip: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        lifestyleChipSelected: {
            backgroundColor: '#fff',
            borderColor: '#fff',
        },
        lifestyleChipText: {
            fontSize: 13,
            color: '#fff',
            fontWeight: '500',
        },
        lifestyleChipTextSelected: {
            color: theme.colors.primary,
        },
        // Complete
        completeContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        completeEmoji: {
            fontSize: 72,
            marginBottom: 24,
        },
        completeTitle: {
            fontSize: 32,
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: 12,
        },
        completeSubtitle: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 20,
        },
    });
