import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#020617',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 20,
    color: '#E5F2FF',
  },
  textBlock: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

export default styles;
