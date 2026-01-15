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

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveformData = useRef<number[]>([]);
    const durationInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') return;

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

            durationInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
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

            if (cancelled || !uri) {
                onCancel();
            } else {
                onRecordingComplete(uri, recordingDuration, waveformData.current);
            }
            Vibration.vibrate(30);
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setIsRecording(false);
            setRecording(null);
            onCancel();
        }
    };

    const handleMicPress = () => {
        if (isRecording) {
            stopRecording(false);
        } else {
            startRecording();
        }
    };

    if (!isVisible) return null;

    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            {isRecording && (
                <View style={styles.recordingContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => stopRecording(true)}
                    >
                        <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>

                    <View style={styles.activeInfo}>
                        <Animated.View style={[
                            styles.recordingDot,
                            { opacity: pulseAnim }
                        ]} />
                        <Text style={styles.durationText}>{formatTime(recordingDuration)}</Text>
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={styles.micButtonContainer}
                onPress={handleMicPress}
                activeOpacity={0.8}
            >
                <Animated.View style={[
                    styles.micButton,
                    isRecording && {
                        transform: [{ scale: pulseAnim }],
                        backgroundColor: theme.colors.primary,
                    }
                ]}>
                    <Ionicons
                        name={isRecording ? "send" : "mic"}
                        size={24}
                        color="#fff"
                        style={isRecording ? { marginLeft: 3 } : {}}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
    },
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: 25,
        paddingHorizontal: 12,
        marginRight: 8,
        height: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cancelButton: {
        padding: 4,
    },
    activeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
        marginRight: 8,
    },
    durationText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    micButtonContainer: {
        width: 50,
        height: 50,
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
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});

export default VoiceRecorder;
