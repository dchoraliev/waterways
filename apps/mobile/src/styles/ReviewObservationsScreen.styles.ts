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
    projectInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    projectInfoBox: {
      flex: 1,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginRight: 10,
    },
    projectInfoLabel: {
      color: themeColors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 4,
    },
    projectInfoValue: {
      color: themeColors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    projectInfoSubtext: {
      color: themeColors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    changeProjectButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    changeProjectButtonDisabled: {
      opacity: 0.7,
    },
    changeProjectButtonText: {
      color: themeColors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    projectModalContent: {
      width: '100%',
      maxHeight: '70%',
      backgroundColor: themeColors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    modalTitle: {
      color: themeColors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
    },
    modalSubtitle: {
      color: themeColors.textMuted,
      fontSize: 13,
      marginBottom: 16,
    },
    projectListContent: {
      paddingBottom: 8,
    },
    projectOptionCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: 14,
      marginBottom: 10,
    },
    projectOptionCardSelected: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primarySoft,
    },
    projectOptionTitle: {
      color: themeColors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    projectOptionSubtitle: {
      color: themeColors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    projectModalCloseButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 8,
    },
    projectModalCloseButtonText: {
      color: themeColors.textMuted,
      fontWeight: '600',
    },
  });

const styles = createReviewObservationsScreenStyles(colors);

export default styles;
