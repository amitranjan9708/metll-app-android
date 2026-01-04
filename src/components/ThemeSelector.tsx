import React, { useState } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useTheme as useThemeHook } from '../theme/useTheme';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: string;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'auto',
    label: 'Auto',
    icon: 'phone-portrait-outline',
    description: 'Follow system theme',
  },
  {
    mode: 'light',
    label: 'Light',
    icon: 'sunny-outline',
    description: 'Light mode',
  },
  {
    mode: 'dark',
    label: 'Dark',
    icon: 'moon-outline',
    description: 'Dark mode',
  },
];

export const ThemeSelector: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const theme = useThemeHook();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectTheme = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    setModalVisible(false);
  };

  const currentOption = THEME_OPTIONS.find((opt) => opt.mode === themeMode);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryLight + '30' }]}>
            <Ionicons name={currentOption?.icon as any} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Theme</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {currentOption?.label}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.backgroundCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Theme</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {THEME_OPTIONS.map((option) => {
              const isSelected = themeMode === option.mode;
              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.optionItem,
                    isSelected && { backgroundColor: theme.colors.primaryLight + '20' },
                  ]}
                  onPress={() => handleSelectTheme(option.mode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconWrapper,
                        { backgroundColor: theme.colors.primaryLight + '30' },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

