import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Alert, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  currentImage?: string;
  label?: string;
}

export const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  onImageSelected,
  currentImage,
  label = 'Profile Photo',
}) => {
  const [image, setImage] = useState<string | undefined>(currentImage);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!image) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    Animated.loop(
      Animated.timing(borderRotate, {
        toValue: 1,
        duration: 4000,
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
      <TouchableOpacity style={styles.imageWrapper} onPress={showOptions} activeOpacity={0.8}>
        {/* Rotating gradient border */}
        <Animated.View style={[styles.gradientBorder, { transform: [{ rotate: spin }] }]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent, theme.colors.primaryLight, theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Animated.View style={[styles.placeholder, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="heart" size={40} color={theme.colors.accent} />
              <Text style={styles.placeholderText}>Add your photo</Text>
            </Animated.View>
          )}
        </View>

        {/* Edit button */}
        <View style={styles.editButtonWrapper}>
          <LinearGradient
            colors={theme.gradients.primary.colors as [string, string]}
            style={styles.editButton}
          >
            <Ionicons name="camera" size={18} color={theme.colors.white} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientBorder: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  gradientFill: {
    flex: 1,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight + '30',
  },
  placeholderText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  editButtonWrapper: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.glow,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
});
