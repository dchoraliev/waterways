import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  headerSection: {
    marginBottom: 24,
  },

  title: {
    fontSize: 22,
    color: '#F9FAFB',
    fontWeight: '600',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // --- NEW STYLES FOR USER INFO BOX ---
  userInfoBox: {
    backgroundColor: '#1E293B', // Slate 800 - a slightly lighter dark background
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155', // Slate 700 for a subtle border
  },
  userInfoTitle: {
    fontSize: 14,
    color: '#94A3B8', // Slate 400
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 18,
    color: '#F8FAFC', // White/Near White
    fontWeight: '600',
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: '#DC2626', // Red 600
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF', // White
    fontSize: 16,
    fontWeight: '600',
  },
  // --- END OF NEW STYLES ---

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 14,
  },

  rowTextCol: {
    flex: 1,
  },

  rowTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },

  rowSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },

  chevron: {
    color: '#64748B',
    fontSize: 22,
    paddingLeft: 10,
  },

  placeholderBox: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
  },

  placeholderText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});

export default styles;
