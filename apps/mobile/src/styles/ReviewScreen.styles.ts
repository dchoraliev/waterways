import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111827',
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
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  // ✅ ADD NEW STYLES HERE:
  activeJourneyBanner: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeJourneySubtitle: {
    fontSize: 13,
    color: '#BFDBFE',
    lineHeight: 18,
  },
  continueJourneyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  continueJourneyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // ... rest of your existing styles
  offlineBanner: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineBannerText: {
    color: '#D1D5DB',
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
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveDraftText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
  },
});
