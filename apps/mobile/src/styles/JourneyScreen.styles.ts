import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  endCard: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  endCardInner: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 20,
    height: 20,
    tintColor: '#E5E7EB',
    marginBottom: 6,
  },
  endLabel: {
    fontSize: 13,
    color: '#E5E7EB',
  },
  recentSection: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  recentTitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 10,
  },
  recentPlaceholderCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  recentPlaceholderCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recentPlaceholderIcon: {
    fontSize: 26,
  },
  recentPlaceholderTitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  recentPlaceholderSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default styles;
