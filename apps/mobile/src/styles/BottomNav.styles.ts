import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createBottomNavStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      backgroundColor: themeColors.background,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
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
      color: themeColors.primary,
      fontWeight: '600',
    },
    tabLabelInactive: {
      color: themeColors.textMuted,
    },
    tabIconActive: {
      color: themeColors.primary,
    },
    tabIconInactive: {
      color: themeColors.textMuted,
    },
  });

const styles = createBottomNavStyles(colors);

export default styles;
