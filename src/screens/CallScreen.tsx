import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Animated,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { callsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CallParams {
    matchId: number;
    userName: string;
    userPhoto: string;
    callType: 'voice' | 'video';
}

export const CallScreen: React.FC = () => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const navigation = useNavigation();
    const route = useRoute();
    const { matchId, userName, userPhoto, callType } = route.params as CallParams;
    const { user } = useAuth();

    const [callStatus, setCallStatus] = useState<'initiating' | 'ringing' | 'connected' | 'ended'>('initiating');
    const [callId, setCallId] = useState<number | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const durationInterval = useRef<NodeJS.Timeout | null>(null);

    // Pulse animation for ringing state
    useEffect(() => {
        if (callStatus === 'ringing') {
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
    }, [callStatus]);

    // Call duration timer
    useEffect(() => {
        if (callStatus === 'connected') {
            durationInterval.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, [callStatus]);

    // Initiate call on mount
    useEffect(() => {
        initiateCall();
    }, []);

    const initiateCall = async () => {
        try {
            const response = await callsApi.initiateCall(matchId, callType);
            setCallId(response.callId);
            setCallStatus('ringing');

            // TODO: When Agora SDK is integrated, join channel here
            // For now, simulate connection after 3 seconds
            setTimeout(() => {
                setCallStatus('connected');
            }, 3000);
        } catch (error: any) {
            console.error('Failed to initiate call:', error);
            Alert.alert('Call Failed', error.message || 'Could not initiate call');
            navigation.goBack();
        }
    };

    const handleEndCall = async () => {
        try {
            if (callId) {
                await callsApi.endCall(callId);
            }
            setCallStatus('ended');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to end call:', error);
            navigation.goBack();
        }
    };

    const toggleVideo = () => {
        setIsVideoEnabled(!isVideoEnabled);
        // TODO: Toggle video track when Agora SDK is integrated
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        // TODO: Mute audio track when Agora SDK is integrated
    };

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        // TODO: Toggle speaker when Agora SDK is integrated
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusText = () => {
        switch (callStatus) {
            case 'initiating':
                return 'Connecting...';
            case 'ringing':
                return 'Ringing...';
            case 'connected':
                return formatDuration(callDuration);
            case 'ended':
                return 'Call Ended';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background */}
            <View style={styles.background}>
                {isVideoEnabled ? (
                    // Video placeholder - would show remote video when Agora is integrated
                    <View style={styles.videoPlaceholder}>
                        <Text style={styles.videoPlaceholderText}>
                            Video will appear here when Agora SDK is integrated
                        </Text>
                    </View>
                ) : (
                    <View style={styles.voiceBackground} />
                )}
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
                <Animated.View style={[
                    styles.avatarContainer,
                    callStatus === 'ringing' && { transform: [{ scale: pulseAnim }] }
                ]}>
                    <Image
                        source={{ uri: userPhoto || 'https://via.placeholder.com/120' }}
                        style={styles.avatar}
                    />
                </Animated.View>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.callStatus}>{getStatusText()}</Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                {/* Top row - additional controls */}
                <View style={styles.controlRow}>
                    <TouchableOpacity
                        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                        onPress={toggleMute}
                    >
                        <Ionicons
                            name={isMuted ? 'mic-off' : 'mic'}
                            size={28}
                            color={isMuted ? theme.colors.primary : '#fff'}
                        />
                        <Text style={styles.controlLabel}>Mute</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, isVideoEnabled && styles.controlButtonActive]}
                        onPress={toggleVideo}
                    >
                        <Ionicons
                            name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                            size={28}
                            color={isVideoEnabled ? theme.colors.primary : '#fff'}
                        />
                        <Text style={styles.controlLabel}>Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
                        onPress={toggleSpeaker}
                    >
                        <Ionicons
                            name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                            size={28}
                            color={isSpeakerOn ? theme.colors.primary : '#fff'}
                        />
                        <Text style={styles.controlLabel}>Speaker</Text>
                    </TouchableOpacity>
                </View>

                {/* End call button */}
                <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                    <Ionicons name="call" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    voiceBackground: {
        flex: 1,
        backgroundColor: '#2d2d2d',
    },
    videoPlaceholder: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlaceholderText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    avatarContainer: {
        marginBottom: 24,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    userName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    callStatus: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
    },
    controls: {
        paddingHorizontal: 40,
        paddingBottom: 60,
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
    },
    controlButton: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        minWidth: 80,
    },
    controlButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    controlLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 8,
    },
    endCallButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        transform: [{ rotate: '135deg' }],
    },
});
