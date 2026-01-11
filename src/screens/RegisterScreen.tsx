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
import { User } from '../types';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { login: authLogin } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Normalize phone number to E.164 format with Indian country code
  const normalizePhoneNumber = (phoneNum: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phoneNum.replace(/[^\d+]/g, '');
    
    // If already has country code, return as-is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // If starts with 0, remove it (local format)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add Indian country code
    return `+91${cleaned}`;
  };

  const validateForm = () => {
    const cleanedPhone = phone.replace(/[^\d]/g, '');
    if (!cleanedPhone || cleanedPhone.length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (!password || password.length < 8) {
      Alert.alert('Required', 'Password must be at least 8 characters');
      return false;
    }

    // Only require name for registration
    if (!isLoginMode && !name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phone.trim());
      console.log('Logging in with phone:', normalizedPhone);
      
      const response = await authApi.login(normalizedPhone, password);
      
      if (!response.success || !response.data) {
        Alert.alert('Error', response.message || 'Login failed');
        return;
      }

      // Backend may return full user profile with all fields
      const backendUser = response.data.user as any;
      console.log('📱 Backend user data:', backendUser);

      // Check if user has completed onboarding based on backend data
      // User is onboarded if they have situationResponses AND a profile photo
      // Note: isVerified means phone verified, NOT onboarding complete
      const hasCompletedOnboarding = !!(
        (backendUser.situationResponses && backendUser.situationResponses.length > 0) &&
        backendUser.photo
      );

      console.log('📱 User onboarding status:', hasCompletedOnboarding);

      // Save ALL user data from backend + set isOnboarded flag
      const userData = {
        id: backendUser.id?.toString() || '',
        name: backendUser.name || '',
        email: backendUser.email || '',
        phone: backendUser.phone || normalizedPhone,
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
      
      await authLogin(userData);
      // Navigation will happen automatically due to auth state change
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Normalize phone number with +91 country code
      const normalizedPhone = normalizePhoneNumber(phone.trim());
      console.log('Registering with phone:', normalizedPhone);
      
      // Call backend to register and send OTP
      const response = await authApi.register(name.trim(), normalizedPhone, password);
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'Registration failed');
        return;
      }

      // Pass user data to OTP screen
      const user: Partial<User> = {
        name: name.trim(),
        email: email.trim(),
        phone: normalizedPhone,
      };
      navigation.navigate('OTP', { user });
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLoginMode) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isLoginMode ? 'Welcome back' : 'Create your account'}
              </Text>
              <Text style={styles.subtitle}>
                {isLoginMode 
                  ? 'Sign in to continue' 
                  : 'Join thousands finding meaningful connections'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {!isLoginMode && (
                <>
                  <Input
                    label="Full name"
                    placeholder="Your name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />

                  <Input
                    label="Email (optional)"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              )}

              <Input
                label="Phone number (India +91)"
                placeholder="9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Input
                label="Password"
                placeholder={isLoginMode ? 'Enter your password' : 'Minimum 8 characters'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              {isLoginMode && (
                <TouchableOpacity 
                  style={styles.forgotPasswordContainer}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <Button
                title={isLoginMode ? 'Sign In' : 'Continue'}
                onPress={handleSubmit}
                loading={loading}
                style={styles.button}
              />
            </View>

            {/* Toggle Login/Register */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
                <Text style={styles.toggleLink}>
                  {isLoginMode ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
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
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 48,
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
  button: {
    marginTop: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleText: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  toggleLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  footerText: {
    fontSize: 13,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
