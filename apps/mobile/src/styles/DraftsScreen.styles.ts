import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
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
    color: '#F9FAFB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#020617',
  },
  closeButtonText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#020617',
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
    color: '#F9FAFB',
  },
  cardStatus: {
    fontSize: 12,
    color: '#FCD34D',
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default styles;
