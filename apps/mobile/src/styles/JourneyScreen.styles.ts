import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createJourneyScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: 16,
    },

    header: {
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      color: themeColors.textMuted,
      fontSize: 16,
      marginBottom: 4,
    },
    timerText: {
      color: themeColors.textPrimary,
      fontSize: 32,
      fontWeight: '600',
    },

    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '600',
    },
    statLabel: {
      color: themeColors.textMuted,
      fontSize: 12,
    },

    // Wake word tooltip
    tooltipBanner: {
      backgroundColor: themeColors.primarySoft,
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderLeftColor: themeColors.primary,
    },
    tooltipText: {
      color: themeColors.primary,
      fontSize: 14,
      textAlign: 'center',
    },

    wakeWordStatusBanner: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    wakeWordStatusText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
    },

    // Recording countdown timer
    recordingCountdownCard: {
      backgroundColor: '#dc2626',
      padding: 24,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#fee2e2',
    },
    recordingCountdownNumber: {
      color: 'white',
      fontSize: 64,
      fontWeight: '700',
      marginBottom: 8,
    },
    recordingCountdownLabel: {
      color: '#fecaca',
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
    },
    recordingCountdownSubtext: {
      color: '#fecaca',
      fontSize: 13,
    },

    // Observation button
    observationButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 20,
    },
    observationButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '700',
    },

    listeningBanner: {
      backgroundColor: '#15803d',
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
    },
    listeningText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    listeningTranscript: {
      color: '#d1fae5',
      fontSize: 12,
      marginTop: 6,
      fontStyle: 'italic',
    },

    card: {
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },

    manualObservationCard: {
      backgroundColor: themeColors.primary,
    },
    manualObservationTitle: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    manualObservationSubtitle: {
      color: '#d1fae5',
      fontSize: 12,
    },

    // Camera card
    cameraCard: {
      backgroundColor: '#7C3AED',
      borderWidth: 2,
      borderColor: '#A78BFA',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    cameraText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    cameraSubtext: {
      color: '#E9D5FF',
      fontSize: 13,
      fontWeight: '600',
    },

    endJourneyCard: {
      backgroundColor: themeColors.surface,
    },
    endJourneyLabel: {
      color: themeColors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },

    expoWakeWordNotice: {
      color: themeColors.textMuted,
      textAlign: 'center',
      fontSize: 13,
      marginBottom: 12,
    },

    sectionTitle: {
      color: themeColors.textPrimary,
      fontSize: 16,
      marginVertical: 12,
    },

    observationItem: {
      backgroundColor: themeColors.surface,
      padding: 14,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    observationText: {
      color: themeColors.textPrimary,
    },
  });

const styles = createJourneyScreenStyles(colors);

export { styles };
