import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface TextInputFieldProps extends TextInputProps {
  label?: string;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  errorText,
  containerStyle,
  style,
  ...inputProps
}) => {
  const { colors, mode } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: 16,
        },
        label: {
          fontSize: 13,
          color: colors.textPrimary,
          marginBottom: 4,
        },
        input: {
          borderRadius: 8,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: colors.textPrimary,
        },
        errorText: {
          marginTop: 4,
          fontSize: 11,
          color: colors.danger,
        },
      }),
    [colors]
  );

  const showError = Boolean(errorText);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.textPrimary}
        cursorColor={colors.textPrimary}
        keyboardAppearance={mode === 'dark' ? 'dark' : 'light'}
        {...inputProps}
      />

      {showError ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

export default TextInputField;
