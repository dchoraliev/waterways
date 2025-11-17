// apps/mobile/src/styles/LoginScreen.styles.ts
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617', // very dark background
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1D4ED8', // blue
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 28,
    color: '#E5F2FF',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#F9FAFB',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
  },
  fieldGroup: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F9FAFB',
  },
  forgotRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    color: '#60A5FA',
  },
  signInButton: {
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomLinksWrapper: {
    marginTop: 16,
    alignItems: 'center',
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signUpText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  signUpLink: {
    fontSize: 12,
    color: '#60A5FA',
    marginLeft: 4,
  },
  offlineSkipText: {
    fontSize: 11,
    color: '#6B7280',
  },
  offlineSkipLink: {
    textDecorationLine: 'underline',
  },
});

export default styles;
