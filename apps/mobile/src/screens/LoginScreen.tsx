import React, { useState } from 'react';
import { signIn } from '@waterways/shared/src/supabase/auth';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/LoginScreen.styles';
import TextInputField from '../components/form/TextInputField';
import PrimaryButton from '../components/form/PrimaryButton';
import { initializeDatabase } from '../database/db';
import { error } from 'console';

export interface LoginScreenProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onForgotPassword,
  onSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleSignIn = async () => {
    if (!canSubmit) return;

    const { data, error } = await signIn(email, password);
    if (error) {
      console.log('Error signing in:', error);
      return;
    }
    onLoginSuccess();
  };

  const handleSkipOffline = () => {
    // For offline mode we likely still want to go to Home
    onLoginSuccess();
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.centerWrapper}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              {/* placeholder for actual logo icon */}
              <Text style={styles.logoIcon}>🌊</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome to WaDE</Text>
          <Text style={styles.subtitle}>Waterway Delta Explorer</Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardDescription}>
              Enter your credentials to access your account
            </Text>

            {/* Email */}
            <TextInputField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Password */}
            <TextInputField
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Forgot password */}
            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={onForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In */}
            <PrimaryButton
              label="Sign In"
              onPress={handleSignIn}
              disabled={!canSubmit}
              style={styles.signInButton}
            />

            {/* Bottom links */}
            <View style={styles.bottomLinksWrapper}>
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don&apos;t have an account?</Text>
                <TouchableOpacity onPress={onSignUp}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSkipOffline}>
                <Text style={styles.offlineSkipText}>
                  No Internet? <Text style={styles.offlineSkipLink}>skip for now</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
