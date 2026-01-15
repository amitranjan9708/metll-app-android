import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface VoiceNotePlayerProps {
    audioUrl: string;
    duration: number;
    waveformData?: number[];
    isOwn?: boolean;
}

const WAVEFORM_BARS = 30;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
    audioUrl,
    duration,
    waveformData,
    isOwn = false,
}) => {
    const theme = useTheme();
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Generate waveform bars (use provided data or generate placeholder)
    const waveform = waveformData && waveformData.length > 0
        ? waveformData.slice(0, WAVEFORM_BARS)
        : Array.from({ length: WAVEFORM_BARS }, () => Math.random() * 0.6 + 0.2);

    // Normalize waveform to 0-1 range
    const maxAmplitude = Math.max(...waveform);
    const normalizedWaveform = waveform.map(v => v / maxAmplitude);

    useEffect(() => {
        return () => {
            // Cleanup sound on unmount
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            const progress = status.positionMillis / (status.durationMillis || duration * 1000);
            setPlaybackPosition(status.positionMillis / 1000);

            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 100,
                useNativeDriver: false,
            }).start();

            if (status.didJustFinish) {
                setIsPlaying(false);
                setPlaybackPosition(0);
                progressAnim.setValue(0);
            }
        }
    };

    const handlePlayPause = async () => {
        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                setIsLoading(true);
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: audioUrl },
                    { shouldPlay: true },
                    handlePlaybackStatusUpdate
                );
                setSound(newSound);
                setIsPlaying(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Audio playback error:', error);
            setIsLoading(false);
        }
    };

    const styles = getStyles(theme, isOwn);
    const displayTime = isPlaying ? formatTime(playbackPosition) : formatTime(duration);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
                disabled={isLoading}
            >
                <Ionicons
                    name={isLoading ? 'hourglass' : (isPlaying ? 'pause' : 'play')}
                    size={20}
                    color={isOwn ? '#fff' : theme.colors.primary}
                />
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
                {normalizedWaveform.map((amplitude, index) => {
                    const progress = progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, WAVEFORM_BARS],
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.waveformBar,
                                {
                                    height: Math.max(4, amplitude * 24),
                                    backgroundColor: progress.interpolate({
                                        inputRange: [index - 1, index, index + 1],
                                        outputRange: [
                                            isOwn ? 'rgba(255,255,255,0.4)' : theme.colors.border,
                                            isOwn ? '#fff' : theme.colors.primary,
                                            isOwn ? 'rgba(255,255,255,0.4)' : theme.colors.border,
                                        ],
                                        extrapolate: 'clamp',
                                    }),
                                },
                            ]}
                        />
                    );
                })}
            </View>

            <Text style={styles.duration}>{displayTime}</Text>
        </View>
    );
};

const getStyles = (theme: any, isOwn: boolean) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        minWidth: 180,
        maxWidth: SCREEN_WIDTH * 0.6,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    waveformContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 24,
        marginRight: 8,
    },
    waveformBar: {
        width: 3,
        borderRadius: 2,
        backgroundColor: isOwn ? 'rgba(255,255,255,0.4)' : theme.colors.border,
    },
    duration: {
        fontSize: 12,
        color: isOwn ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary,
        minWidth: 40,
        textAlign: 'right',
    },
});

export default VoiceNotePlayer;
