import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
} from 'react-native';
import { theme } from '../theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const scaleAnims = useRef(Array.from({ length }, () => new Animated.Value(1))).current;

  useEffect(() => {
    if (focusedIndex !== null) {
      Animated.spring(scaleAnims[focusedIndex], {
        toValue: 1.1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

      scaleAnims.forEach((anim, i) => {
        if (i !== focusedIndex) {
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }).start();
        }
      });
    } else {
      scaleAnims.forEach((anim) => {
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [focusedIndex]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');
    newValue[index] = text;
    const joined = newValue.join('');
    onChange(joined);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const isFilled = !!value[index];

        return (
          <Animated.View
            key={index}
            style={[
              styles.inputWrapper,
              {
                transform: [{ scale: scaleAnims[index] }],
              },
            ]}
          >
            <TextInput
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.input,
                isFilled && styles.inputFilled,
                isFocused && styles.inputFocused,
              ]}
              value={value[index] || ''}
              onChangeText={(text) => handleChange(text.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              selectionColor={theme.colors.primary}
            />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  inputWrapper: {
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
});
