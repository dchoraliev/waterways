import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1E2A3A',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 4,
  },
  chevron: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 22,
    marginLeft: 8,
  },
});
