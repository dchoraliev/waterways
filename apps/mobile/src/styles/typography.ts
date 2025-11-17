import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  headingLg: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  headingMd: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  body: {
    fontSize: 14,
    color: colors.textMuted,
  } as TextStyle,
  label: {
    fontSize: 13,
    color: colors.textMuted,
  } as TextStyle,
};
