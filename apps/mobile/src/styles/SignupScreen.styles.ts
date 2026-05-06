import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createSignupScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerWrapper: {
      width: '100%',
      maxWidth: 360,
      paddingHorizontal: 24,
    },
    logoWrapper: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logoImage: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: '#1D4ED8',
      resizeMode: 'contain',
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: themeColors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: themeColors.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#1D4ED8',
      backgroundColor: themeColors.surface,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    cardDescription: {
      marginTop: 4,
      fontSize: 13,
      color: themeColors.textMuted,
    },
    fieldGroup: {
      marginTop: 16,
    },
    label: {
      fontSize: 13,
      color: themeColors.textPrimary,
      marginBottom: 4,
    },
    input: {
      borderRadius: 8,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: themeColors.textPrimary,
    },
    signUpButton: {
      marginTop: 20,
      borderRadius: 8,
      backgroundColor: '#1D4ED8',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    passwordRequirementText: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 16,
      color: themeColors.textMuted,
    },
    passwordRequirementError: {
      color: themeColors.danger,
    },
    passwordRequirementSuccess: {
      color: themeColors.success,
    },
    termsRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkboxButton: {
      marginTop: 2,
      marginRight: 10,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.surface,
    },
    checkboxChecked: {
      backgroundColor: '#1D4ED8',
      borderColor: '#1D4ED8',
    },
    checkboxCheckmark: {
      color: '#F9FAFB',
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 14,
    },
    termsText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: themeColors.textMuted,
    },
    termsLink: {
      color: '#60A5FA',
      textDecorationLine: 'underline',
    },
    signUpButtonDisabled: {
      opacity: 0.6,
    },
    signUpText: {
      color: '#F9FAFB',
      fontSize: 15,
      fontWeight: '600',
    },
    footerRow: {
      marginTop: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerText: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
    footerLink: {
      fontSize: 12,
      color: '#60A5FA',
      marginLeft: 4,
    },
  });

const styles = createSignupScreenStyles(colors);

export default styles;
