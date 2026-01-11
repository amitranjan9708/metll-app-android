import { useFonts } from 'expo-font';

export const useAppFonts = () => {
  // Try to load custom font if it exists, otherwise use system font
  const [fontsLoaded, error] = useFonts({
    'Novaklasse-Semibold': require('../../assets/novaklasse-semibold.otf'),
  });

  // If font loading fails, log error but don't crash the app
  if (error) {
    console.warn('Font loading error:', error);
  }

  // Return true if fonts are loaded OR if there was an error (fallback to system font)
  return fontsLoaded || error !== null;
};

export const fontFamily = {
  novaklasse: 'Novaklasse-Semibold',
  system: 'System',
};

