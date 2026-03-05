import { StyleSheet } from 'react-native';
import type { AppColors } from './colors';

export const createTripRecoveryModalStyles = (themeColors: AppColors) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: themeColors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: themeColors.overlay,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      alignItems: 'center',
      marginBottom: 16,
    },
    icon: {
      fontSize: 48,
      marginBottom: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.textPrimary,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: themeColors.textMuted,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    infoCard: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: themeColors.textMuted,
    },
    infoValue: {
      fontSize: 14,
      color: themeColors.textPrimary,
      fontWeight: '600',
    },
    warning: {
      backgroundColor: themeColors.primarySoft,
      borderWidth: 1,
      borderColor: themeColors.primary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    warningText: {
      fontSize: 12,
      color: themeColors.textPrimary,
      lineHeight: 16,
    },
    actions: {
      gap: 12,
      marginBottom: 16,
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonPressed: {
      opacity: 0.8,
    },
    resumeButton: {
      backgroundColor: themeColors.primary,
    },
    resumeButtonText: {
      color: themeColors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    discardButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.danger,
    },
    discardButtonText: {
      color: themeColors.danger,
      fontSize: 16,
      fontWeight: '600',
    },
    infoText: {
      fontSize: 12,
      color: themeColors.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
};
