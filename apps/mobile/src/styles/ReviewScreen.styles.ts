import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  projectSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  projectDropdown: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#020617',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  projectDropdownText: {
    fontSize: 13,
    color: '#6B7280',
  },
  projectButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    columnGap: 8,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    fontSize: 12,
    color: '#BFDBFE',
  },
  offlineBanner: {
    borderRadius: 10,
    backgroundColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#FEF3C7',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    columnGap: 12,
    marginTop: 8,
  },
  saveDraftButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#020617',
  },
  saveDraftText: {
    fontSize: 13,
    color: '#E5E7EB',
  },
  submitButton: {
    borderRadius: 999,
    paddingHorizontal: 20,
  },
});

export default styles;
