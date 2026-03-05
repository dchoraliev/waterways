import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createRecentObservationItemStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: themeColors.surface,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    textBlock: {
      flex: 1,
      paddingRight: 10,
    },
    title: {
      color: themeColors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    chevron: {
      color: themeColors.textMuted,
      fontSize: 22,
      marginLeft: 8,
    },
  });

const styles = createRecentObservationItemStyles(colors);

export { styles };
