// apps/mobile/src/app/home.tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopAppBar from '../components/TopAppBar';
import BottomNav, { BottomTabKey } from '../components/BottomNav';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InstructionsScreen from '../screens/InstructionsScreen';
import { ROUTES } from '../constants/routes';
import MapScreen from '../screens/MapScreen';

export default function HomeRoute() {
  const [currentTab, setCurrentTab] = useState<BottomTabKey>('home');
  const router = useRouter();

  const handleTabPress = (tab: BottomTabKey, route: string) => {
    setCurrentTab(tab);
    console.log('Tab pressed:', tab, 'route:', route);
    // you can later navigate based on `route` if you want
  };

  // NEW: Handler to navigate back to the login screen (root '/')
  const handleSignOut = () => {
    router.replace('/');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onStartJourney={() => router.push(ROUTES.journey)}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <View style={{ flex: 1 }}>
        <TopAppBar />
        {renderContent()}
        <BottomNav currentTab={currentTab} onTabPress={handleTabPress} routes={ROUTES} />
      </View>
    </SafeAreaView>
  );
}
