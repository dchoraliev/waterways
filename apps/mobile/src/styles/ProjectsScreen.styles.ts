import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createProjectsScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
    },
    content: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 13,
      color: themeColors.textMuted,
      marginBottom: 6,
    },
    note: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
  });

const styles = createProjectsScreenStyles(colors);

export default styles;
