import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from '@react-navigation/native';
import { Button } from '../components/Button';
import { OTPInput } from '../components/OTPInput';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const OTPScreen: React.FC = () => {
  const route = useRoute();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const user = (route.params as any)?.user;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await login({
        id: Date.now().toString(),
        ...user,
      });
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
  };

  return (
    <LinearGradient
      colors={theme.gradients.background.colors as [string, string, string]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={theme.gradients.primary.colors as [string, string]}
              style={styles.iconGradient}
            >
              <Ionicons name="shield-checkmark" size={40} color={theme.colors.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.phoneText}>{user?.phone || 'your phone'}</Text>
          </Text>

          <Card style={styles.card}>
            <OTPInput value={otp} onChange={setOtp} length={6} />

            <Button
              title="Verify"
              onPress={handleVerify}
              loading={loading}
              disabled={otp.length !== 6}
              style={styles.button}
            />
          </Card>

          <View style={styles.resendContainer}>
            {canResend ? (
              <Button
                title="Resend Code"
                onPress={handleResend}
                variant="outline"
              />
            ) : (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerHighlight}>{timer}s</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  phoneText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  resendContainer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  timerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  timerHighlight: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
