import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    marginRight: 12,
  },
  backButtonText: {
    color: '#e2e8f0',
    fontSize: 18,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  headerTitleMuted: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    alignItems: 'center',
  },
  summaryItem: {
    marginRight: 12,
    marginBottom: 8,
    color: '#e2e8f0',
    fontSize: 13,
  },
  summaryMuted: {
    color: '#94a3b8',
    fontSize: 13,
    marginRight: 12,
    marginBottom: 8,
  },
  summaryTag: {
    backgroundColor: '#0B2F2A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginRight: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTagText: {
    color: '#5EEAD4',
    fontSize: 12,
    lineHeight: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    alignItems: 'center',
  },
  cardMetaText: {
    color: '#94a3b8',
    fontSize: 13,
    marginRight: 12,
    marginBottom: 0,
  },
  description: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 12,
    lineHeight: 14,
  },
});

export default styles;
