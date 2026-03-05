import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createAuthScreenLayoutStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    centerWrapper: {
      width: '100%',
      maxWidth: 360,
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: themeColors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: themeColors.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: themeColors.primary,
      backgroundColor: themeColors.surface,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
  });

const styles = createAuthScreenLayoutStyles(colors);

export default styles;
