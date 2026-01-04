import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'romantic';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  const getCardStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.card, styles.elevated, style];
      case 'romantic':
        return [styles.card, styles.romantic, style];
      default:
        return [styles.card, style];
    }
  };

  return <View style={getCardStyle()}>{children}</View>;
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  elevated: {
    ...theme.shadows.lg,
    borderColor: theme.colors.primaryLight,
  },
  romantic: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
    ...theme.shadows.glowAccent,
  },
});
