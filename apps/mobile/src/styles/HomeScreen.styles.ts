import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
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
    color: '#F9FAFB',
    marginBottom: 4,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'left',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 18,
    color: '#F9FAFB',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  wakeWordCard: {
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0F172A',
    backgroundColor: '#0B1222',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  wakeWordTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  wakeWordSubtitle: {
    color: '#94A3B8',
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
    color: '#E2E8F0',
    fontSize: 12,
  },
  wakeWordHint: {
    color: '#94A3B8',
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
    backgroundColor: '#1D4ED8',
  },
  wakeWordToggleDisabled: {
    opacity: 0.5,
  },
  wakeWordToggleText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  wakeWordStateText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  wakeWordTranscriptBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  wakeWordTranscriptLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  wakeWordTranscriptText: {
    color: '#F8FAFC',
    fontSize: 13,
  },
  wakeWordTranscriptMeta: {
    color: '#94A3B8',
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

export default styles;
