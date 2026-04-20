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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn } from '@waterways/shared/src/supabase/auth';
import { createLoginScreenStyles } from '../styles/LoginScreen.styles';
import TextInputField from '../components/form/TextInputField';
import PrimaryButton from '../components/form/PrimaryButton';
import waterwaysLogo from '../../assets/logo/waterways-logo.png';
import { updateAndSyncOfflineDataToCurrentUser } from '../services/OfflineService';
import { performAutoSyncTaskOnce } from '../services/NetworkService';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createLoginScreenStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSignIn = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { data, error } = await signIn(email.trim(), password);

      if (error) {
        Alert.alert('Login Failed', error.message);
      } else if (data.session) {
        console.log('Login successful! User ID:', data.user?.id);
        onLoginSuccess();
        await updateAndSyncOfflineDataToCurrentUser();
        performAutoSyncTaskOnce();
      }
    } catch (_error) {
      console.error('Login error:', _error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOffline = () => {
    onLoginSuccess();
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // use height behavior on Android so the content is padded rather than
        // resized; avoiding a layout jump when the keyboard appears
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            // drop the centered justification. we add some top padding so the
            // titles appear roughly centered initially, but they won't move
            // around when the keyboard opens (that caused the weird jump).
            paddingTop: 80,
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
              label={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleSignIn}
              disabled={!canSubmit || loading}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
