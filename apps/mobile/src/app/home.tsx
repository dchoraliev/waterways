// apps/mobile/src/app/home.tsx
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TopAppBar from '../components/TopAppBar';
import BottomNav, { BottomTabKey } from '../components/BottomNav';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InstructionsScreen from '../screens/InstructionsScreen';
import MapScreen from '../screens/MapScreen';
import { ROUTES } from '../constants/routes';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeRoute() {
  const params = useLocalSearchParams();
  const initialTab = (params.tab as BottomTabKey) || 'home';
  const [currentTab, setCurrentTab] = useState<BottomTabKey>(initialTab);
  const router = useRouter();
  const { colors } = useTheme();

  const handleTabPress = (tab: BottomTabKey, route: string) => {
    setCurrentTab(tab);
    console.log('Tab pressed:', tab, 'route:', route);
    // you can later navigate based on `route` if you want
  };

  // NEW: Handler to navigate back to the login screen (root '/')
  const handleSignOut = () => {
    router.replace('/');
  };

  // Confirmation dialog before starting a journey
  const handleStartJourney = () => {
    Alert.alert(
      'Start New Journey',
      'Are you ready to begin recording observations?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Journey',
          onPress: () => router.push(ROUTES.journey),
        },
      ],
      { cancelable: false }
    );
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onStartJourney={handleStartJourney}
            onViewRecordings={() => {
              // Navigate to the list of previous journeys
              router.push(ROUTES.review);
            }}
            onViewDrafts={() => router.push(ROUTES.drafts)}
          />
        );
      case 'map':
        return <MapScreen />;
      case 'instruction':
        return <InstructionsScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onNavigateToProjects={() => router.push(ROUTES.projects)}
            onSignOutSuccess={handleSignOut} // PASS THE NEW HANDLER HERE
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <TopAppBar />
        {renderContent()}
        <BottomNav currentTab={currentTab} onTabPress={handleTabPress} routes={ROUTES} />
      </View>
    </SafeAreaView>
  );
}
