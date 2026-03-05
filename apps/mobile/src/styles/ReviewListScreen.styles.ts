import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createReviewListScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
    },
    headerRow: {
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: themeColors.textMuted,
      marginTop: 4,
    },
    closeButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.background,
    },
    closeButtonText: {
      color: themeColors.textPrimary,
      fontSize: 12,
    },
    emptyState: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: 24,
      paddingVertical: 24,
      alignItems: 'center',
    },
    emptyIcon: {
      color: themeColors.textMuted,
      fontSize: 24,
    },
    emptyTitle: {
      color: themeColors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 8,
    },
    emptySubtitle: {
      color: themeColors.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    card: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      marginBottom: 12,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cardContent: {
      flex: 1,
      marginRight: 12,
    },
    cardTitle: {
      color: themeColors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    cardMeta: {
      color: themeColors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    tag: {
      backgroundColor: themeColors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      color: themeColors.primary,
      fontSize: 12,
    },
    tagMuted: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    tagMutedText: {
      color: themeColors.textMuted,
      fontSize: 12,
    },
    chevron: {
      color: themeColors.textMuted,
      fontSize: 18,
    },
  });

const styles = createReviewListScreenStyles(colors);

export default styles;
