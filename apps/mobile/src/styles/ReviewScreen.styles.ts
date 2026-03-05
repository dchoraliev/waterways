import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createReviewScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textMuted,
    },
    // ✅ ADD NEW STYLES HERE:
    activeJourneyBanner: {
      backgroundColor: themeColors.primaryDark,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: themeColors.primary,
    },
    activeJourneyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    activeJourneyIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    activeJourneyTextContainer: {
      flex: 1,
    },
    activeJourneyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.textPrimary,
      marginBottom: 4,
    },
    activeJourneySubtitle: {
      fontSize: 13,
      color: themeColors.textMuted,
      lineHeight: 18,
    },
    continueJourneyButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    continueJourneyText: {
      color: themeColors.background,
      fontSize: 15,
      fontWeight: '600',
    },
    // ... rest of your existing styles
    offlineBanner: {
      backgroundColor: themeColors.primarySoft,
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    offlineBannerText: {
      color: themeColors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
    },
    bottomButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    saveDraftButton: {
      flex: 1,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveDraftText: {
      color: themeColors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
    },
  });

const styles = createReviewScreenStyles(colors);

export default styles;
