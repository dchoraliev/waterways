import { ViewStyle } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

export const screenBackground: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
};

export const cardBase: ViewStyle = {
  borderRadius: 16,
  backgroundColor: colors.surface,
  padding: spacing.lg,
};
