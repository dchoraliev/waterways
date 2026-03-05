import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createReviewObservationsScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.surface,
      marginRight: 12,
    },
    backButtonText: {
      color: themeColors.textPrimary,
      fontSize: 18,
    },
    headerTitle: {
      color: themeColors.textPrimary,
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
    },
    headerTitleMuted: {
      color: themeColors.textMuted,
      fontSize: 20,
      fontWeight: '600',
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      alignItems: 'center',
    },
    summaryItem: {
      marginRight: 12,
      marginBottom: 8,
      color: themeColors.textPrimary,
      fontSize: 13,
    },
    summaryMuted: {
      color: themeColors.textMuted,
      fontSize: 13,
      marginRight: 12,
      marginBottom: 8,
    },
    summaryTag: {
      backgroundColor: themeColors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      marginRight: 12,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTagText: {
      color: themeColors.primary,
      fontSize: 12,
      lineHeight: 14,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      paddingTop: 16,
    },
    sectionTitle: {
      color: themeColors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    emptyState: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      color: themeColors.textMuted,
      fontSize: 14,
    },
    card: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      marginBottom: 12,
    },
    cardMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
      alignItems: 'center',
    },
    cardMetaText: {
      color: themeColors.textMuted,
      fontSize: 13,
      marginRight: 12,
      marginBottom: 0,
    },
    description: {
      color: themeColors.textPrimary,
      fontSize: 14,
      lineHeight: 20,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagText: {
      fontSize: 12,
      lineHeight: 14,
    },
  });

const styles = createReviewObservationsScreenStyles(colors);

export default styles;
