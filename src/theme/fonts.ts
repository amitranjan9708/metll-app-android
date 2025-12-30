import { useFonts } from 'expo-font';

export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    'Novaklasse-Semibold': require('../../assets/novaklasse-semibold.otf'),
  });

  return fontsLoaded;
};

export const fontFamily = {
  novaklasse: 'Novaklasse-Semibold',
  system: 'System',
};

