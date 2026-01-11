import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { OTPInput } from '../components/OTPInput';
import { authApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type Step = 'phone' | 'otp' | 'newPassword';

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const normalizePhoneNumber = (phoneNum: string): string => {
    let cleaned = phoneNum.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return `+91${cleaned}`;
  };

  const handleRequestOTP = async () => {
    const cleanedPhone = phone.replace(/[^\d]/g, '');
    if (!cleanedPhone || cleanedPhone.length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phone.trim());
      const response = await authApi.requestPasswordReset(normalizedPhone);
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to send OTP');
        return;
      }

      setTimer(30);
      setStep('otp');
      Alert.alert('Success', 'OTP sent to your phone number');
    } catch (error: any) {
      console.error('Request OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Required', 'Please enter the 6-digit OTP');
      return;
    }
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Required', 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phone.trim());
      const response = await authApi.resetPassword(normalizedPhone, otp, newPassword);
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to reset password');
        return;
      }

      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    await handleRequestOTP();
  };

  const getTitle = () => {
    switch (step) {
      case 'phone': return 'Forgot Password';
      case 'otp': return 'Verify OTP';
      case 'newPassword': return 'New Password';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'phone': return 'Enter your phone number to receive a verification code';
      case 'otp': return `Enter the 6-digit code sent to +91${phone}`;
      case 'newPassword': return 'Create a new password for your account';
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => step === 'phone' ? navigation.goBack() : setStep(step === 'newPassword' ? 'otp' : 'phone')}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

            {/* Step: Phone */}
            {step === 'phone' && (
              <View style={styles.form}>
                <Input
                  label="Phone number (India +91)"
                  placeholder="9876543210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Button
                  title="Send OTP"
                  onPress={handleRequestOTP}
                  loading={loading}
                  style={styles.button}
                />
              </View>
            )}

            {/* Step: OTP */}
            {step === 'otp' && (
              <View style={styles.form}>
                <View style={styles.otpContainer}>
                  <OTPInput value={otp} onChange={setOtp} length={6} />
                </View>
                
                <Button
                  title="Verify OTP"
                  onPress={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length !== 6}
                  style={styles.button}
                />

                <View style={styles.resendContainer}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Step: New Password */}
            {step === 'newPassword' && (
              <View style={styles.form}>
                <Input
                  label="New Password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Button
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.button}
                />
              </View>
            )}
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B6B6B',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  otpContainer: {
    marginBottom: 24,
  },
  button: {
    marginTop: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  resendLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
});

