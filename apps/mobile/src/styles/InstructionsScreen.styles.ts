import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createInstructionsScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: 15,
    },
    content: {
      paddingVertical: 20,
      paddingBottom: 50,
    },
    mainTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: themeColors.textPrimary,
      marginBottom: 10,
      textAlign: 'center',
    },
    description: {
      color: themeColors.textMuted,
      fontSize: 16,
      marginBottom: 30,
      textAlign: 'center',
      lineHeight: 22,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      paddingBottom: 20,
    },
  });

const styles = createInstructionsScreenStyles(colors);

export default styles;
