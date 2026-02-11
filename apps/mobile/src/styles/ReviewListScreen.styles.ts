import { StyleSheet } from 'react-native';
import { classifierTagPalette } from './colors';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
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
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    color: '#94a3b8',
    fontSize: 24,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#0B2F2A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#5EEAD4',
    fontSize: 12,
  },
  tagMuted: {
    backgroundColor: classifierTagPalette.default.bg,
  },
  tagMutedText: {
    color: classifierTagPalette.default.text,
    fontSize: 12,
  },
  chevron: {
    color: '#94a3b8',
    fontSize: 18,
  },
});

export default styles;
