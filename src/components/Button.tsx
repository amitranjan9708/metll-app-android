import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'romantic';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = true,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 40,
    }).start();
  };

  const renderButtonContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.primary : theme.colors.white}
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </View>
  );

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
      case 'romantic':
        return styles.lightText;
      case 'secondary':
        return styles.lightText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.lightText;
    }
  };

  if (variant === 'primary') {
    return (
      <Animated.View style={[
        styles.animatedContainer,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
          style={styles.touchable}
        >
          <LinearGradient
            colors={theme.gradients.primary.colors as [string, string]}
            start={theme.gradients.primary.start}
            end={theme.gradients.primary.end}
            style={[styles.button, styles.primaryButton, disabled && styles.disabled]}
          >
            {renderButtonContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'romantic') {
    return (
      <Animated.View style={[
        styles.animatedContainer,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
          style={styles.touchable}
        >
          <LinearGradient
            colors={theme.gradients.romantic.colors as [string, string]}
            start={theme.gradients.romantic.start}
            end={theme.gradients.romantic.end}
            style={[styles.button, styles.romanticButton, disabled && styles.disabled]}
          >
            {renderButtonContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[
        styles.animatedContainer,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
          style={styles.touchable}
        >
          <View style={[styles.button, styles.secondaryButton, disabled && styles.disabled]}>
            {renderButtonContent()}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.animatedContainer,
      fullWidth && styles.fullWidth,
      { transform: [{ scale: scaleAnim }] },
      style,
    ]}>
      <TouchableOpacity
        style={[styles.button, styles.outlineButton, disabled && styles.disabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {renderButtonContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  animatedContainer: {
    alignSelf: 'stretch',
  },
  fullWidth: {
    width: '100%',
  },
  touchable: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    ...theme.shadows.glow,
  },
  romanticButton: {
    ...theme.shadows.glowAccent,
  },
  secondaryButton: {
    backgroundColor: theme.colors.primaryLight,
    ...theme.shadows.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  lightText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  outlineText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
