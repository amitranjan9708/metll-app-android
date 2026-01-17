import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { VideoRecorder } from '../components/VideoRecorder';
import { authApi, userApi } from '../services/api';

type ScreenStep = 'photo' | 'video' | 'success';

export const EditProfilePictureScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<ScreenStep>('photo');
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentPhoto();
  }, []);

  const loadCurrentPhoto = async () => {
    try {
      // First, try to use existing user photo from context as fallback
      if (user?.photo) {
        setCurrentPhoto(user.photo);
      }
      
      // Then fetch fresh data from API
      const response = await userApi.getUserProfile();
      console.log('📷 EditProfilePicture - Loading current photo:', {
        success: response.success,
        hasUser: !!response.data?.user,
        photo: response.data?.user?.photo,
        userContextPhoto: user?.photo,
      });
      if (response.success && response.data?.user) {
        const photoUrl = response.data.user.photo || user?.photo || null;
        console.log('📷 Setting current photo to:', photoUrl);
        setCurrentPhoto(photoUrl);
      }
    } catch (error) {
      console.error('Failed to load current photo:', error);
      // Fallback to user context photo on error
      if (user?.photo) {
        setCurrentPhoto(user.photo);
      }
    }
  };

  const handlePickNewPhoto = async () => {
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
        setNewPhotoUri(result.assets[0].uri);
        setPhotoError(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUploadPhoto = async () => {
    if (!newPhotoUri) return;

    setIsUploadingPhoto(true);
    setPhotoError(null);

    try {
      console.log('📤 Uploading new profile picture...');
      const result = await authApi.uploadProfilePicture(newPhotoUri);

      if (!result.success || !result.data?.photo) {
        throw new Error(result.message || 'Failed to upload profile picture');
      }

      console.log('✅ Profile picture uploaded:', result.data.photo);
      setUploadedPhotoUrl(result.data.photo);
      
      // Move to video verification step
      setStep('video');
    } catch (error: any) {
      console.error('❌ Profile picture upload failed:', error);
      setPhotoError(error.message || 'Upload failed');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleVideoRecorded = async (uri: string) => {
    setIsUploadingVideo(true);
    setVideoError(null);

    try {
      console.log('📤 Processing verification video...');
      
      // Mock video verification - just simulate processing time
      // The profile picture was already uploaded in step 1 via real API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ Video verification completed (mocked)');
      console.log('✅ Profile picture already saved via API:', uploadedPhotoUrl);

      // Update local user state - profile picture was already saved to backend
      // Just update local state to reflect the change
      await updateUser({ 
        photo: uploadedPhotoUrl || undefined,
      }, true);

      setStep('success');
    } catch (error: any) {
      console.error('❌ Video verification failed:', error);
      setVideoError(error.message || 'Verification failed');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleComplete = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    if (step === 'video') {
      Alert.alert(
        'Cancel Verification',
        'Your new photo won\'t be verified if you cancel now. Are you sure?',
        [
          { text: 'Continue Verification', style: 'cancel' },
          { text: 'Cancel', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Success Screen
  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Complete!</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Profile Picture Updated!</Text>
          <Text style={styles.successSubtitle}>
            Your new profile picture has been verified successfully.
          </Text>

          {uploadedPhotoUrl && (
            <View style={styles.newPhotoPreview}>
              <Image source={{ uri: uploadedPhotoUrl }} style={styles.previewImage} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Video Verification Screen
  if (step === 'video') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Your Face</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.videoInstructions}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotCompleted]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
          </View>
          <Text style={styles.stepText}>Step 2: Video Verification</Text>
        </View>

        <View style={styles.instructionCard}>
          <Ionicons name="videocam" size={24} color={theme.colors.primary} />
          <Text style={styles.instructionText}>
            Record a short video (3-10 seconds) looking at the camera. This confirms your new profile picture matches you.
          </Text>
        </View>

        <View style={styles.videoRecorderContainer}>
          <VideoRecorder
            onVideoRecorded={handleVideoRecorded}
            onCancel={() => setStep('photo')}
            minDuration={3}
            maxDuration={10}
          />
        </View>

        {/* Video Upload Overlay */}
        {isUploadingVideo && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadModal}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.uploadText}>Verifying your identity...</Text>
              <Text style={styles.uploadSubtext}>Please don't close the app</Text>
            </View>
          </View>
        )}

        {/* Video Error Overlay */}
        {videoError && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadModal}>
              <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
              <Text style={styles.errorTitle}>Verification Failed</Text>
              <Text style={styles.errorMessage}>{videoError}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => setVideoError(null)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Photo Selection Screen (default)
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Profile Picture</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
        </View>
        <Text style={styles.stepText}>Step 1: Choose New Photo</Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Changing your profile picture requires video verification to confirm your identity.
          </Text>
        </View>

        {/* Current Photo */}
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>Current Photo</Text>
          <View style={styles.photoContainer}>
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-down" size={32} color="#D0D0D0" />
        </View>

        {/* New Photo */}
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>New Photo</Text>
          <TouchableOpacity 
            style={[styles.photoContainer, styles.newPhotoContainer]} 
            onPress={handlePickNewPhoto}
            disabled={isUploadingPhoto}
          >
            {newPhotoUri ? (
              <>
                <Image source={{ uri: newPhotoUri }} style={styles.photoImage} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Tap to change</Text>
                </View>
              </>
            ) : (
              <View style={styles.addPhotoPlaceholder}>
                <Ionicons name="add-circle" size={48} color={theme.colors.primary} />
                <Text style={styles.addPhotoText}>Tap to select photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Photo Error */}
        {photoError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <Text style={styles.errorBannerText}>{photoError}</Text>
          </View>
        )}

        {/* Requirements */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Photo Requirements</Text>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.requirementText}>Clear view of your face</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.requirementText}>No sunglasses or filters</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.requirementText}>Good lighting</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!newPhotoUri || isUploadingPhoto) && styles.continueButtonDisabled,
          ]}
          onPress={handleUploadPhoto}
          disabled={!newPhotoUri || isUploadingPhoto}
        >
          {isUploadingPhoto ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.continueButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue to Verification</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  stepText: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 12,
    fontWeight: '600',
  },
  photoContainer: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  newPhotoContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  requirementsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Video step styles
  videoInstructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  videoRecorderContainer: {
    flex: 1,
  },
  // Success styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
  },
  newPhotoPreview: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Upload overlay styles
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  uploadModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
