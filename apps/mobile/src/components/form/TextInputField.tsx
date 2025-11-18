import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

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
  const showError = Boolean(errorText);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput style={[styles.input, style]} placeholderTextColor="#6C727F" {...inputProps} />

      {showError ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F9FAFB',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#F97373',
  },
});

export default TextInputField;
