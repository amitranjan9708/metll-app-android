import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface VerificationBadgeProps {
  size?: number;
  style?: any;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  size = 24, 
  style 
}) => {
  const theme = useTheme();
  const styles = getStyles(theme, size);

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#007AFF', '#0051D5']}
        style={styles.badge}
      >
        <Ionicons name="checkmark" size={size * 0.6} color={theme.colors.white} />
      </LinearGradient>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>, size: number) => StyleSheet.create({
  container: {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
});
