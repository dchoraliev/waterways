import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createHomeScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    contentWrapper: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 40,
      paddingBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 4,
      textAlign: 'left',
    },
    subtitle: {
      fontSize: 13,
      color: themeColors.textMuted,
      marginBottom: 24,
      textAlign: 'left',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#1D4ED8',
      backgroundColor: themeColors.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
    },
    cardIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardIcon: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    cardTextCol: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
    wakeWordCard: {
      marginTop: 16,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    wakeWordTitle: {
      color: themeColors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    wakeWordSubtitle: {
      color: themeColors.textMuted,
      fontSize: 12,
      marginTop: 6,
    },
    wakeWordStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 8,
    },
    wakeWordBadge: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    wakeWordBadgeOn: {
      backgroundColor: '#22C55E',
    },
    wakeWordBadgeOff: {
      backgroundColor: '#F87171',
    },
    wakeWordBadgePending: {
      backgroundColor: '#FBBF24',
    },
    wakeWordStatusText: {
      color: themeColors.textPrimary,
      fontSize: 12,
    },
    wakeWordHint: {
      color: themeColors.textMuted,
      fontSize: 12,
      marginTop: 8,
    },
    wakeWordControls: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    wakeWordToggle: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    wakeWordToggleOn: {
      backgroundColor: '#DC2626',
    },
    wakeWordToggleOff: {
      backgroundColor: themeColors.primary,
    },
    wakeWordToggleDisabled: {
      opacity: 0.5,
    },
    wakeWordToggleText: {
      color: themeColors.background,
      fontSize: 12,
      fontWeight: '600',
    },
    wakeWordStateText: {
      color: themeColors.textPrimary,
      fontSize: 12,
    },
    wakeWordTranscriptBox: {
      marginTop: 16,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.surface,
    },
    wakeWordTranscriptLabel: {
      color: themeColors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    wakeWordTranscriptText: {
      color: themeColors.textPrimary,
      fontSize: 13,
    },
    wakeWordTranscriptMeta: {
      color: themeColors.textMuted,
      fontSize: 11,
      marginTop: 4,
    },
    wakeWordErrorText: {
      color: '#F87171',
      fontSize: 11,
      marginTop: 6,
    },
    enrollmentCard: {
      marginTop: 16,
      marginBottom: 24,
    },
  });

const styles = createHomeScreenStyles(colors);

export default styles;
