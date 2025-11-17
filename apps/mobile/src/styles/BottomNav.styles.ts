import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
  tabLabelActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  tabLabelInactive: {
    color: '#6B7280',
  },
  tabIconActive: {
    color: '#1D4ED8',
  },
  tabIconInactive: {
    color: '#6B7280',
  },
});

export default styles;
