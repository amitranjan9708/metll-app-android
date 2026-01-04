import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ImagePickerComponent } from '../components/ImagePicker';
import { VideoRecorder } from '../components/VideoRecorder';
import { useTheme } from '../theme/useTheme';
import { useAuth } from '../context/AuthContext';
import {
  SchoolDetails,
  CollegeDetails,
  OfficeDetails,
  LocationDetails,
} from '../types';
import { Ionicons } from '@expo/vector-icons';

type OnboardingStep = 'photo' | 'video' | 'school' | 'college' | 'office' | 'home' | 'complete';

const STEPS: OnboardingStep[] = ['photo', 'video', 'school', 'college', 'office', 'home'];

const STEP_CONFIG = {
  photo: { icon: 'camera-outline', title: 'Profile Photo' },
  video: { icon: 'videocam-outline', title: 'Video Verification' },
  school: { icon: 'school-outline', title: 'School' },
  college: { icon: 'library-outline', title: 'College' },
  office: { icon: 'business-outline', title: 'Office' },
  home: { icon: 'home-outline', title: 'Location' },
};

export const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('photo');
  const [photo, setPhoto] = useState('');
  const [videoUri, setVideoUri] = useState('');

  const [hasSchool, setHasSchool] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolState, setSchoolState] = useState('');
  const [schoolClass, setSchoolClass] = useState('');
  const [schoolSection, setSchoolSection] = useState('');

  const [hasCollege, setHasCollege] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [collegeDepartment, setCollegeDepartment] = useState('');
  const [collegeLocation, setCollegeLocation] = useState('');

  const [hasOffice, setHasOffice] = useState(false);
  const [officeName, setOfficeName] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [officeDepartment, setOfficeDepartment] = useState('');
  const [officeDesignation, setOfficeDesignation] = useState('');

  const [currentAddress, setCurrentAddress] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [pastAddress, setPastAddress] = useState('');
  const [pastCity, setPastCity] = useState('');
  const [pastState, setPastState] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (direction: 'forward' | 'back') => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, {
          toValue: direction === 'forward' ? -30 : 30,
          duration: 150,
          useNativeDriver: true
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const validateStep = (currentStep: OnboardingStep): boolean => {
    switch (currentStep) {
      case 'photo':
        if (!photo) {
          Alert.alert('Required', 'Please upload your profile photo');
          return false;
        }
        return true;
      case 'video':
        if (!videoUri) {
          Alert.alert('Required', 'Please record a verification video');
          return false;
        }
        return true;
      case 'school':
        if (hasSchool) {
          if (!schoolName || !schoolLocation || !schoolCity || !schoolState) {
            Alert.alert('Required', 'Please fill all required school fields');
            return false;
          }
        }
        return true;
      case 'college':
        if (hasCollege) {
          if (!collegeName || !collegeDepartment || !collegeLocation) {
            Alert.alert('Required', 'Please fill all required college fields');
            return false;
          }
        }
        return true;
      case 'office':
        if (hasOffice) {
          if (!officeName || !officeLocation || !officeDepartment || !officeDesignation) {
            Alert.alert('Required', 'Please fill all required office fields');
            return false;
          }
        }
        return true;
      case 'home':
        return true;
      default:
        return true;
    }
  };

  const checkAtLeastOne = (): boolean => {
    if (!hasSchool && !hasCollege && !hasOffice) {
      Alert.alert('Required', 'Please provide at least one: School, College, or Office details');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    const currentIndex = STEPS.indexOf(step);

    if (currentIndex < STEPS.length - 1) {
      animateTransition('forward');
      setTimeout(() => setStep(STEPS[currentIndex + 1]), 150);
    } else if (step === 'home') {
      handleComplete();
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      animateTransition('back');
      setTimeout(() => setStep(STEPS[currentIndex - 1]), 150);
    }
  };

  const handleVideoRecorded = (uri: string) => {
    setVideoUri(uri);
    // Automatically move to next step after video is recorded
    animateTransition('forward');
    setTimeout(() => {
      const currentIndex = STEPS.indexOf(step);
      if (currentIndex < STEPS.length - 1) {
        setStep(STEPS[currentIndex + 1]);
      }
    }, 150);
  };

  const handleVideoCancel = () => {
    // Go back to photo step if user cancels video recording
    animateTransition('back');
    setTimeout(() => setStep('photo'), 150);
  };

  const handleComplete = async () => {
    if (!checkAtLeastOne()) return;

    try {
      const school: SchoolDetails | undefined = hasSchool ? {
        name: schoolName,
        location: schoolLocation,
        city: schoolCity,
        state: schoolState,
        class: schoolClass || undefined,
        section: schoolSection || undefined,
      } : undefined;

      const college: CollegeDetails | undefined = hasCollege ? {
        name: collegeName,
        department: collegeDepartment,
        location: collegeLocation,
      } : undefined;

      const office: OfficeDetails | undefined = hasOffice ? {
        name: officeName,
        location: officeLocation,
        department: officeDepartment,
        designation: officeDesignation,
      } : undefined;

      const homeLocation: LocationDetails | undefined =
        currentAddress || pastAddress ? {
          current: currentAddress ? {
            address: currentAddress,
            city: currentCity,
            state: currentState,
          } : undefined,
          past: pastAddress ? {
            address: pastAddress,
            city: pastCity,
            state: pastState,
          } : undefined,
        } : undefined;

      await updateUser({
        photo,
        school,
        college,
        office,
        homeLocation,
      });
      // Navigation will automatically happen via AppNavigator based on auth state
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, index) => {
        const isActive = STEPS.indexOf(step) >= index;
        const isCurrent = step === s;
        const config = STEP_CONFIG[s];

        return (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, isActive && styles.stepDotActive, isCurrent && styles.stepDotCurrent]}>
              {isActive ? (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
                  style={styles.stepDotGradient}
                >
                  <Ionicons name={config.icon as any} size={16} color={theme.colors.white} />
                </LinearGradient>
              ) : (
                <Ionicons name={config.icon as any} size={16} color={theme.colors.textMuted} />
              )}
            </View>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );

  const renderToggle = (value: boolean, onChange: (v: boolean) => void, label: string) => (
    <TouchableOpacity style={styles.toggle} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={[styles.toggleBox, value && styles.toggleBoxActive]}>
        {value && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
      </View>
      <Text style={styles.toggleText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (step) {
      case 'photo':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Your Photo</Text>
            <Text style={styles.stepSubtitle}>Let others see the real you</Text>
            <View style={styles.photoContainer}>
              <ImagePickerComponent onImageSelected={setPhoto} currentImage={photo} label="" />
            </View>
          </View>
        );

      case 'school':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>School Details</Text>
            <Text style={styles.stepSubtitle}>Add your school information</Text>
            {renderToggle(hasSchool, setHasSchool, 'I want to add school details')}
            {hasSchool && (
              <View style={styles.formFields}>
                <Input label="School Name *" placeholder="Enter school name" value={schoolName} onChangeText={setSchoolName} />
                <Input label="Location *" placeholder="School location/address" value={schoolLocation} onChangeText={setSchoolLocation} />
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input label="City *" placeholder="City" value={schoolCity} onChangeText={setSchoolCity} />
                  </View>
                  <View style={styles.halfInput}>
                    <Input label="State *" placeholder="State" value={schoolState} onChangeText={setSchoolState} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input label="Class" placeholder="e.g., 12th" value={schoolClass} onChangeText={setSchoolClass} />
                  </View>
                  <View style={styles.halfInput}>
                    <Input label="Section" placeholder="e.g., A" value={schoolSection} onChangeText={setSchoolSection} />
                  </View>
                </View>
              </View>
            )}
          </View>
        );

      case 'college':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>College Details</Text>
            <Text style={styles.stepSubtitle}>Add your college information</Text>
            {renderToggle(hasCollege, setHasCollege, 'I want to add college details')}
            {hasCollege && (
              <View style={styles.formFields}>
                <Input label="College Name *" placeholder="Enter college name" value={collegeName} onChangeText={setCollegeName} />
                <Input label="Department *" placeholder="Your department" value={collegeDepartment} onChangeText={setCollegeDepartment} />
                <Input label="Location *" placeholder="College location" value={collegeLocation} onChangeText={setCollegeLocation} />
              </View>
            )}
          </View>
        );

      case 'office':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Office Details</Text>
            <Text style={styles.stepSubtitle}>Add your workplace information</Text>
            {renderToggle(hasOffice, setHasOffice, 'I want to add office details')}
            {hasOffice && (
              <View style={styles.formFields}>
                <Input label="Company Name *" placeholder="Enter company name" value={officeName} onChangeText={setOfficeName} />
                <Input label="Location *" placeholder="Office location" value={officeLocation} onChangeText={setOfficeLocation} />
                <Input label="Department *" placeholder="Your department" value={officeDepartment} onChangeText={setOfficeDepartment} />
                <Input label="Designation *" placeholder="Your job title" value={officeDesignation} onChangeText={setOfficeDesignation} />
              </View>
            )}
          </View>
        );

      case 'home':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Home Location</Text>
            <Text style={styles.stepSubtitle}>Help others find you based on location (optional)</Text>
            <View style={styles.formFields}>
              <Text style={styles.sectionLabel}>Current Location</Text>
              <Input label="Address" placeholder="Current address" value={currentAddress} onChangeText={setCurrentAddress} />
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input label="City" placeholder="City" value={currentCity} onChangeText={setCurrentCity} />
                </View>
                <View style={styles.halfInput}>
                  <Input label="State" placeholder="State" value={currentState} onChangeText={setCurrentState} />
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getProgress = () => ((STEPS.indexOf(step) + 1) / STEPS.length) * 100;

  return (
    <LinearGradient colors={theme.gradients.background.colors as [string, string, string]} style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${getProgress()}%` }]}
          />
        </View>
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {step === 'video' ? (
          <VideoRecorder
            onVideoRecorded={handleVideoRecorded}
            onCancel={handleVideoCancel}
            minDuration={3}
            maxDuration={5}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <Card style={styles.card}>
                {renderStep()}
                <View style={styles.buttonContainer}>
                  {step !== 'photo' && (
                    <Button title="Back" onPress={handleBack} variant="outline" style={styles.backButton} />
                  )}
                  <Button title={step === 'home' ? 'Complete' : 'Next'} onPress={handleNext} style={styles.nextButton} />
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  progressBarContainer: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  progressBarBg: { height: 4, backgroundColor: theme.colors.glass, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: theme.spacing.lg },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glassBorder },
  stepDotActive: { borderColor: theme.colors.primary },
  stepDotCurrent: { ...theme.shadows.glow },
  stepDotGradient: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  stepLine: { width: 24, height: 2, backgroundColor: theme.colors.glass, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: theme.colors.primary },
  scrollContent: { flexGrow: 1, padding: theme.spacing.lg },
  animatedContainer: { flex: 1 },
  card: { flex: 1 },
  stepContent: { flex: 1 },
  stepTitle: { ...theme.typography.heading, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  stepSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  photoContainer: { alignItems: 'center', marginTop: theme.spacing.xl },
  toggle: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg },
  toggleBox: { width: 24, height: 24, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.glass, borderWidth: 1.5, borderColor: theme.colors.glassBorder, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.sm },
  toggleBoxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  toggleText: { ...theme.typography.body, color: theme.colors.textPrimary },
  formFields: { marginTop: theme.spacing.sm },
  sectionLabel: { ...theme.typography.bodyBold, color: theme.colors.accent, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  halfInput: { flex: 1 },
  buttonContainer: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xl },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});
