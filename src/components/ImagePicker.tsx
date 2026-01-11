import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Alert, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  currentImage?: string;
  label?: string;
}

// Modern, soft color palette for the image picker
const PICKER_COLORS = {
  gradientStart: '#667EEA',      // Soft purple-blue
  gradientMiddle: '#9B8FE8',     // Light lavender
  gradientEnd: '#A8E6CF',        // Soft mint green
  accentIcon: '#667EEA',         // Matches gradient start
  placeholderBg: '#F0F4FF',      // Very light blue tint
  editButtonStart: '#667EEA',    // Soft purple
  editButtonEnd: '#764BA2',      // Deeper purple
};

export const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  onImageSelected,
  currentImage,
  label = 'Profile Photo',
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [image, setImage] = useState<string | undefined>(currentImage);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderRotate = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!image) {
      // Gentle pulse animation for empty state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Smooth rotating gradient border
    Animated.loop(
      Animated.timing(borderRotate, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Shimmer effect for visual interest
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [image]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      onImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      onImageSelected(result.assets[0].uri);
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const spin = borderRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity style={styles.imageWrapper} onPress={showOptions} activeOpacity={0.85}>
        {/* Outer glow effect */}
        <View style={styles.outerGlow} />

        {/* Rotating gradient border */}
        <Animated.View style={[styles.gradientBorder, { transform: [{ rotate: spin }] }]}>
          <LinearGradient
            colors={[
              PICKER_COLORS.gradientStart,
              PICKER_COLORS.gradientMiddle,
              PICKER_COLORS.gradientEnd,
              PICKER_COLORS.gradientStart
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        {/* Inner container with image or placeholder */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Animated.View style={[styles.placeholder, { transform: [{ scale: pulseAnim }] }]}>
              {/* Subtle gradient background for empty state */}
              <LinearGradient
                colors={[PICKER_COLORS.placeholderBg, '#FFFFFF']}
                style={styles.placeholderGradient}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="person-add" size={36} color={PICKER_COLORS.accentIcon} />
                </View>
                <Text style={styles.placeholderText}>Add your photo</Text>
                <Text style={styles.placeholderHint}>Tap to select</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        {/* Modern edit button */}
        <View style={styles.editButtonWrapper}>
          <LinearGradient
            colors={[PICKER_COLORS.editButtonStart, PICKER_COLORS.editButtonEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editButton}
          >
            <Ionicons name={image ? "pencil" : "camera"} size={18} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </TouchableOpacity>

      {/* Helper text */}
      {!image && (
        <Text style={styles.helperText}>
          Choose a clear, well-lit photo of yourself
        </Text>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  imageWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  gradientBorder: {
    position: 'absolute',
    width: 175,
    height: 175,
    borderRadius: 87.5,
    overflow: 'hidden',
  },
  gradientFill: {
    flex: 1,
  },
  imageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.backgroundCard,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 80,
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: PICKER_COLORS.accentIcon,
    marginBottom: 4,
  },
  placeholderHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  editButtonWrapper: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  helperText: {
    marginTop: theme.spacing.md,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

