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
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { callsApi } from '../services/api';
import { socketService } from '../services/socket';
import createAgoraRtcEngine, {
    IRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
} from 'react-native-agora';

interface CallParams {
    callId?: number;
    matchId: number;
    userName: string;
    userPhoto: string;
    callType: 'voice' | 'video';
    isIncoming?: boolean;
    channelName?: string;
    token?: string;
    appId?: string;
    callerId?: number;
}

export const CallScreen: React.FC = () => {
    const theme = useTheme();
    const styles = getStyles(theme);
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as CallParams;

    const {
        matchId,
        userName,
        userPhoto,
        callType,
        isIncoming = false,
    } = params;

    const [callStatus, setCallStatus] = useState<'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended'>(
        isIncoming ? 'ringing' : 'initiating'
    );
    const [callId, setCallId] = useState<number | null>(params.callId || null);
    const [channelName, setChannelName] = useState<string>(params.channelName || '');
    const [token, setToken] = useState<string>(params.token || '');
    const [appId, setAppId] = useState<string>(params.appId || '');
    const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(callType === 'video');
    const [callDuration, setCallDuration] = useState(0);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const [isJoined, setIsJoined] = useState(false);

    const agoraEngineRef = useRef<IRtcEngine | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const durationInterval = useRef<NodeJS.Timeout | null>(null);

    // Request permissions
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                ]);

                const audioGranted = granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
                const cameraGranted = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;

                if (!audioGranted) {
                    Alert.alert('Permission Required', 'Microphone permission is required for calls');
                    return false;
                }

                if (callType === 'video' && !cameraGranted) {
                    Alert.alert('Permission Required', 'Camera permission is required for video calls');
                    return false;
                }

                return true;
            } catch (err) {
                console.error('Permission error:', err);
                return false;
            }
        }
        return true;
    };

    // Initialize Agora engine
    const initAgoraEngine = async (agoraAppId: string) => {
        try {
            agoraEngineRef.current = createAgoraRtcEngine();
            const engine = agoraEngineRef.current;

            engine.registerEventHandler({
                onJoinChannelSuccess: () => {
                    console.log('Successfully joined channel');
                    setIsJoined(true);
                },
                onUserJoined: (_connection, uid) => {
                    console.log('Remote user joined:', uid);
                    setRemoteUid(uid);
                    setCallStatus('connected');
                },
                onUserOffline: (_connection, uid) => {
                    console.log('Remote user left:', uid);
                    setRemoteUid(null);
                    handleEndCall();
                },
                onError: (err) => {
                    console.error('Agora error:', err);
                },
            });

            engine.initialize({
                appId: agoraAppId,
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
            });

            if (callType === 'video') {
                engine.enableVideo();
                engine.startPreview();
            }

            engine.enableAudio();

            return true;
        } catch (e) {
            console.error('Failed to initialize Agora:', e);
            return false;
        }
    };

    // Join the Agora channel
    const joinChannel = async (agoraToken: string, channel: string, uid: number) => {
        try {
            const engine = agoraEngineRef.current;
            if (!engine) return false;

            await engine.joinChannel(agoraToken, channel, uid, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: callType === 'video',
                autoSubscribeAudio: true,
                autoSubscribeVideo: callType === 'video',
            });

            return true;
        } catch (e) {
            console.error('Failed to join channel:', e);
            return false;
        }
    };

    // Leave channel and cleanup
    const leaveChannel = async () => {
        try {
            const engine = agoraEngineRef.current;
            if (engine) {
                await engine.leaveChannel();
                engine.release();
                agoraEngineRef.current = null;
            }
        } catch (e) {
            console.error('Error leaving channel:', e);
        }
    };

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
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, [callStatus]);

    // Setup socket listeners for call events
    useEffect(() => {
        const handleCallAnswered = () => {
            console.log('Call was answered');
            setCallStatus('connected');
        };

        const handleCallEnded = () => {
            console.log('Call ended by other party');
            handleEndCall();
        };

        const handleCallDeclined = () => {
            console.log('Call was declined');
            Alert.alert('Call Declined', `${userName} declined the call`);
            navigation.goBack();
        };

        socketService.on('call_answered', handleCallAnswered);
        socketService.on('call_ended', handleCallEnded);
        socketService.on('call_declined', handleCallDeclined);

        return () => {
            socketService.off('call_answered', handleCallAnswered);
            socketService.off('call_ended', handleCallEnded);
            socketService.off('call_declined', handleCallDeclined);
        };
    }, []);

    // Initialize call on mount
    useEffect(() => {
        const setupCall = async () => {
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                navigation.goBack();
                return;
            }

            if (isIncoming) {
                // For incoming calls, we already have the channel info
                // Wait for user to answer
                setCallStatus('ringing');
            } else {
                // For outgoing calls, initiate the call
                await initiateCall();
            }
        };

        setupCall();

        return () => {
            leaveChannel();
        };
    }, []);

    // Initiate outgoing call
    const initiateCall = async () => {
        try {
            setCallStatus('initiating');
            const response = await callsApi.initiateCall(matchId, callType);

            setCallId(response.callId);
            setChannelName(response.channelName);
            setToken(response.token);
            setAppId(response.appId);
            setCallStatus('ringing');

            // Initialize and join Agora
            const initialized = await initAgoraEngine(response.appId);
            if (initialized) {
                await joinChannel(response.token, response.channelName, 0);
            }
        } catch (error: any) {
            console.error('Failed to initiate call:', error);
            Alert.alert('Call Failed', error.message || 'Could not initiate call');
            navigation.goBack();
        }
    };

    // Answer incoming call
    const handleAnswerCall = async () => {
        try {
            if (!callId) return;

            setCallStatus('connecting');

            // Tell backend we answered
            await callsApi.answerCall(callId);

            // Initialize Agora with provided credentials
            const initialized = await initAgoraEngine(appId);
            if (initialized && token && channelName) {
                await joinChannel(token, channelName, 0);
                setCallStatus('connected');
            }
        } catch (error: any) {
            console.error('Failed to answer call:', error);
            Alert.alert('Error', 'Failed to answer call');
            navigation.goBack();
        }
    };

    // Decline incoming call
    const handleDeclineCall = async () => {
        try {
            if (callId) {
                await callsApi.declineCall(callId);
            }
            navigation.goBack();
        } catch (error) {
            console.error('Failed to decline call:', error);
            navigation.goBack();
        }
    };

    // End call
    const handleEndCall = async () => {
        try {
            if (callId) {
                await callsApi.endCall(callId);
            }
            await leaveChannel();
            setCallStatus('ended');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to end call:', error);
            navigation.goBack();
        }
    };

    // Toggle video
    const toggleVideo = () => {
        const engine = agoraEngineRef.current;
        if (engine) {
            if (isVideoEnabled) {
                engine.muteLocalVideoStream(true);
            } else {
                engine.muteLocalVideoStream(false);
            }
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    // Toggle mute
    const toggleMute = () => {
        const engine = agoraEngineRef.current;
        if (engine) {
            engine.muteLocalAudioStream(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Toggle speaker
    const toggleSpeaker = () => {
        const engine = agoraEngineRef.current;
        if (engine) {
            engine.setEnableSpeakerphone(!isSpeakerOn);
            setIsSpeakerOn(!isSpeakerOn);
        }
    };

    // Switch camera
    const switchCamera = () => {
        const engine = agoraEngineRef.current;
        if (engine) {
            engine.switchCamera();
        }
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
                return isIncoming ? 'Incoming call...' : 'Ringing...';
            case 'connecting':
                return 'Connecting...';
            case 'connected':
                return formatDuration(callDuration);
            case 'ended':
                return 'Call Ended';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background - Video or Voice */}
            <View style={styles.background}>
                {callType === 'video' && callStatus === 'connected' && remoteUid ? (
                    // Remote user's video
                    <RtcSurfaceView
                        style={styles.remoteVideo}
                        canvas={{ uid: remoteUid }}
                    />
                ) : (
                    <View style={styles.voiceBackground} />
                )}
            </View>

            {/* Local video preview (small) */}
            {callType === 'video' && isJoined && isVideoEnabled && (
                <View style={styles.localVideoContainer}>
                    <RtcSurfaceView
                        style={styles.localVideo}
                        canvas={{ uid: 0 }}
                    />
                    <TouchableOpacity style={styles.switchCameraBtn} onPress={switchCamera}>
                        <Ionicons name="camera-reverse" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {/* User Info */}
            <View style={styles.userInfo}>
                <Animated.View
                    style={[
                        styles.avatarContainer,
                        callStatus === 'ringing' && { transform: [{ scale: pulseAnim }] },
                    ]}
                >
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
                {/* Incoming call - Answer/Decline buttons */}
                {isIncoming && callStatus === 'ringing' && (
                    <View style={styles.incomingControls}>
                        <TouchableOpacity style={styles.declineButton} onPress={handleDeclineCall}>
                            <Ionicons name="close" size={32} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.answerButton} onPress={handleAnswerCall}>
                            <Ionicons name="call" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Active call controls */}
                {(callStatus === 'connected' || (!isIncoming && callStatus !== 'ended')) && (
                    <>
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

                            {callType === 'video' && (
                                <TouchableOpacity
                                    style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
                                    onPress={toggleVideo}
                                >
                                    <Ionicons
                                        name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                                        size={28}
                                        color={!isVideoEnabled ? theme.colors.primary : '#fff'}
                                    />
                                    <Text style={styles.controlLabel}>Video</Text>
                                </TouchableOpacity>
                            )}

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

                        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                            <Ionicons name="call" size={32} color="#fff" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const getStyles = (theme: any) =>
    StyleSheet.create({
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
        remoteVideo: {
            flex: 1,
        },
        localVideoContainer: {
            position: 'absolute',
            top: 60,
            right: 20,
            width: 120,
            height: 160,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        localVideo: {
            flex: 1,
        },
        switchCameraBtn: {
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
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
        incomingControls: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginBottom: 20,
        },
        answerButton: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#34C759',
            justifyContent: 'center',
            alignItems: 'center',
        },
        declineButton: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#FF3B30',
            justifyContent: 'center',
            alignItems: 'center',
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
