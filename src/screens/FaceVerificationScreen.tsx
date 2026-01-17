import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { VideoRecorder } from '../components/VideoRecorder';
import { VerificationBadge } from '../components/VerificationBadge';
import { useTheme } from '../theme/useTheme';
import { useAuth } from '../context/AuthContext';
import { verificationApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type VerificationStep = 'photo' | 'video' | 'success';

const STEPS: VerificationStep[] = ['photo', 'video', 'success'];

const STEP_CONFIG = {
  photo: { icon: 'camera-outline', title: 'Photo' },
  video: { icon: 'videocam-outline', title: 'Video' },
  success: { icon: 'checkmark-circle-outline', title: 'Complete' },
};

export const FaceVerificationScreen: React.FC = () => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<VerificationStep>('photo');
  const [photo, setPhoto] = useState<string>('');
  const [videoUri, setVideoUri] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await verificationApi.getStatus();
      setVerificationStatus(status.verificationStatus);

      if (status.isVerified) {
        setStep('success');
      } else if (status.verificationStatus === 'photo_uploaded' || status.verificationStatus === 'liveness_pending') {
        if (status.profilePhoto) setPhoto(status.profilePhoto);
        setStep('video');
      } else {
        setStep('photo');
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const animateTransition = (direction: 'forward' | 'back') => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, {
          toValue: direction === 'forward' ? -30 : 30,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleImageSelected = (uri: string) => {
    if (!uri) {
      Alert.alert('Error', 'Invalid image. Please try again.');
      return;
    }
    setPhoto(uri);
    setErrorMessage(null);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Photo',
      'Upload a clear photo of your face (no sunglasses, no filters)',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePhotoNext = async () => {
    if (!photo) {
      Alert.alert('Required', 'Please upload your profile photo first.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await verificationApi.uploadPhoto(photo);
      // Photo uploaded successfully, move to video step
      animateTransition('forward');
      setTimeout(() => setStep('video'), 150);
    } catch (error: any) {
      console.error('Photo upload failed:', error);
      Alert.alert('Verification Failed', error.message || 'Failed to detect a face. Please try a different photo.');
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoRecorded = async (uri: string) => {
    setVideoUri(uri);
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await verificationApi.verifyLiveness(uri);

      // Verification successful
      animateTransition('forward');
      setTimeout(() => {
        setStep('success');
        handleComplete(result);
      }, 150);
    } catch (error: any) {
      console.error('Liveness verification failed:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Liveness check failed. Please ensure your face is clearly visible and try again.',
        [
          {
            text: 'Try Again', onPress: () => {
              // Reset video step
              setVideoUri('');
            }
          }
        ]
      );
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (result?: any) => {
    try {
      // Update local user context with new verification status
      if (user) {
        await updateUser({
          ...user,
          isFaceVerified: true,
          photo: photo || user.photo,
        });
      }
    } catch (error) {
      console.error('Error updating user context:', error);
    }
  };

  const handleContinue = () => {
    // Navigation will be handled by AppNavigator based on user state
    // The screen will automatically navigate when user.isFaceVerified becomes true
  };

  const renderPhotoStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={theme.gradients.primary.colors as [string, string]}
          style={styles.iconGradient}
        >
          <Ionicons name="camera" size={40} color={theme.colors.white} />
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Upload Your Photo</Text>
      <Text style={styles.stepSubtitle}>
        Upload a clear photo of your face{'\n'}
        (no sunglasses, no filters)
      </Text>

      <View style={styles.photoContainer}>
        {photo ? (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={showImageOptions}
            >
              <LinearGradient
                colors={theme.gradients.primary.colors as [string, string]}
                style={styles.editButtonGradient}
              >
                <Ionicons name="camera" size={20} color={theme.colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.photoPlaceholder}
            onPress={showImageOptions}
            disabled={false}
          >
            <LinearGradient
              colors={[theme.colors.primaryLight + '30', theme.colors.accentLight + '30']}
              style={styles.photoPlaceholderGradient}
            >
              <Ionicons name="camera" size={48} color={theme.colors.primary} />
              <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Button
        title="Continue"
        onPress={handlePhotoNext}
        disabled={!photo}
        style={styles.button}
      />
    </View>
  );

  const renderVideoStep = () => (
    <View style={styles.stepContent}>
      <VideoRecorder
        onVideoRecorded={handleVideoRecorded}
        onCancel={() => {
          animateTransition('back');
          setTimeout(() => setStep('photo'), 150);
        }}
        minDuration={3}
        maxDuration={5}
      />
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.successIconGradient}
          >
            <VerificationBadge size={80} />
          </LinearGradient>
        </View>

        <Text style={styles.successTitle}>Verification Complete!</Text>
        <Text style={styles.successSubtitle}>
          Your profile has been verified.{'\n'}
          You can now continue setting up your profile.
        </Text>

        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.button}
        />
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'photo':
        return renderPhotoStep();
      case 'video':
        return renderVideoStep();
      case 'success':
        return renderSuccessStep();
      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    const currentStepIndex = STEPS.indexOf(step);

    return (
      <View style={styles.stepIndicator}>
        {STEPS.map((s, index) => {
          const isActive = currentStepIndex >= index;
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
  };

  const getProgress = () => {
    return ((STEPS.indexOf(step) + 1) / STEPS.length) * 100;
  };

  return (
    <LinearGradient
      colors={theme.gradients.background.colors as [string, string, string]}
      style={styles.container}
    >
      <View style={[styles.progressBarContainer, { paddingTop: insets.top + theme.spacing.md }]}>
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

      {step === 'video' ? (
        renderVideoStep()
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.animatedContainer,
              { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
          >
            <Card style={styles.card}>{renderStep()}</Card>
          </Animated.View>
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: theme.colors.glass,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  stepDotActive: {
    borderColor: theme.colors.primary,
  },
  stepDotCurrent: {
    ...theme.shadows.glow,
  },
  stepDotGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: theme.colors.glass,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  animatedContainer: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  stepTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  photoContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  photoWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'relative',
    ...theme.shadows.lg,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.glow,
  },
  editButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  photoPlaceholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  successIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  successIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  successTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  successSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
});

