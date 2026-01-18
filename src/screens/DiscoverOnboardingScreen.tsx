import React, { useState, useRef, useEffect } from 'react';
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
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../theme/useTheme';
import { useAuth } from '../context/AuthContext';
import { userApi, authApi } from '../services/api';
import { DatingPreferences } from '../types';
import { useAppFonts, fontFamily } from '../theme/fonts';

const { width } = Dimensions.get('window');

type DiscoverStep = 'intro' | 'basics' | 'photos' | 'preferences' | 'lifestyle' | 'complete';

const STEPS: DiscoverStep[] = ['intro', 'basics', 'photos', 'preferences', 'lifestyle', 'complete'];

// User's own gender options
const MY_GENDER_OPTIONS = [
    { value: 'male', label: 'Man', emoji: '👨' },
    { value: 'female', label: 'Woman', emoji: '👩' },
    { value: 'non-binary', label: 'Non-Binary', emoji: '🧑' },
    { value: 'other', label: 'Other', emoji: '✨' },
];

// Height options in cm
const HEIGHT_OPTIONS = [
    { value: 150, label: "4'11\" (150cm)" },
    { value: 155, label: "5'1\" (155cm)" },
    { value: 160, label: "5'3\" (160cm)" },
    { value: 165, label: "5'5\" (165cm)" },
    { value: 170, label: "5'7\" (170cm)" },
    { value: 175, label: "5'9\" (175cm)" },
    { value: 180, label: "5'11\" (180cm)" },
    { value: 185, label: "6'1\" (185cm)" },
    { value: 190, label: "6'3\" (190cm)" },
    { value: 195, label: "6'5\" (195cm)" },
    { value: 200, label: "6'7\"+ (200cm+)" },
];

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
    const fontsLoaded = useAppFonts();

    const [showSplash, setShowSplash] = useState(true);
    const [currentStep, setCurrentStep] = useState<DiscoverStep>('intro');
    const [loading, setLoading] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Splash animation refs
    const splashOpacity = useRef(new Animated.Value(0)).current;
    const splashScale = useRef(new Animated.Value(0.8)).current;
    const letterAnimations = useRef(
        ['m', 'e', 't', 'l', 'l'].map(() => new Animated.Value(0))
    ).current;

    // Basic profile info state
    const [age, setAge] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [height, setHeight] = useState<number | null>(null);
    const [bio, setBio] = useState<string>('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [currentCity, setCurrentCity] = useState<string>('');
    const [locationLoading, setLocationLoading] = useState(false);

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

    // Run splash animation on mount - wait for fonts to load
    useEffect(() => {
        if (!fontsLoaded) return;

        // Main entrance animation
        Animated.parallel([
            Animated.timing(splashOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(splashScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Animate letters one by one with a dramatic spring
        const letterStagger = Animated.stagger(
            120, // slightly slower stagger for elegance
            letterAnimations.map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 6,
                    tension: 35,
                    useNativeDriver: true,
                })
            )
        );

        setTimeout(() => letterStagger.start(), 300);

        // Hide splash after animation
        const timer = setTimeout(() => {
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => setShowSplash(false));
        }, 3500); // Extended duration

        return () => clearTimeout(timer);
    }, [fontsLoaded]);

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
        // Validate basics step
        if (currentStep === 'basics') {
            const ageNum = parseInt(age);
            if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
                Alert.alert('Required', 'Please enter a valid age (18-100)');
                return;
            }
            if (!gender) {
                Alert.alert('Required', 'Please select your gender');
                return;
            }
        }

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

            // Save basic profile data to backend (age, gender, height, bio, location)
            const profileData: any = {
                age: parseInt(age) || null,
                gender,
                height: height || null,
                bio: bio || null,
            };
            if (latitude && longitude) {
                profileData.latitude = latitude;
                profileData.longitude = longitude;
            }
            if (currentCity) {
                profileData.currentCity = currentCity;
            }

            console.log('📝 Saving profile data:', profileData);
            const profileResult = await userApi.updateProfile(profileData);
            if (!profileResult.success) {
                console.warn('Failed to save profile:', profileResult.message);
            }

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

    const handleGetLocation = async () => {
        try {
            setLocationLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is needed to find matches near you.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLatitude(location.coords.latitude);
            setLongitude(location.coords.longitude);

            // Try to get city name from coordinates
            try {
                const [address] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                if (address?.city) {
                    setCurrentCity(address.city);
                } else if (address?.subregion) {
                    setCurrentCity(address.subregion);
                }
            } catch (geocodeError) {
                console.warn('Reverse geocode failed:', geocodeError);
            }

            Alert.alert('Success', 'Location updated!');
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get location. You can update it later in settings.');
        } finally {
            setLocationLoading(false);
        }
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
                        <Ionicons name="add" size={40} color="#AAAAAA" />
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

    const renderBasicsStep = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Tell us about yourself</Text>
            <Text style={styles.sectionSubtitle}>
                This helps us show you to the right people
            </Text>

            {/* Age */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Your Age</Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={age}
                        onChangeText={(text) => {
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (numericText === '' || (parseInt(numericText) >= 0 && parseInt(numericText) <= 100)) {
                                setAge(numericText);
                            }
                        }}
                        keyboardType="numeric"
                        placeholder="Enter your age"
                        placeholderTextColor="#AAAAAA"
                        maxLength={2}
                    />
                </View>
                <Text style={styles.inputHint}>You must be 18 or older to use this app</Text>
            </View>

            {/* Gender */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>I am a</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {MY_GENDER_OPTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                gender === option.value && styles.modernChipSelected,
                            ]}
                            onPress={() => setGender(option.value)}
                        >
                            <Text style={[
                                styles.modernChipText,
                                gender === option.value && styles.modernChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Height */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="resize-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Height</Text>
                    <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heightScroll}>
                    <View style={styles.optionsRow}>
                        {HEIGHT_OPTIONS.map(option => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.heightChip,
                                    height === option.value && styles.heightChipSelected,
                                ]}
                                onPress={() => setHeight(height === option.value ? null : option.value)}
                            >
                                <Text style={[
                                    styles.heightChipText,
                                    height === option.value && styles.heightChipTextSelected,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Bio */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>About me</Text>
                    <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <View style={styles.bioInputContainer}>
                    <TextInput
                        style={styles.bioInput}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Write a short bio about yourself..."
                        placeholderTextColor="#AAAAAA"
                        multiline
                        maxLength={300}
                        numberOfLines={4}
                    />
                </View>
                <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>

            {/* Location */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Location</Text>
                    <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <TouchableOpacity
                    style={styles.locationButton}
                    onPress={handleGetLocation}
                    disabled={locationLoading}
                >
                    {locationLoading ? (
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                        <>
                            <Ionicons name="location" size={20} color={theme.colors.primary} />
                            <Text style={styles.locationButtonText}>
                                {currentCity ? currentCity : 'Get My Location'}
                            </Text>
                            {!currentCity && (
                                <Ionicons name="chevron-forward" size={18} color="#AAAAAA" />
                            )}
                        </>
                    )}
                </TouchableOpacity>
                {currentCity && (
                    <Text style={styles.locationHint}>Location helps show you nearby matches</Text>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderIntroStep = () => (
        <View style={styles.stepContent}>
            <View style={styles.introContainer}>
                <Text style={styles.introTitle}>MetLL</Text>
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
            <Text style={styles.sectionSubtitle}>Help us find your perfect match</Text>

            {/* Relationship Type */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Relationship Type</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {RELATIONSHIP_TYPES.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                preferences.relationshipType === option.value && styles.modernChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, relationshipType: option.value as any }))}
                        >
                            <Text style={[
                                styles.modernChipText,
                                preferences.relationshipType === option.value && styles.modernChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Dating Intention */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Dating Intention</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {DATING_INTENTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                preferences.datingIntention === option.value && styles.modernChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, datingIntention: option.value as any }))}
                        >
                            <Text style={[
                                styles.modernChipText,
                                preferences.datingIntention === option.value && styles.modernChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Show Me */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Show me</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {GENDER_OPTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                preferences.genderPreference?.includes(option.value) && styles.modernChipSelected,
                            ]}
                            onPress={() => toggleGenderPreference(option.value)}
                        >
                            <Text style={[
                                styles.modernChipText,
                                preferences.genderPreference?.includes(option.value) && styles.modernChipTextSelected,
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

            {/* Smoking */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="cloud-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Smoking</Text>
                    <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {LIFESTYLE_OPTIONS.smoking.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                preferences.smoking === option.value && styles.modernChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, smoking: option.value }))}
                        >
                            <Text style={[
                                styles.modernChipText,
                                preferences.smoking === option.value && styles.modernChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Drinking */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="wine-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Drinking</Text>
                    <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {LIFESTYLE_OPTIONS.drinking.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                preferences.drinking === option.value && styles.modernChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, drinking: option.value }))}
                        >
                            <Text style={[
                                styles.modernChipText,
                                preferences.drinking === option.value && styles.modernChipTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Children */}
            <View style={styles.basicsCard}>
                <View style={styles.basicsCardHeader}>
                    <View style={styles.basicsIconContainer}>
                        <Ionicons name="happy-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.basicsCardTitle}>Children</Text>
                    <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <View style={styles.optionsGrid}>
                    {LIFESTYLE_OPTIONS.children.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.modernChip,
                                preferences.children === option.value && styles.modernChipSelected,
                            ]}
                            onPress={() => setPreferences(p => ({ ...p, children: option.value }))}
                        >
                            <Text style={[
                                styles.modernChipText,
                                preferences.children === option.value && styles.modernChipTextSelected,
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
            case 'basics':
                return renderBasicsStep();
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
            {/* Animated Splash Screen */}
            {showSplash && (
                <Animated.View
                    style={[
                        styles.splashContainer,
                        {
                            opacity: splashOpacity,
                            transform: [{ scale: splashScale }]
                        }
                    ]}
                >
                    <View style={styles.splashLogoContainer}>
                        {['m', 'e', 't', 'l', 'l'].map((letter, index) => (
                            <Animated.Text
                                key={index}
                                style={[
                                    styles.splashLetter,
                                    {
                                        opacity: letterAnimations[index],
                                        transform: [
                                            {
                                                translateY: letterAnimations[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [20, 0],
                                                }),
                                            },
                                            {
                                                scale: letterAnimations[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.5, 1],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                {letter}
                            </Animated.Text>
                        ))}
                    </View>
                    <Animated.Text style={[styles.splashTagline, { opacity: splashOpacity }]}>
                        Find your perfect match
                    </Animated.Text>
                </Animated.View>
            )}

            {/* Main Content */}
            {!showSplash && (
                <>
                    {/* Clean white background - no gradient */}

                    {/* Header */}
                    <View style={styles.header}>
                        {currentStep === 'intro' ? (
                            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                                <Ionicons name="close" size={24} color="#1A1A1A" />
                            </TouchableOpacity>
                        ) : stepIndex > 0 && currentStep !== 'complete' ? (
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
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
                </>
            )}
        </View >
    );
};

const getStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#FAFAFA',
        },
        // Splash Screen Styles
        splashContainer: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#FAFAFA',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
        },
        splashLogoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        splashLetter: {
            fontSize: 52,
            fontWeight: '800',
            fontFamily: 'Novaklasse-Semibold',
            color: theme.colors.primary,
            letterSpacing: 2,
        },
        splashTagline: {
            fontSize: 16,
            fontWeight: '500',
            color: '#6B6B6B',
            marginTop: 8,
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
            backgroundColor: 'rgba(0,0,0,0.1)',
        },
        progressDotActive: {
            backgroundColor: theme.colors.primary,
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
            backgroundColor: theme.colors.primary,
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
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
            fontSize: 64,
            marginBottom: 20,
        },
        introTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: '#1A1A1A',
            textAlign: 'center',
            marginBottom: 12,
        },
        introSubtitle: {
            fontSize: 16,
            color: '#6B6B6B',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 40,
            paddingHorizontal: 20,
        },
        introFeatures: {
            gap: 16,
        },
        featureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
        },
        featureText: {
            fontSize: 15,
            color: '#1A1A1A',
            fontWeight: '500',
        },
        sectionTitle: {
            fontSize: 26,
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: 8,
            marginTop: 16,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: '#6B6B6B',
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
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: 'rgba(0,0,0,0.08)',
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
        },
        addPhotoText: {
            color: '#6B6B6B',
            fontSize: 12,
            marginTop: 4,
        },
        photoTip: {
            fontSize: 14,
            color: '#6B6B6B',
            textAlign: 'center',
            marginTop: 24,
            paddingHorizontal: 20,
        },
        optionGroup: {
            marginBottom: 32,
        },
        // Basics Step Card Styles
        basicsCard: {
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
        },
        basicsCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        basicsIconContainer: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${theme.colors.primary}15`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        basicsCardTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: '#1A1A1A',
            flex: 1,
        },
        optionalBadge: {
            fontSize: 11,
            fontWeight: '500',
            color: '#AAAAAA',
            backgroundColor: '#F5F5F5',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        // Modern Chips (for gender selection)
        modernChip: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: '#F5F5F5',
            marginRight: 10,
            marginBottom: 10,
        },
        modernChipSelected: {
            backgroundColor: theme.colors.primary,
        },
        modernChipText: {
            fontSize: 14,
            fontWeight: '500',
            color: '#1A1A1A',
        },
        modernChipTextSelected: {
            color: '#fff',
        },
        optionLabel: {
            fontSize: 15,
            fontWeight: '600',
            color: '#1A1A1A',
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
            backgroundColor: '#fff',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
        },
        optionChipSelected: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        optionEmoji: {
            fontSize: 18,
        },
        optionChipText: {
            fontSize: 14,
            color: '#1A1A1A',
            fontWeight: '500',
        },
        optionChipTextSelected: {
            color: '#fff',
        },
        genderChip: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
        },
        genderChipSelected: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        genderChipText: {
            fontSize: 14,
            color: '#1A1A1A',
            fontWeight: '500',
        },
        genderChipTextSelected: {
            color: '#fff',
        },
        // Lifestyle
        lifestyleChip: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
        },
        lifestyleChipSelected: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        lifestyleChipText: {
            fontSize: 13,
            color: '#1A1A1A',
            fontWeight: '500',
        },
        lifestyleChipTextSelected: {
            color: '#fff',
        },
        // Complete
        completeContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        completeEmoji: {
            fontSize: 64,
            marginBottom: 20,
        },
        completeTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: '#1A1A1A',
            textAlign: 'center',
            marginBottom: 12,
        },
        completeSubtitle: {
            fontSize: 16,
            color: '#6B6B6B',
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 20,
        },
        // Basics Step Styles
        inputContainer: {
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            paddingHorizontal: 16,
            paddingVertical: 4,
        },
        textInput: {
            fontSize: 18,
            color: '#1A1A1A',
            paddingVertical: 14,
            fontWeight: '500',
        },
        inputHint: {
            fontSize: 12,
            color: '#6B6B6B',
            marginTop: 8,
        },
        heightScroll: {
            marginHorizontal: -20,
            paddingHorizontal: 20,
        },
        heightChip: {
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            marginRight: 8,
        },
        heightChipSelected: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        heightChipText: {
            fontSize: 13,
            color: '#1A1A1A',
            fontWeight: '500',
        },
        heightChipTextSelected: {
            color: '#fff',
        },
        bioInputContainer: {
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        bioInput: {
            fontSize: 16,
            color: '#1A1A1A',
            minHeight: 100,
            textAlignVertical: 'top',
        },
        charCount: {
            fontSize: 12,
            color: '#6B6B6B',
            textAlign: 'right',
            marginTop: 8,
        },
        locationButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 16,
            gap: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
        },
        locationButtonText: {
            fontSize: 16,
            color: '#1A1A1A',
            fontWeight: '600',
        },
        locationHint: {
            fontSize: 12,
            color: '#6B6B6B',
            marginTop: 8,
            textAlign: 'center',
        },
    });
