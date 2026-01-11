import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { VideoRecorder } from '../components/VideoRecorder';
import { uploadMultipleImages, uploadVideo, isCloudinaryConfigured } from '../services/cloudinary';
import { authApi } from '../services/api';

const { width } = Dimensions.get('window');
const PHOTO_GAP = 12;
const PHOTO_SIZE = (width - (24 * 2) - (PHOTO_GAP * 2)) / 3;

type ScreenStep = 'photos' | 'video';
type UploadStatus = 'idle' | 'uploading' | 'error' | 'success';

interface UploadState {
    status: UploadStatus;
    message: string;
    errorType?: 'cloudinary' | 'backend';
    photoUrls?: string[];
    videoUrl?: string;
}

export const PhotoUploadScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { updateUser } = useAuth();

    // Screen step: photos first, then video
    const [screenStep, setScreenStep] = useState<ScreenStep>('photos');

    // 6 slots, initially empty (null)
    const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null]);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    
    // Upload state with error handling
    const [uploadState, setUploadState] = useState<UploadState>({
        status: 'idle',
        message: '',
    });

    // Count non-null photos
    const uploadedCount = photos.filter(p => p !== null).length;
    const isEnough = uploadedCount >= 3;

    const handlePickImage = async (index: number) => {
        // If this is the first photo slot (index 0) and it's empty, show verification prompt
        if (index === 0 && photos[0] === null) {
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
                const newPhotos = [...photos];
                newPhotos[index] = result.assets[0].uri;
                setPhotos(newPhotos);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleRemoveImage = (index: number) => {
        const newPhotos = [...photos];
        newPhotos[index] = null;
        setPhotos(newPhotos);
    };

    const handlePhotosComplete = () => {
        if (!isEnough) return;
        // Transition to video recording step
        setScreenStep('video');
    };

    const handleVideoRecorded = (uri: string) => {
        setVideoUri(uri);
        // Proceed to upload
        handleFinalSubmit(uri);
    };

    const handleVideoCancel = () => {
        // Go back to photos step
        setScreenStep('photos');
    };

    // Retry handler - resumes from where it failed
    const handleRetry = () => {
        if (!videoUri) return;
        
        if (uploadState.errorType === 'cloudinary') {
            // Retry from Cloudinary upload
            handleFinalSubmit(videoUri);
        } else if (uploadState.errorType === 'backend') {
            // Retry just the backend sync (we already have Cloudinary URLs)
            retryBackendSync();
        }
    };

    // Retry backend sync with already-uploaded Cloudinary URLs
    const retryBackendSync = async () => {
        if (!uploadState.photoUrls || !uploadState.videoUrl) {
            // No cached URLs, restart full upload
            if (videoUri) handleFinalSubmit(videoUri);
            return;
        }

        setUploadState({
            status: 'uploading',
            message: 'Syncing with server...',
            photoUrls: uploadState.photoUrls,
            videoUrl: uploadState.videoUrl,
        });

        try {
            // Call backend API directly - first photo is the main profile photo
            const backendResult = await authApi.updateProfile({
                photo: uploadState.photoUrls[0], // First photo is profile photo
                additionalPhotos: uploadState.photoUrls,
                verificationVideo: uploadState.videoUrl,
            });

            if (!backendResult.success) {
                throw new Error(backendResult.message || 'Backend sync failed');
            }

            // Update local user state (skip backend sync - we already did it above)
            await updateUser({
                photo: uploadState.photoUrls[0], // First photo is profile photo
                additionalPhotos: uploadState.photoUrls,
                verificationVideo: uploadState.videoUrl,
            }, true); // skipBackendSync = true

            setUploadState({ status: 'success', message: 'Profile saved!' });
            
            // Navigate to next step
            setTimeout(() => {
                navigation.navigate('SituationIntro');
            }, 500);
        } catch (error: any) {
            console.error('Backend sync retry failed:', error);
            setUploadState({
                status: 'error',
                message: error.message || 'Failed to sync with server',
                errorType: 'backend',
                photoUrls: uploadState.photoUrls,
                videoUrl: uploadState.videoUrl,
            });
        }
    };

    const handleFinalSubmit = async (recordedVideoUri: string) => {
        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
            Alert.alert(
                'Configuration Error',
                'Cloudinary is not configured. Please add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env file.',
                [{ text: 'OK' }]
            );
            return;
        }

        setUploadState({ status: 'uploading', message: 'Preparing upload...' });
        
        try {
            // Filter out nulls
            const validPhotos = photos.filter((p): p is string => p !== null);
            
            // Step 1: Upload photos to Cloudinary
            setUploadState({ status: 'uploading', message: 'Uploading photos...' });
            
            const photoResult = await uploadMultipleImages(
                validPhotos,
                'metll/profiles',
                (completed, total) => {
                    setUploadState({ 
                        status: 'uploading', 
                        message: `Uploading photo ${completed + 1} of ${total}...` 
                    });
                }
            );

            // Check if photo upload failed
            if (photoResult.urls.length === 0) {
                throw { 
                    type: 'cloudinary', 
                    message: 'Failed to upload photos. Please check your internet connection.' 
                };
            }

            if (photoResult.errors.length > 0 && photoResult.urls.length < validPhotos.length) {
                console.warn('Some photos failed to upload:', photoResult.errors);
                // Continue with successfully uploaded photos
            }

            const photoUrls = photoResult.urls;

            // Step 2: Upload video to Cloudinary
            setUploadState({ 
                status: 'uploading', 
                message: 'Uploading verification video...',
                photoUrls, // Cache in case we need to retry
            });
            
            const videoResult = await uploadVideo(recordedVideoUri, 'metll/verification');
            
            if (!videoResult.success || !videoResult.url) {
                throw { 
                    type: 'cloudinary', 
                    message: 'Failed to upload video. Please check your internet connection.',
                    photoUrls, // Keep cached
                };
            }

            const videoUrl = videoResult.url;

            // Step 3: Sync with backend
            setUploadState({ 
                status: 'uploading', 
                message: 'Saving to your profile...',
                photoUrls,
                videoUrl,
            });

            const backendResult = await authApi.updateProfile({
                photo: photoUrls[0], // First photo is profile photo
                additionalPhotos: photoUrls,
                verificationVideo: videoUrl,
            });

            if (!backendResult.success) {
                throw { 
                    type: 'backend', 
                    message: backendResult.message || 'Failed to save profile',
                    photoUrls,
                    videoUrl,
                };
            }

            // Step 4: Update local state (skip backend sync - we already did it above)
            await updateUser({
                photo: photoUrls[0], // First photo is profile photo
                additionalPhotos: photoUrls,
                verificationVideo: videoUrl,
            }, true); // skipBackendSync = true

            // Success!
            setUploadState({ status: 'success', message: 'Profile saved successfully!' });
            
            // Navigate to next step after brief delay
            setTimeout(() => {
                navigation.navigate('SituationIntro');
            }, 800);

        } catch (error: any) {
            console.error('Upload error:', error);
            
            if (error.type === 'cloudinary') {
                setUploadState({
                    status: 'error',
                    message: error.message || 'Upload to cloud failed',
                    errorType: 'cloudinary',
                    photoUrls: error.photoUrls,
                });
            } else if (error.type === 'backend') {
                setUploadState({
                    status: 'error',
                    message: error.message || 'Failed to sync with server',
                    errorType: 'backend',
                    photoUrls: error.photoUrls,
                    videoUrl: error.videoUrl,
                });
            } else {
                setUploadState({
                    status: 'error',
                    message: error.message || 'Something went wrong',
                    errorType: 'cloudinary',
                });
            }
        }
    };

    const styles = getStyles(theme);

    // Upload Status Overlay Component
    const renderUploadOverlay = () => {
        if (uploadState.status === 'idle') return null;

        return (
            <View style={styles.uploadOverlay}>
                <View style={styles.uploadModal}>
                    {uploadState.status === 'uploading' && (
                        <>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.uploadText}>{uploadState.message}</Text>
                            <Text style={styles.uploadSubtext}>Please don't close the app</Text>
                        </>
                    )}
                    
                    {uploadState.status === 'error' && (
                        <>
                            <View style={styles.errorIcon}>
                                <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                            </View>
                            <Text style={styles.errorTitle}>Upload Failed</Text>
                            <Text style={styles.errorMessage}>{uploadState.message}</Text>
                            <View style={styles.errorButtons}>
                                <TouchableOpacity 
                                    style={styles.retryButton}
                                    onPress={handleRetry}
                                >
                                    <Ionicons name="refresh" size={20} color="#fff" />
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setUploadState({ status: 'idle', message: '' });
                                        setScreenStep('photos');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Go Back</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                    
                    {uploadState.status === 'success' && (
                        <>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                            </View>
                            <Text style={styles.successText}>{uploadState.message}</Text>
                        </>
                    )}
                </View>
            </View>
        );
    };

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
                        disabled={uploadState.status === 'uploading'}
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
                            Record a short video (at least 3 seconds) to verify you're a real person.
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

                {/* Upload Status Overlay */}
                {renderUploadOverlay()}
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
                <View style={styles.header}>
                    <Text style={styles.title}>Add Your Best Photos</Text>
                    <Text style={styles.subtitle}>
                        Upload at least 3 photos. Your first photo will be used for verification.
                    </Text>
                </View>

                {/* Cloudinary Warning */}
                {!isCloudinaryConfigured() && (
                    <View style={styles.warningBanner}>
                        <Ionicons name="warning" size={20} color="#856404" />
                        <Text style={styles.warningText}>
                            Cloudinary not configured. Photos won't be saved to cloud.
                        </Text>
                    </View>
                )}

                <View style={styles.grid}>
                    {photos.map((photoUri, index) => (
                        <View key={index} style={styles.photoContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.photoSlot,
                                    !photoUri && styles.photoSlotEmpty,
                                    index === 0 && styles.photoSlotPrimary,
                                    { borderColor: index === 0 ? theme.colors.primary : theme.colors.border }
                                ]}
                                onPress={() => handlePickImage(index)}
                                activeOpacity={0.8}
                            >
                                {photoUri ? (
                                    <>
                                        <Image source={{ uri: photoUri }} style={styles.photo} />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => handleRemoveImage(index)}
                                        >
                                            <Ionicons name="close" size={12} color="#fff" />
                                        </TouchableOpacity>
                                        {index === 0 && (
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
                            {index === 0 && !photoUri && (
                                <View style={[styles.requiredBadge, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={[styles.requiredText, { color: '#fff' }]}>Verification</Text>
                                </View>
                            )}
                            {index > 0 && index < 3 && !photoUri && (
                                <View style={styles.requiredBadge}>
                                    <Text style={styles.requiredText}>Required</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

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

                {/* Next Step Preview */}
                {isEnough && (
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
                    title={`Continue to Video (${uploadedCount}/6)`}
                    onPress={handlePhotosComplete}
                    disabled={!isEnough || !isCloudinaryConfigured()}
                    variant={isEnough ? 'primary' : 'outline'}
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
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        gap: 8,
    },
    warningText: {
        flex: 1,
        color: '#856404',
        fontSize: 13,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: PHOTO_GAP,
        marginBottom: theme.spacing.xl,
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
        marginLeft: -35,
        width: 70,
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
    tipsContainer: {
        backgroundColor: theme.colors.backgroundCard,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
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
    nextStepPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: 8,
    },
    nextStepText: {
        ...theme.typography.caption,
        color: theme.colors.accent,
        fontWeight: '600',
    },
    footer: {
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
    // Error state styles
    errorIcon: {
        marginBottom: theme.spacing.md,
    },
    errorTitle: {
        ...theme.typography.subheading,
        color: theme.colors.error,
        marginBottom: theme.spacing.sm,
    },
    errorMessage: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    errorButtons: {
        width: '100%',
        gap: theme.spacing.sm,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        gap: 8,
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
    },
    cancelButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
    // Success state styles
    successIcon: {
        marginBottom: theme.spacing.md,
    },
    successText: {
        ...theme.typography.bodyBold,
        color: theme.colors.success,
        textAlign: 'center',
    },
});
