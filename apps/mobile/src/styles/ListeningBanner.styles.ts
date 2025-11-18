import { StyleSheet } from 'react-native';
import { spacing } from './spacing';
import { colors } from './colors';
import { typography } from './typography';
import { cardShadow } from './shadows';

export default StyleSheet.create({
  root: {
    backgroundColor: colors.primaryDark, // dark card
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...cardShadow,
  },

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    columnGap: spacing.md,
  },

  icon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    tintColor: colors.primary, // teal accent
  },

  title: {
    ...typography.headingMd,
    color: colors.surface, // white on dark
  },

  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },

  moreButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  moreIcon: {
    width: 22,
    height: 22,
    tintColor: colors.surface,
  },
});
