import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#041833',
  },
  content: {
    padding: 16,
  },

  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#cbd5f5',
    fontSize: 16,
    marginBottom: 4,
  },
  timerText: {
    color: 'white',
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
    color: '#94a3b8',
    fontSize: 12,
  },

  // Wake word tooltip
  tooltipBanner: {
    backgroundColor: '#1e3a5f',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  tooltipText: {
    color: '#93c5fd',
    fontSize: 14,
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
    backgroundColor: '#0f766e',
    paddingVertical: 20,
  },
  observationButtonText: {
    color: 'white',
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
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },

  manualObservationCard: {
    backgroundColor: '#0f766e',
  },
  manualObservationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualObservationSubtitle: {
    color: '#d1fae5',
    fontSize: 12,
  },

  // UPDATED: Make camera card MUCH more visible
  cameraCard: {
    backgroundColor: '#7C3AED', // Bright purple
    borderWidth: 2,
    borderColor: '#A78BFA',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  cameraText: {
    color: 'white',
    fontSize: 18, // Larger
    fontWeight: '700', // Bolder
    marginBottom: 4,
  },
  cameraSubtext: {
    color: '#E9D5FF', // Lighter purple
    fontSize: 13,
    fontWeight: '600',
  },

  endJourneyCard: {
    backgroundColor: '#374151',
  },
  endJourneyLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },

  expoWakeWordNotice: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },

  sectionTitle: {
    color: 'white',
    fontSize: 16,
    marginVertical: 12,
  },

  observationItem: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  observationText: {
    color: 'white',
  },
});
