import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createTopAppBarStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      backgroundColor: themeColors.background,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoImage: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: themeColors.primary,
      resizeMode: 'contain',
    },
    textBlock: {
      flexDirection: 'column',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    subtitle: {
      fontSize: 11,
      color: themeColors.textMuted,
      marginTop: 2,
    },
  });

const styles = createTopAppBarStyles(colors);

export default styles;
