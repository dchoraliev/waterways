import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createDraftsScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
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
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: themeColors.textMuted,
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
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 12,
      color: themeColors.textMuted,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: 16,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 12,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    cardStatus: {
      fontSize: 12,
      color: themeColors.primary,
    },
    cardMeta: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
  });

const styles = createDraftsScreenStyles(colors);

export default styles;
