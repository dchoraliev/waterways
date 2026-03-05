import React, { useMemo, useState } from 'react';
import { View, Text, KeyboardAvoidingView, TouchableOpacity, Image } from 'react-native';
import { signUp } from '@waterways/shared/src/supabase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createSignupScreenStyles } from '../styles/SignupScreen.styles';
import TextInputField from '../components/form/TextInputField';
import PrimaryButton from '../components/form/PrimaryButton';
import waterwaysLogo from '../../assets/logo/waterways-logo.png';
import { useTheme } from '../contexts/ThemeContext';

export interface SignupScreenProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
}

// Helper function to parse full name into first and last name
const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(/\s+/); // Split by whitespace

  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else {
    // First part is first name, everything else is last name
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    return { firstName, lastName };
  }
};

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onBackToLogin }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createSignupScreenStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 4 &&
    password === confirm;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const { firstName, lastName } = parseFullName(name);

    const { error } = await signUp(email, password, firstName, lastName);
    if (error) {
      console.log('Error singing up:', error);
      return;
    }
    console.log('Sign up successful:');
    onSignupSuccess();
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root}>
        <View style={styles.centerWrapper}>
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
              value={password}
              onChangeText={setPassword}
            />

            <TextInputField
              label="Confirm password"
              placeholder="••••••••"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />

            <PrimaryButton
              label="Create account"
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={styles.signUpButton}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
