import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Button } from '../components/Button';
import { OTPInput } from '../components/OTPInput';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export const OTPScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const user = (route.params as any)?.user;
  
  // Debug: Log user data
  useEffect(() => {
    console.log('OTPScreen user data:', user);
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
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
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerify = async () => {
    console.log('handleVerify called, OTP:', otp, 'Length:', otp.length);
    
    // Validate OTP - check length and ensure all digits are filled
    const cleanOtp = otp.replace(/\s/g, '');
    if (cleanOtp.length !== 6) {
      Alert.alert('Invalid', 'Please enter a valid 6-digit code');
      return;
    }

    // Validate user data exists
    if (!user || !user.name || !user.phone) {
      Alert.alert('Error', 'User data is missing. Please go back and try again.');
      return;
    }

    setLoading(true);
    try {
      // Call backend to verify OTP and get auth token
      const response = await authApi.verifyOtp(user.phone, cleanOtp);
      
      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Verification failed');
        return;
      }

      // Backend may return full user profile with all fields
      const backendUser = response.data.user as any;
      console.log('📱 Backend user data after OTP:', backendUser);

      // Check if user has completed onboarding based on backend data
      // User is onboarded if they have situationResponses OR a profile photo
      // Note: isVerified means phone verified, NOT onboarding complete - don't use it here!
      const hasCompletedOnboarding = !!(
        (backendUser.situationResponses && backendUser.situationResponses.length > 0) ||
        backendUser.photo
      );

      console.log('📱 User onboarding status:', hasCompletedOnboarding);

      // Save ALL user data from backend + set isOnboarded flag
      const userData = {
        id: backendUser.id?.toString() || '',
        name: backendUser.name || user.name,
        email: backendUser.email || user.email || '',
        phone: backendUser.phone || user.phone,
        photo: backendUser.photo,
        additionalPhotos: backendUser.additionalPhotos,
        verificationVideo: backendUser.verificationVideo,
        school: backendUser.school,
        college: backendUser.college,
        office: backendUser.office,
        homeLocation: backendUser.homeLocation,
        situationResponses: backendUser.situationResponses,
        isOnboarded: hasCompletedOnboarding, // Set based on backend data
        createdAt: backendUser.createdAt || new Date().toISOString(),
      };
      
      await login(userData);
      // Navigation will happen automatically due to auth state change
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    Alert.alert('Sent', 'A new code has been sent to your phone.');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.content,
            {
              paddingTop: insets.top + 80,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneText}>{user?.phone || 'your phone'}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <OTPInput value={otp} onChange={setOtp} length={6} />
          </View>

          {/* Verify Button */}
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.replace(/\s/g, '').length !== 6}
            style={styles.button}
          />

          {/* Resend */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend in <Text style={styles.timerHighlight}>{timer}s</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B6B6B',
    lineHeight: 26,
  },
  phoneText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  otpContainer: {
    marginBottom: 32,
  },
  button: {
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  timerHighlight: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 15,
    color: '#E07A5F',
    fontWeight: '600',
  },
});
