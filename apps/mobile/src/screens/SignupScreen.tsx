import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
