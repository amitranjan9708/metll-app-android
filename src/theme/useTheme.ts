import { useTheme as useThemeContext } from '../context/ThemeContext';
import { gradients } from './gradients';
import { gradientsDark } from './gradientsDark';
import { typography } from './typography';

/**
 * Hook to get theme with gradients and all theme properties
 * Use this instead of importing theme directly to get dynamic theme values
 */
export const useTheme = () => {
  const { colors, isDark } = useThemeContext();
  const themeGradients = isDark ? gradientsDark : gradients;

  return {
    colors,
    isDark,
    gradients: themeGradients,
    typography,
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
        shadowColor: isDark ? '#000000' : '#5A6FA3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      md: {
        shadowColor: isDark ? '#000000' : '#5A6FA3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 8,
        elevation: 4,
      },
      lg: {
        shadowColor: isDark ? '#000000' : '#5A6FA3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
      glow: {
        shadowColor: isDark ? colors.primary : '#5A6FA3',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isDark ? 0.5 : 0.4,
        shadowRadius: 16,
        elevation: 8,
      },
      glowAccent: {
        shadowColor: isDark ? colors.accent : '#E8A4B8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isDark ? 0.4 : 0.35,
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
};

