import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/ResetPasswordScreen.styles';
import TextInputField from '../components/form/TextInputField';
import PrimaryButton from '../components/form/PrimaryButton';

export interface ResetPasswordScreenProps {
  onSubmitDone: () => void;
  onBackToLogin: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onSubmitDone,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('');

  const canSubmit = email.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // TODO: call real reset-password API
    onSubmitDone();
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.centerWrapper}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we&apos;ll send you reset instructions
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reset password</Text>
            <Text style={styles.cardDescription}>We&apos;ll send a link to your email address</Text>

            <TextInputField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <PrimaryButton
              label="Send reset link"
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={styles.submitButton}
            />

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.footerLink}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
