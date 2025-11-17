// apps/mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/LoginScreen.styles';

export interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleSignIn = () => {
    if (!canSubmit) return;
    // TODO: integrate real auth; for now just go to home
    onLoginSuccess();
  };

  const handleForgotPassword = () => {
    // TODO: navigate to forgot-password screen
    console.log('Forgot password pressed');
  };

  const handleSignUp = () => {
    // TODO: navigate to sign-up screen
    console.log('Sign up pressed');
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
              {/* simple emoji placeholder for waves icon */}
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
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#6C727F"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6C727F"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Forgot password */}
            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.signInButton, !canSubmit && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={!canSubmit}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>

            {/* Bottom links */}
            <View style={styles.bottomLinksWrapper}>
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don&apos;t have an account?</Text>
                <TouchableOpacity onPress={handleSignUp}>
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
