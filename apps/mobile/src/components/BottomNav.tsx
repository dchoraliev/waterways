import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/BottomNav.styles';
import { ROUTES } from '../constants/routes';

export type BottomTabKey = 'home' | 'map' | 'instruction' | 'settings';

export interface BottomNavProps {
  currentTab: BottomTabKey;
  onTabPress: (tab: BottomTabKey, route: string) => void;
  routes: typeof ROUTES;
}

const TAB_ROUTES: Record<BottomTabKey, keyof typeof ROUTES> = {
  home: 'home',
  map: 'map',
  instruction: 'instruction',
  settings: 'settings',
};

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabPress, routes }) => {
  const makeTab = (key: BottomTabKey, icon: string, label: string) => {
    const active = currentTab === key;
    const routeKey = TAB_ROUTES[key];
    const routePath = routes[routeKey];

    return (
      <TouchableOpacity
        key={key}
        style={styles.tabButton}
        onPress={() => onTabPress(key, routePath)}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, active ? styles.tabIconActive : styles.tabIconInactive]}>
          {icon}
        </Text>
        <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {makeTab('home', '🏠', 'Home')}
      {makeTab('map', '🗺️', 'Map')}
      {makeTab('instruction', '📘', 'Instruction')}
      {makeTab('settings', '⚙️', 'Settings')}
    </View>
  );
};

export default BottomNav;
