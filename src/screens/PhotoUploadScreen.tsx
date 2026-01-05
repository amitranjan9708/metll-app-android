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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { VideoRecorder } from '../components/VideoRecorder';

const { width } = Dimensions.get('window');
const PHOTO_GAP = 12;
const PHOTO_SIZE = (width - (24 * 2) - (PHOTO_GAP * 2)) / 3;

type ScreenStep = 'photos' | 'video';

export const PhotoUploadScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const { updateUser } = useAuth();

    // Screen step: photos first, then video
    const [screenStep, setScreenStep] = useState<ScreenStep>('photos');

    // 6 slots, initially empty (null)
    const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null]);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

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
        // Proceed to save and navigate
        handleFinalSubmit(uri);
    };

    const handleVideoCancel = () => {
        // Go back to photos step
        setScreenStep('photos');
    };

    const handleFinalSubmit = async (recordedVideoUri: string) => {
        setUploading(true);
        try {
            // Filter out nulls and save photos
            const validPhotos = photos.filter((p): p is string => p !== null);

            // Save both photos and verification video
            await updateUser({
                additionalPhotos: validPhotos,
                verificationVideo: recordedVideoUri,
            });

            // Navigate to next onboarding step
            navigation.navigate('SituationIntro');
        } catch (error) {
            Alert.alert('Error', 'Failed to save. Please try again.');
        } finally {
            setUploading(false);
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
                <View style={styles.videoHeader}>
                    <TouchableOpacity style={styles.backBtn} onPress={handleVideoCancel}>
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
            </LinearGradient>
        );
    }

    // Photos Step (default)
    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.backgroundLight]}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add Your Best Photos</Text>
                    <Text style={styles.subtitle}>
                        Upload at least 3 photos. Your first photo will be used for verification.
                    </Text>
                </View>

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
                    title={uploading ? "Saving..." : `Continue to Video (${uploadedCount}/6)`}
                    onPress={handlePhotosComplete}
                    disabled={!isEnough || uploading}
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
        paddingTop: 60,
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
        paddingTop: 50,
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
});
