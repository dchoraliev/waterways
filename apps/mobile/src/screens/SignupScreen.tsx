import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { signUp } from '@waterways/shared/src/supabase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createSignupScreenStyles } from '../styles/SignupScreen.styles';
import TextInputField from '../components/form/TextInputField';
import PrimaryButton from '../components/form/PrimaryButton';
import waterwaysLogo from '../../assets/logo/waterways-logo.png';
import { useTheme } from '../contexts/ThemeContext';
import { LEGAL_DOCUMENTS_URL } from '../constants/legal';

export interface SignupScreenProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
}

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_REQUIREMENT_MESSAGE =
  'Use at least 6 characters, including 1 uppercase letter, 1 number, and 1 symbol.';

const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(/\s+/);

  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else {
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    return { firstName, lastName };
  }
};

const getMissingPasswordRequirements = (password: string): string[] => {
  const missing: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    missing.push('6+ characters');
  }
  if (!/[A-Z]/.test(password)) {
    missing.push('uppercase letter');
  }
  if (!/\d/.test(password)) {
    missing.push('number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    missing.push('symbol');
  }

  return missing;
};

const formatSignupErrorMessage = (rawMessage: string): string => {
  const normalized = rawMessage.trim();
  const message = normalized.toLowerCase();

  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in or resetting your password.';
  }

  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (message.includes('signup is disabled')) {
    return 'Sign up is currently unavailable. Please try again later.';
  }

  if (message.includes('rate') || message.includes('too many requests')) {
    return 'Too many signup attempts. Please wait a few minutes and try again.';
  }

  if (message.includes('password')) {
    return `Password requirements were not met. ${PASSWORD_REQUIREMENT_MESSAGE}`;
  }

  return normalized || 'Unable to create account. Please try again.';
};

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onBackToLogin }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createSignupScreenStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const missingPasswordRequirements = getMissingPasswordRequirements(password);
  const hasPassword = password.length > 0;
  const passwordIsValid = hasPassword && missingPasswordRequirements.length === 0;
  const passwordHelpText = hasPassword
    ? passwordIsValid
      ? 'Password meets all requirements.'
      : `Missing: ${missingPasswordRequirements.join(', ')}.`
    : PASSWORD_REQUIREMENT_MESSAGE;

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordIsValid &&
    password === confirm &&
    acceptedTerms;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { firstName, lastName } = parseFullName(name);
      const { error } = await signUp(email, password, firstName, lastName);
      if (error) {
        Alert.alert('Sign Up Failed', formatSignupErrorMessage(error.message ?? ''));
        return;
      }

      onSignupSuccess();
    } catch (error) {
      Alert.alert(
        'Sign Up Failed',
        formatSignupErrorMessage(error instanceof Error ? error.message : '')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 80, // fixed top padding keeps header stable when keyboard
            // opens instead of re-centering everything
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image source={waterwaysLogo} style={styles.logoImage} />
          </View>

          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>Sign up to start using WaDE</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign Up</Text>
            <Text style={styles.cardDescription}>Fill out your information to get started</Text>

            <TextInputField
              label="Full name"
              placeholder="Jane Doe"
              value={name}
              onChangeText={setName}
            />

            <TextInputField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInputField
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
              value={password}
              onChangeText={setPassword}
            />
            <Text
              style={[
                styles.passwordRequirementText,
                hasPassword
                  ? passwordIsValid
                    ? styles.passwordRequirementSuccess
                    : styles.passwordRequirementError
                  : undefined,
              ]}
            >
              {passwordHelpText}
            </Text>

            <TextInputField
              label="Confirm password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
              value={confirm}
              onChangeText={setConfirm}
              errorText={
                confirm.length > 0 && confirm !== password ? 'Passwords do not match.' : undefined
              }
            />

            <View style={styles.termsRow}>
              <TouchableOpacity
                onPress={() => setAcceptedTerms((current) => !current)}
                style={styles.checkboxButton}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms ? <Text style={styles.checkboxCheckmark}>✓</Text> : null}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => Linking.openURL(LEGAL_DOCUMENTS_URL)}>
                  Legal Terms
                </Text>
              </Text>
            </View>

            <PrimaryButton
              label={loading ? 'Creating account...' : 'Create account'}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              style={styles.signUpButton}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
