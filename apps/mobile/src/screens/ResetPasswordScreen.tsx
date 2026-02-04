import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  sendResetPasswordEmail,
  verifyResetPasswordOtp,
  resetPassword,
} from '@shared/supabase/auth';
import styles from '../styles/ResetPasswordScreen.styles';
import TextInputField from '../components/form/TextInputField';
import PrimaryButton from '../components/form/PrimaryButton';
import waterwaysLogo from '../../assets/logo/Waterways Logo.png';

export interface ResetPasswordScreenProps {
  onPasswordChange: () => void;
  onBackToLogin: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onPasswordChange,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showChangePass, setShowChangePass] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const canSubmitEmail = email.trim().length > 0;
  const canSubmitOtp = otp.trim().length === 6;
  const canSubmitPassword = password.trim().length >= 6 && password.trim() === confirm.trim();

  // Send email
  const handleSendEmail = async () => {
    // Validate the email before API call
    if (email.trim().length <= 4) {
      console.warn('Invalid email value');
      return;
    }

    try {
      // API call to send email
      console.log('Sending verification PIN to ', email, ' to Reset Password...');
      const { data, error } = await sendResetPasswordEmail(email);
      if (data) {
        console.log('Email sent');
        setShowOtpField(true);
      } else {
        console.error('Email send error:', error);
      }
    } catch (err) {
      console.error('Email send error:', err);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    try {
      // API call to verify the OTP for recovery
      console.log('Verifying OTP...');
      const { data, error } = await verifyResetPasswordOtp(email, otp);
      if (data) {
        console.log('OTP Verified');
        setShowChangePass(true);
      } else {
        console.error('OTP Verification error:', error);
      }
    } catch (err) {
      console.error('OTP Verification error:', err);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    // Validate the passwords before API call
    if (password !== confirm) {
      console.warn('Passwords do not match.');
      return;
    }

    try {
      // API call to reset the password after OTP verification
      console.log('Resetting password...');
      const { data, error } = await resetPassword(password);
      if (data) {
        console.log('Password Reset Successfully');
        onPasswordChange();
      } else {
        console.error('Reset password error:', error);
      }
    } catch (err) {
      console.error('Reset password error:', err);
    }
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
            <Image source={waterwaysLogo} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Verify your email to change your password</Text>

          {/* ================================================== */}
          {/* EMAIL + OTP IN THE SAME EXACT CARD VIEW            */}
          {/* ================================================== */}
          {!showChangePass && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verify Email</Text>
              <Text style={styles.cardDescription}>
                Enter your email and we’ll send you a verification code.
              </Text>

              {/* EMAIL INPUT */}
              <TextInputField
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* SEND CODE BUTTON (HIDDEN AFTER PRESS) */}
              {!showOtpField && (
                <PrimaryButton
                  label="Send Code"
                  onPress={handleSendEmail}
                  disabled={!canSubmitEmail}
                  style={styles.submitButton}
                />
              )}

              {/* OTP FIELD + VERIFY BUTTON (SHOWS AFTER SEND) */}
              {showOtpField && (
                <>
                  <TextInputField
                    label="Verification Code"
                    placeholder="123456"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                  />

                  <PrimaryButton
                    label="Verify Code"
                    onPress={handleVerifyOtp}
                    disabled={!canSubmitOtp}
                    style={styles.submitButton}
                  />

                  <TouchableOpacity onPress={handleSendEmail}>
                    <Text style={styles.footerLink}>Resend Code</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.footerRow}>
                <TouchableOpacity onPress={onBackToLogin}>
                  <Text style={styles.footerLink}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================================================== */}
          {/* PASSWORD RESET VIEW — SAME CARD SIZE / STYLE       */}
          {/* ================================================== */}
          {showChangePass && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Set New Password</Text>
              <Text style={styles.cardDescription}>Enter your new password below.</Text>

              <TextInputField
                label="New Password"
                placeholder="******"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TextInputField
                label="Confirm Password"
                placeholder="******"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />

              <PrimaryButton
                label="Reset Password"
                onPress={handleResetPassword}
                disabled={!canSubmitPassword}
                style={styles.submitButton}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
