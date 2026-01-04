import { colors } from './colors';
import { colorsDark } from './colorsDark';
import { typography } from './typography';
import { gradients } from './gradients';
import { gradientsDark } from './gradientsDark';

// Default export (will be overridden by ThemeContext in components)
export const theme = {
  colors,
  colorsDark,
  typography,
  gradients,
  gradientsDark,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#5A6FA3',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#5A6FA3',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#5A6FA3',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#5A6FA3',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glowAccent: {
      shadowColor: '#E8A4B8',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
  },
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      friction: 7,
      tension: 40,
    },
  },
};

export type Theme = typeof theme;
