import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface VideoRecorderProps {
  onVideoRecorded: (uri: string) => void;
  onCancel: () => void;
  minDuration?: number;
  maxDuration?: number;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onVideoRecorded,
  onCancel,
  minDuration = 3,
  maxDuration = 5,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordedVideoUriRef = useRef<string | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation for recording indicator
      Animated.loop(
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
      ).start();

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      pulseAnim.setValue(1);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, maxDuration]);

  if (!permission || !micPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted || !micPermission.granted) {
    const requestAllPermissions = async () => {
      await requestPermission();
      await requestMicPermission();
    };

    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera and microphone permissions are required for video recording
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestAllPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);
      recordedVideoUriRef.current = null;

      const video = await cameraRef.current.recordAsync({
        maxDuration,
      });

      if (video && video.uri) {
        recordedVideoUriRef.current = video.uri;
        // Check if recording time meets minimum requirement
        const finalTime = recordingTime;

        if (finalTime >= minDuration) {
          onVideoRecorded(video.uri);
        } else {
          setRetryCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= 2) {
              Alert.alert(
                'Max Retries',
                'You have reached the maximum number of retries.',
                [{ text: 'OK', onPress: onCancel }]
              );
            } else {
              Alert.alert(
                'Video Too Short',
                `Please record at least ${minDuration} seconds. Try again.`,
                [{ text: 'Retry' }]
              );
            }
            return newCount;
          });
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    return seconds.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="video"
      >
        <View style={styles.overlay}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {isRecording ? 'Recording...' : 'Ready to Record'}
            </Text>
            <Text style={styles.instructionsText}>
              {isRecording
                ? 'Slowly turn your head left, then right'
                : 'Position your face in the frame and tap record'}
            </Text>
          </View>

          {/* Recording indicator */}
          {isRecording && (
            <Animated.View
              style={[
                styles.recordingIndicator,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {formatTime(recordingTime)}s
              </Text>
            </Animated.View>
          )}

          {/* Face guide frame */}
          <View style={styles.faceGuide} />

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isRecording}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {!isRecording ? (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryGradientEnd]}
                  style={styles.recordButtonGradient}
                >
                  <Ionicons name="videocam" size={32} color={theme.colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <View style={styles.stopButtonInner}>
                  <Ionicons name="stop" size={24} color={theme.colors.white} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  instructionsTitle: {
    ...theme.typography.heading,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  instructionsText: {
    ...theme.typography.body,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.sm,
  },
  recordingTime: {
    ...theme.typography.bodyBold,
    color: theme.colors.white,
  },
  faceGuide: {
    width: 250,
    height: 300,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  cancelButton: {
    padding: theme.spacing.md,
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    ...theme.shadows.glow,
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  stopButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    ...theme.typography.body,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  permissionButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
});
