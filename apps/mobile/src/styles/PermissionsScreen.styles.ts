import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createPermissionsScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    header: {
      marginTop: 16,
      marginBottom: 16,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.primarySoft,
      marginBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 4,
      color: themeColors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textMuted,
    },
    card: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 8,
    },
    cardIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.primarySoft,
      marginRight: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    cardDescription: {
      fontSize: 13,
      color: themeColors.textMuted,
      marginTop: 2,
    },
    cardBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      justifyContent: 'space-between',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicatorText: {
      fontSize: 13,
      marginLeft: 6,
      color: themeColors.textPrimary,
    },
    actionButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: themeColors.primarySoft,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: themeColors.textPrimary,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    badgeGranted: {
      backgroundColor: '#dcfce7',
    },
    badgeDenied: {
      backgroundColor: '#fee2e2',
    },
    badgeNeutral: {
      backgroundColor: themeColors.border,
    },
    footer: {
      marginTop: 16,
    },
    footerText: {
      fontSize: 12,
      color: themeColors.textMuted,
      marginBottom: 12,
    },
    primaryButton: {
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.primary,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 15,
    },
  });

const styles = createPermissionsScreenStyles(colors);

export default styles;
