import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617', // same dark as login
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  welcomeBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#020617',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconCirclePrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconCircleSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIcon: {
    fontSize: 20,
    color: '#E5F2FF',
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default styles;
