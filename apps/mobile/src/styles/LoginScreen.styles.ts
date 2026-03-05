// apps/mobile/src/styles/LoginScreen.styles.ts
import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createLoginScreenStyles = (themeColors: AppColors) =>
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
    forgotRow: {
      marginTop: 8,
      alignItems: 'flex-end',
    },
    forgotText: {
      fontSize: 12,
      color: '#60A5FA',
    },
    signInButton: {
      marginTop: 20,
      borderRadius: 8,
      backgroundColor: '#1D4ED8',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    signInButtonDisabled: {
      opacity: 0.6,
    },
    signInText: {
      color: '#F9FAFB',
      fontSize: 15,
      fontWeight: '600',
    },
    bottomLinksWrapper: {
      marginTop: 16,
      alignItems: 'center',
    },
    signUpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    signUpText: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
    signUpLink: {
      fontSize: 12,
      color: '#60A5FA',
      marginLeft: 4,
    },
    offlineSkipText: {
      fontSize: 11,
      color: themeColors.textMuted,
    },
    offlineSkipLink: {
      textDecorationLine: 'underline',
    },
    sessionOverlay: {
      backgroundColor: themeColors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

const styles = createLoginScreenStyles(colors);

export default styles;
