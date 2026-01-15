import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    Vibration,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface VoiceRecorderProps {
    onRecordingComplete: (uri: string, duration: number, waveformData: number[]) => void;
    onCancel: () => void;
    isVisible: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANCEL_THRESHOLD = -80;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onRecordingComplete,
    onCancel,
    isVisible,
}) => {
    const theme = useTheme();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [slideOffset, setSlideOffset] = useState(0);
    const [isCancelling, setIsCancelling] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const waveformData = useRef<number[]>([]);
    const durationInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRecording) {
            // Pulse animation
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [isRecording]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setRecordingDuration(0);
            waveformData.current = [];
            Vibration.vibrate(50);

            // Start duration counter
            durationInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
                // Simulate waveform data (in production, you'd get real audio levels)
                waveformData.current.push(Math.random() * 0.6 + 0.2);
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async (cancelled: boolean = false) => {
        if (!recording) return;

        if (durationInterval.current) {
            clearInterval(durationInterval.current);
        }

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            setIsRecording(false);
            setRecording(null);
            setSlideOffset(0);
            setIsCancelling(false);

            if (cancelled || !uri) {
                onCancel();
            } else {
                onRecordingComplete(uri, recordingDuration, waveformData.current);
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setIsRecording(false);
            setRecording(null);
            onCancel();
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                startRecording();
            },
            onPanResponderMove: (_, gestureState) => {
                const offset = Math.min(0, gestureState.dx);
                setSlideOffset(offset);
                slideAnim.setValue(offset);
                setIsCancelling(offset < CANCEL_THRESHOLD);

                if (offset < CANCEL_THRESHOLD && !isCancelling) {
                    Vibration.vibrate(30);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < CANCEL_THRESHOLD) {
                    stopRecording(true);
                } else {
                    stopRecording(false);
                }
            },
            onPanResponderTerminate: () => {
                stopRecording(true);
            },
        })
    ).current;

    if (!isVisible) return null;

    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            {isRecording ? (
                <View style={styles.recordingContainer}>
                    <Animated.View
                        style={[
                            styles.slideContainer,
                            { transform: [{ translateX: slideAnim }] }
                        ]}
                    >
                        <View style={styles.slideHint}>
                            <Ionicons
                                name="chevron-back"
                                size={20}
                                color={isCancelling ? theme.colors.error : theme.colors.textSecondary}
                            />
                            <Text style={[
                                styles.slideText,
                                isCancelling && { color: theme.colors.error }
                            ]}>
                                {isCancelling ? 'Release to cancel' : 'Slide to cancel'}
                            </Text>
                        </View>

                        <Animated.View style={[
                            styles.recordingIndicator,
                            { transform: [{ scale: pulseAnim }] }
                        ]}>
                            <View style={styles.recordingDot} />
                        </Animated.View>

                        <Text style={styles.durationText}>{formatTime(recordingDuration)}</Text>
                    </Animated.View>
                </View>
            ) : null}

            <View
                style={styles.micButtonContainer}
                {...panResponder.panHandlers}
            >
                <Animated.View style={[
                    styles.micButton,
                    isRecording && {
                        transform: [{ scale: pulseAnim }],
                        backgroundColor: theme.colors.error,
                    }
                ]}>
                    <Ionicons
                        name="mic"
                        size={24}
                        color="#fff"
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: 25,
        paddingHorizontal: 16,
        marginRight: 8,
        height: 50,
    },
    slideContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slideHint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    slideText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.error || '#ff4444',
        marginRight: 8,
    },
    durationText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        minWidth: 45,
        textAlign: 'right',
    },
    micButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    micButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});

export default VoiceRecorder;
