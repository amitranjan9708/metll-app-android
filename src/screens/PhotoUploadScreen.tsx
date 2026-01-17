import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { VideoRecorder } from '../components/VideoRecorder';
import { authApi } from '../services/api';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width * 0.6; // Larger single photo size for profile

type ScreenStep = 'photos' | 'video';

interface PhotoSlot {
    localUri: string | null;      // Local file URI
    cloudinaryUrl: string | null; // Uploaded Cloudinary URL
    isUploading: boolean;
    uploadError: string | null;
}

export const PhotoUploadScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user, updateUser, logout } = useAuth();

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

    // Screen step: photos first, then video
    const [screenStep, setScreenStep] = useState<ScreenStep>('photos');

    // Single profile photo slot
    const [profilePhoto, setProfilePhoto] = useState<PhotoSlot>({
        localUri: null,
        cloudinaryUrl: null,
        isUploading: false,
        uploadError: null,
    });

    // Track if we've initiated auto-upload to prevent duplicate uploads
    const [autoUploadInitiated, setAutoUploadInitiated] = useState(false);

    // Pre-fill with existing user profile photo on mount
    useEffect(() => {
        if (user?.photo) {
            // Check if it's a Cloudinary URL (already uploaded) or local file URI
            const isCloudinaryUrl = user.photo.includes('cloudinary.com') || user.photo.includes('res.cloudinary');
            const isHttpUrl = user.photo.startsWith('http://') || user.photo.startsWith('https://');
            
            if (isCloudinaryUrl || isHttpUrl) {
                // Already uploaded to server
                setProfilePhoto({
                    localUri: user.photo,
                    cloudinaryUrl: user.photo,
                    isUploading: false,
                    uploadError: null,
                });
            } else if (!autoUploadInitiated) {
                // Local file URI from OnboardingScreen - needs upload
                console.log('📷 Found local photo from onboarding, will auto-upload...');
                setProfilePhoto({
                    localUri: user.photo,
                    cloudinaryUrl: null,
                    isUploading: false,
                    uploadError: null,
                });
                // Mark that we'll auto-upload
                setAutoUploadInitiated(true);
            }
        }
    }, [user?.photo, autoUploadInitiated]);

    // Video state
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    // Additional photos upload state
    const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
    const [additionalError, setAdditionalError] = useState<string | null>(null);

    // Check if profile photo is uploaded
    const profilePhotoUploaded = profilePhoto.cloudinaryUrl !== null;
    const canProceed = profilePhotoUploaded;

    const handlePickImage = async () => {
        // Show verification prompt for profile photo
        if (!profilePhoto.localUri) {
            Alert.alert(
                '📸 Profile Photo',
                'This photo will be used as your main profile picture and for identity verification. Please upload a clear, well-lit photo of your face.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Got it!', onPress: () => proceedWithImagePick() }
                ]
            );
            return;
        }

        await proceedWithImagePick();
    };

    const proceedWithImagePick = async () => {
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
                const imageUri = result.assets[0].uri;

                // Update with local URI
                setProfilePhoto({
                    localUri: imageUri,
                    cloudinaryUrl: null,
                    isUploading: false,
                    uploadError: null,
                });

                // Upload immediately
                uploadProfilePicture(imageUri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Upload profile picture immediately
    const uploadProfilePicture = async (imageUri: string) => {
        // Set uploading state
        setProfilePhoto(prev => ({ ...prev, isUploading: true, uploadError: null }));

        try {
            console.log('📤 Uploading profile picture...');
            const result = await authApi.uploadProfilePicture(imageUri);

            if (!result.success || !result.data?.photo) {
                throw new Error(result.message || 'Failed to upload profile picture');
            }

            console.log('✅ Profile picture uploaded:', result.data.photo);

            // Update with Cloudinary URL
            setProfilePhoto(prev => ({
                ...prev,
                cloudinaryUrl: result.data!.photo,
                isUploading: false,
                uploadError: null,
            }));

            // Update local user state
            await updateUser({ photo: result.data.photo }, true);

        } catch (error: any) {
            console.error('❌ Profile picture upload failed:', error);
            setProfilePhoto(prev => ({
                ...prev,
                isUploading: false,
                uploadError: error.message || 'Upload failed',
            }));
        }
    };

    // Auto-upload photo from onboarding when component mounts with local URI
    useEffect(() => {
        if (autoUploadInitiated && profilePhoto.localUri && !profilePhoto.cloudinaryUrl && !profilePhoto.isUploading) {
            console.log('📷 Auto-uploading photo from onboarding...');
            uploadProfilePicture(profilePhoto.localUri);
        }
    }, [autoUploadInitiated, profilePhoto.localUri, profilePhoto.cloudinaryUrl, profilePhoto.isUploading]);

    // Retry profile picture upload
    const retryProfilePicture = () => {
        if (profilePhoto.localUri) {
            uploadProfilePicture(profilePhoto.localUri);
        }
    };

    const handleRemoveImage = async () => {
        // If the photo was uploaded to Cloudinary, delete from backend too
        if (profilePhoto.cloudinaryUrl) {
            try {
                console.log('🗑️ Deleting profile photo from backend...');
                const result = await authApi.deletePhoto(0);

                if (result.success) {
                    console.log('✅ Photo deleted from backend');
                } else {
                    console.warn('⚠️ Failed to delete from backend:', result.message);
                }
            } catch (error) {
                console.error('❌ Error deleting photo from backend:', error);
            }
        }

        // Delete local file from device cache
        if (profilePhoto.localUri) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(profilePhoto.localUri);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(profilePhoto.localUri, { idempotent: true });
                }
            } catch (error) {
                console.warn('⚠️ Could not delete local file:', error);
            }
        }

        // Reset local state
        setProfilePhoto({
            localUri: null,
            cloudinaryUrl: null,
            isUploading: false,
            uploadError: null,
        });

        // Update local user state
        await updateUser({ photo: undefined }, true);
    };

    // Proceed to video step (no additional photos to upload)
    const handlePhotosComplete = async () => {
        if (!canProceed) {
            Alert.alert('Profile Photo Required', 'Please upload your profile photo to continue.');
            return;
        }

        // Check if profile picture is uploaded
        if (!profilePhotoUploaded) {
            Alert.alert('Please Wait', 'Profile picture is still uploading. Please wait or retry if it failed.');
            return;
        }

        // Proceed directly to video step
        setScreenStep('video');
    };

    const handleVideoRecorded = async (uri: string) => {
        setVideoUri(uri);
        setIsUploadingVideo(true);
        setVideoError(null);

        try {
            console.log('📤 Uploading verification video...');
            const result = await authApi.uploadVerificationVideo(uri);

            if (!result.success) {
                throw new Error(result.message || 'Failed to upload video');
            }

            console.log('✅ Video uploaded:', result.data?.video);
            setVideoUrl(result.data?.video || null);

            // Backend already saved the video, just proceed to next step

            // Success! Navigate to next step
            Alert.alert(
                'Success! 🎉',
                'Your profile photo and video have been uploaded successfully.',
                [{ text: 'Continue', onPress: () => navigation.navigate('SituationIntro') }]
            );

        } catch (error: any) {
            console.error('❌ Video upload failed:', error);
            setVideoError(error.message || 'Failed to upload video');
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const handleVideoCancel = () => {
        setScreenStep('photos');
    };

    const retryVideoUpload = () => {
        if (videoUri) {
            handleVideoRecorded(videoUri);
        }
    };

    const styles = getStyles(theme);

    // Video Recording Step
    if (screenStep === 'video') {
        return (
            <LinearGradient
                colors={[theme.colors.background, theme.colors.backgroundLight]}
                style={styles.container}
            >
                <View style={[styles.videoHeader, { paddingTop: insets.top + theme.spacing.md }]}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={handleVideoCancel}
                        disabled={isUploadingVideo}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.videoTitle}>Verification Video</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.videoInstructions}>
                    <View style={styles.instructionItem}>
                        <Ionicons name="videocam" size={24} color={theme.colors.primary} />
                        <Text style={styles.instructionText}>
                            Record a short video (3-10 seconds) to verify you're a real person.
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Ionicons name="happy" size={24} color={theme.colors.accent} />
                        <Text style={styles.instructionText}>
                            Smile and say "Hi, I'm [your name]!" or just wave at the camera.
                        </Text>
                    </View>
                </View>

                <View style={styles.videoRecorderContainer}>
                    <VideoRecorder
                        onVideoRecorded={handleVideoRecorded}
                        onCancel={handleVideoCancel}
                        minDuration={3}
                        maxDuration={10}
                    />
                </View>

                {/* Video Upload Overlay */}
                {isUploadingVideo && (
                    <View style={styles.uploadOverlay}>
                        <View style={styles.uploadModal}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.uploadText}>Uploading video...</Text>
                            <Text style={styles.uploadSubtext}>Please don't close the app</Text>
                        </View>
                    </View>
                )}

                {/* Video Error Overlay */}
                {videoError && (
                    <View style={styles.uploadOverlay}>
                        <View style={styles.uploadModal}>
                            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                            <Text style={styles.errorTitle}>Upload Failed</Text>
                            <Text style={styles.errorMessage}>{videoError}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={retryVideoUpload}>
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setVideoError(null)}>
                                <Text style={styles.cancelButtonText}>Record Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </LinearGradient>
        );
    }

    // Photos Step - Single Profile Photo
    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.backgroundLight]}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + theme.spacing.lg }]}>
                {/* Header with logout option */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={18} color={theme.colors.textSecondary} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>Add Your Profile Photo</Text>
                    <Text style={styles.subtitle}>
                        This photo will be used as your main profile picture and for identity verification.
                    </Text>
                </View>

                {/* Single Profile Photo */}
                <View style={styles.singlePhotoContainer}>
                    <TouchableOpacity
                        style={[
                            styles.singlePhotoSlot,
                            !profilePhoto.localUri && styles.photoSlotEmpty,
                            { borderColor: theme.colors.primary },
                            profilePhoto.uploadError && { borderColor: theme.colors.error },
                        ]}
                        onPress={handlePickImage}
                        activeOpacity={0.8}
                        disabled={profilePhoto.isUploading}
                    >
                        {profilePhoto.localUri ? (
                            <>
                                <Image source={{ uri: profilePhoto.localUri }} style={styles.singlePhoto} />

                                {/* Upload status overlay */}
                                {profilePhoto.isUploading && (
                                    <View style={styles.photoOverlay}>
                                        <ActivityIndicator size="large" color="#fff" />
                                        <Text style={{ color: '#fff', marginTop: 8 }}>Uploading...</Text>
                                    </View>
                                )}

                                {/* Uploaded checkmark */}
                                {profilePhoto.cloudinaryUrl && !profilePhoto.isUploading && (
                                    <View style={[styles.uploadedBadge, { width: 32, height: 32, borderRadius: 16 }]}>
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                    </View>
                                )}

                                {/* Remove button */}
                                {!profilePhoto.isUploading && (
                                    <TouchableOpacity
                                        style={[styles.removeBtn, { width: 32, height: 32, borderRadius: 16 }]}
                                        onPress={handleRemoveImage}
                                    >
                                        <Ionicons name="close" size={18} color="#fff" />
                                    </TouchableOpacity>
                                )}

                                {/* Verification badge */}
                                {profilePhoto.cloudinaryUrl && (
                                    <View style={[styles.verificationBadge, { width: 32, height: 32, borderRadius: 16 }]}>
                                        <Ionicons name="shield-checkmark" size={18} color="#fff" />
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.addPhotoContent}>
                                <Ionicons name="person-add" size={48} color={theme.colors.primary} />
                                <Text style={styles.addPhotoText}>Tap to add photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Profile picture error message */}
                {profilePhoto.uploadError && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning" size={20} color={theme.colors.error} />
                        <Text style={styles.errorBannerText}>
                            Upload failed: {profilePhoto.uploadError}
                        </Text>
                        <TouchableOpacity onPress={retryProfilePicture}>
                            <Text style={styles.retryLink}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Photo Tips 📸</Text>
                    <View style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Clear face, no sunglasses or filters</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Good lighting and recent photo</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Just you in the photo, no group pics</Text>
                    </View>
                </View>

                {/* Status indicator */}
                <View style={styles.statusContainer}>
                    <View style={styles.statusItem}>
                        <Ionicons
                            name={profilePhotoUploaded ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={profilePhotoUploaded ? theme.colors.success : theme.colors.textMuted}
                        />
                        <Text style={[styles.statusText, profilePhotoUploaded && styles.statusTextDone]}>
                            Profile photo {profilePhotoUploaded ? 'uploaded' : 'pending'}
                        </Text>
                    </View>
                </View>

                {/* Next Step Preview */}
                {profilePhotoUploaded && (
                    <View style={styles.nextStepPreview}>
                        <Ionicons name="videocam" size={20} color={theme.colors.accent} />
                        <Text style={styles.nextStepText}>
                            Next: Record a quick verification video
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                <Button
                    title="Continue to Video"
                    onPress={handlePhotosComplete}
                    disabled={!profilePhotoUploaded || profilePhoto.isUploading}
                    variant={profilePhotoUploaded ? 'primary' : 'outline'}
                />
            </View>
        </LinearGradient>
    );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
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
    header: {
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
    },
    title: {
        ...theme.typography.heading,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    singlePhotoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    singlePhotoSlot: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE * 1.33,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.backgroundCard,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'solid',
    },
    singlePhoto: {
        width: '100%',
        height: '100%',
    },
    addPhotoContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPhotoText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: theme.spacing.lg,
        justifyContent: 'center',
    },
    photoContainer: {
        position: 'relative',
    },
    photoSlot: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE * 1.3,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.backgroundCard,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    photoSlotEmpty: {
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    photoSlotPrimary: {
        borderWidth: 2,
        borderStyle: 'solid',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadedBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verificationBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requiredBadge: {
        position: 'absolute',
        bottom: -10,
        left: '50%',
        marginLeft: -30,
        width: 60,
        backgroundColor: theme.colors.background,
        paddingVertical: 2,
        alignItems: 'center',
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    requiredText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error + '15',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        gap: 8,
    },
    errorBannerText: {
        flex: 1,
        color: theme.colors.error,
        fontSize: 13,
    },
    retryLink: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    tipsContainer: {
        backgroundColor: theme.colors.backgroundCard,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.md,
    },
    tipsTitle: {
        ...theme.typography.bodyBold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    tipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    tipText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    statusContainer: {
        marginBottom: theme.spacing.md,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    statusTextDone: {
        color: theme.colors.success,
    },
    nextStepPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: 8,
    },
    nextStepText: {
        ...theme.typography.caption,
        color: theme.colors.accent,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        paddingBottom: 34,
        borderTopWidth: 1,
        backgroundColor: theme.colors.background,
    },
    // Video step styles
    videoHeader: {
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
    videoTitle: {
        ...theme.typography.subheading,
        color: theme.colors.textPrimary,
    },
    videoInstructions: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
        backgroundColor: theme.colors.backgroundCard,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    instructionText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        flex: 1,
    },
    videoRecorderContainer: {
        flex: 1,
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
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        alignItems: 'center',
        width: '85%',
        maxWidth: 320,
        ...theme.shadows.lg,
    },
    uploadText: {
        ...theme.typography.bodyBold,
        color: theme.colors.textPrimary,
        marginTop: theme.spacing.lg,
        textAlign: 'center',
    },
    uploadSubtext: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    errorTitle: {
        ...theme.typography.subheading,
        color: theme.colors.error,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    errorMessage: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
        gap: 8,
        width: '100%',
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    cancelButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
});
