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
const PHOTO_GAP = 12;
const PHOTO_SIZE = (width - (24 * 2) - (PHOTO_GAP * 2)) / 3;

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

    // 6 photo slots with upload status
    const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
        Array(6).fill(null).map(() => ({
            localUri: null,
            cloudinaryUrl: null,
            isUploading: false,
            uploadError: null,
        }))
    );

    // Pre-fill with existing user photos on mount
    useEffect(() => {
        if (user) {
            setPhotoSlots(prev => {
                const newSlots = [...prev];
                
                // Pre-fill profile picture (slot 0) if user already has one
                if (user.photo) {
                    newSlots[0] = {
                        localUri: user.photo, // Use Cloudinary URL as display
                        cloudinaryUrl: user.photo,
                        isUploading: false,
                        uploadError: null,
                    };
                }
                
                // Pre-fill additional photos (slots 1-5) if user has them
                if (user.additionalPhotos && user.additionalPhotos.length > 0) {
                    user.additionalPhotos.forEach((photoUrl, index) => {
                        if (index < 5) { // Max 5 additional photos (slots 1-5)
                            newSlots[index + 1] = {
                                localUri: photoUrl,
                                cloudinaryUrl: photoUrl,
                                isUploading: false,
                                uploadError: null,
                            };
                        }
                    });
                }
                
                return newSlots;
            });
        }
    }, [user?.photo, user?.additionalPhotos]);

    // Video state
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    // Additional photos upload state
    const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
    const [additionalError, setAdditionalError] = useState<string | null>(null);

    // Count photos
    const uploadedCount = photoSlots.filter(p => p.localUri !== null).length;
    const profilePhotoUploaded = photoSlots[0].cloudinaryUrl !== null;
    const isEnough = uploadedCount >= 3;

    // Check if all selected photos are uploaded
    const allPhotosUploaded = photoSlots.every(slot => 
        slot.localUri === null || slot.cloudinaryUrl !== null
    );

    const handlePickImage = async (index: number) => {
        // If this is the first photo slot (index 0) and it's empty, show verification prompt
        if (index === 0 && photoSlots[0].localUri === null) {
            Alert.alert(
                '📸 Verification Photo',
                'This photo will be used to verify your identity. Please upload a clear, well-lit photo of your face without sunglasses or filters.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Got it!', onPress: () => proceedWithImagePick(index) }
                ]
            );
            return;
        }

        await proceedWithImagePick(index);
    };

    const proceedWithImagePick = async (index: number) => {
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
                
                // Update slot with local URI
                const newSlots = [...photoSlots];
                newSlots[index] = {
                    localUri: imageUri,
                    cloudinaryUrl: null,
                    isUploading: false,
                    uploadError: null,
                };
                setPhotoSlots(newSlots);

                // If this is the profile picture (index 0), upload immediately
                if (index === 0) {
                    uploadProfilePicture(imageUri);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Upload profile picture immediately
    const uploadProfilePicture = async (imageUri: string) => {
        // Set uploading state
        setPhotoSlots(prev => {
            const newSlots = [...prev];
            newSlots[0] = { ...newSlots[0], isUploading: true, uploadError: null };
            return newSlots;
        });

        try {
            console.log('📤 Uploading profile picture...');
            const result = await authApi.uploadProfilePicture(imageUri);

            if (!result.success || !result.data?.photo) {
                throw new Error(result.message || 'Failed to upload profile picture');
            }

            console.log('✅ Profile picture uploaded:', result.data.photo);

            // Update slot with Cloudinary URL
            setPhotoSlots(prev => {
                const newSlots = [...prev];
                newSlots[0] = {
                    ...newSlots[0],
                    cloudinaryUrl: result.data!.photo,
                    isUploading: false,
                    uploadError: null,
                };
                return newSlots;
            });

            // Update local user state
            await updateUser({ photo: result.data.photo }, true);

        } catch (error: any) {
            console.error('❌ Profile picture upload failed:', error);
            setPhotoSlots(prev => {
                const newSlots = [...prev];
                newSlots[0] = {
                    ...newSlots[0],
                    isUploading: false,
                    uploadError: error.message || 'Upload failed',
                };
                return newSlots;
            });
        }
    };

    // Retry profile picture upload
    const retryProfilePicture = () => {
        const profileSlot = photoSlots[0];
        if (profileSlot.localUri) {
            uploadProfilePicture(profileSlot.localUri);
        }
    };

    const handleRemoveImage = async (index: number) => {
        const slot = photoSlots[index];
        
        // If the photo was uploaded to Cloudinary, delete from backend too
        if (slot.cloudinaryUrl) {
            try {
                console.log(`🗑️ Deleting photo at index ${index} from backend...`);
                const result = await authApi.deletePhoto(index);
                
                if (result.success) {
                    console.log('✅ Photo deleted from backend');
                } else {
                    console.warn('⚠️ Failed to delete from backend:', result.message);
                    // Continue with local removal anyway
                }
            } catch (error) {
                console.error('❌ Error deleting photo from backend:', error);
                // Continue with local removal anyway
            }
        }
        
        // Delete local file from device cache
        if (slot.localUri) {
            try {
                console.log(`🗑️ Deleting local file: ${slot.localUri}`);
                const fileInfo = await FileSystem.getInfoAsync(slot.localUri);
                
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(slot.localUri, { idempotent: true });
                    console.log('✅ Local file deleted');
                }
            } catch (error) {
                console.warn('⚠️ Could not delete local file:', error);
                // Not critical, continue anyway
            }
        }
        
        // Reset local state
        const newSlots = [...photoSlots];
        newSlots[index] = {
            localUri: null,
            cloudinaryUrl: null,
            isUploading: false,
            uploadError: null,
        };
        setPhotoSlots(newSlots);
        
        // Update local user state if needed
        if (index === 0) {
            await updateUser({ photo: undefined }, true);
        }
    };

    // Upload additional photos when clicking "Continue to Video"
    const handlePhotosComplete = async () => {
        if (!isEnough) return;

        // Check if profile picture is uploaded
        if (!profilePhotoUploaded) {
            Alert.alert('Please Wait', 'Profile picture is still uploading. Please wait or retry if it failed.');
            return;
        }

        // Get additional photos (index 1-5) that need uploading
        const additionalPhotos = photoSlots.slice(1).filter(slot => 
            slot.localUri !== null && slot.cloudinaryUrl === null
        );

        if (additionalPhotos.length === 0) {
            // All additional photos already uploaded, proceed to video
            setScreenStep('video');
            return;
        }

        setIsUploadingAdditional(true);
        setAdditionalError(null);

        try {
            console.log('📤 Uploading additional photos...');
            const urisToUpload = additionalPhotos.map(slot => slot.localUri!);
            
            const result = await authApi.uploadPhotos(urisToUpload);

            if (!result.success) {
                throw new Error(result.message || 'Failed to upload additional photos');
            }

            console.log('✅ Additional photos uploaded:', result.data?.uploadedUrls);

            // Update slots with Cloudinary URLs
            const uploadedUrls = result.data?.uploadedUrls || [];
            let urlIndex = 0;

            setPhotoSlots(prev => {
                const newSlots = [...prev];
                for (let i = 1; i < newSlots.length; i++) {
                    if (newSlots[i].localUri !== null && newSlots[i].cloudinaryUrl === null) {
                        newSlots[i] = {
                            ...newSlots[i],
                            cloudinaryUrl: uploadedUrls[urlIndex] || null,
                        };
                        urlIndex++;
                    }
                }
                return newSlots;
            });

            // Update local user state
            await updateUser({ additionalPhotos: uploadedUrls }, true);

            // Proceed to video step
            setScreenStep('video');

        } catch (error: any) {
            console.error('❌ Additional photos upload failed:', error);
            setAdditionalError(error.message || 'Failed to upload photos');
        } finally {
            setIsUploadingAdditional(false);
        }
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

            // Update local user state
            await updateUser({ verificationVideo: result.data?.video }, true);

            // Success! Navigate to next step
            Alert.alert(
                'Success! 🎉',
                'Your photos and video have been uploaded successfully.',
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

    // Photos Step (default)
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
                    <Text style={styles.title}>Add Your Best Photos</Text>
                    <Text style={styles.subtitle}>
                        Upload at least 3 photos. Your first photo will be uploaded immediately for verification.
                    </Text>
                </View>

                <View style={styles.grid}>
                    {photoSlots.map((slot, index) => (
                        <View key={index} style={styles.photoContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.photoSlot,
                                    !slot.localUri && styles.photoSlotEmpty,
                                    index === 0 && styles.photoSlotPrimary,
                                    { borderColor: index === 0 ? theme.colors.primary : theme.colors.border },
                                    slot.uploadError && { borderColor: theme.colors.error },
                                ]}
                                onPress={() => handlePickImage(index)}
                                activeOpacity={0.8}
                                disabled={slot.isUploading}
                            >
                                {slot.localUri ? (
                                    <>
                                        <Image source={{ uri: slot.localUri }} style={styles.photo} />
                                        
                                        {/* Upload status overlay */}
                                        {slot.isUploading && (
                                            <View style={styles.photoOverlay}>
                                                <ActivityIndicator size="small" color="#fff" />
                                            </View>
                                        )}

                                        {/* Uploaded checkmark */}
                                        {slot.cloudinaryUrl && !slot.isUploading && (
                                            <View style={styles.uploadedBadge}>
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            </View>
                                        )}

                                        {/* Error indicator */}
                                        {slot.uploadError && !slot.isUploading && (
                                            <TouchableOpacity 
                                                style={styles.errorBadge}
                                                onPress={index === 0 ? retryProfilePicture : undefined}
                                            >
                                                <Ionicons name="refresh" size={12} color="#fff" />
                                            </TouchableOpacity>
                                        )}

                                        {/* Remove button */}
                                        {!slot.isUploading && (
                                            <TouchableOpacity
                                                style={styles.removeBtn}
                                                onPress={() => handleRemoveImage(index)}
                                            >
                                                <Ionicons name="close" size={12} color="#fff" />
                                            </TouchableOpacity>
                                        )}

                                        {index === 0 && slot.cloudinaryUrl && (
                                            <View style={styles.verificationBadge}>
                                                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View style={styles.addIcon}>
                                        <Ionicons
                                            name={index === 0 ? "person" : "add"}
                                            size={24}
                                            color={theme.colors.primary}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                            {index === 0 && !slot.localUri && (
                                <View style={[styles.requiredBadge, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={[styles.requiredText, { color: '#fff' }]}>Profile</Text>
                                </View>
                            )}
                            {index > 0 && index < 3 && !slot.localUri && (
                                <View style={styles.requiredBadge}>
                                    <Text style={styles.requiredText}>Required</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Profile picture error message */}
                {photoSlots[0].uploadError && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning" size={20} color={theme.colors.error} />
                        <Text style={styles.errorBannerText}>
                            Profile picture upload failed: {photoSlots[0].uploadError}
                        </Text>
                        <TouchableOpacity onPress={retryProfilePicture}>
                            <Text style={styles.retryLink}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Additional photos error message */}
                {additionalError && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning" size={20} color={theme.colors.error} />
                        <Text style={styles.errorBannerText}>{additionalError}</Text>
                    </View>
                )}

                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Photo Tips 📸</Text>
                    <View style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>First photo: Clear face, no sunglasses</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Include a full body shot</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Show your hobbies and personality</Text>
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
                {isEnough && profilePhotoUploaded && (
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
                    title={isUploadingAdditional 
                        ? "Uploading photos..." 
                        : `Continue to Video (${uploadedCount}/6)`
                    }
                    onPress={handlePhotosComplete}
                    disabled={!isEnough || !profilePhotoUploaded || photoSlots[0].isUploading || isUploadingAdditional}
                    loading={isUploadingAdditional}
                    variant={isEnough && profilePhotoUploaded ? 'primary' : 'outline'}
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: PHOTO_GAP,
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
