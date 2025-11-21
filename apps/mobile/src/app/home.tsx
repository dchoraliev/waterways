// apps/mobile/src/app/home.tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopAppBar from '../components/TopAppBar';
import BottomNav, { BottomTabKey } from '../components/BottomNav';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { ROUTES } from '../constants/routes';


export default function HomeRoute() {
  const [currentTab, setCurrentTab] = useState<BottomTabKey>('home');
  const router = useRouter();

  const handleTabPress = (tab: BottomTabKey, route: string) => {
    setCurrentTab(tab);
    console.log('Tab pressed:', tab, 'route:', route);
    // you can later navigate based on `route` if you want
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onStartJourney={() => router.push(ROUTES.journey)}
            onViewRecordings={() => {
              // placeholder: later wire to real history
              router.push('/review/sample-trip');
            }}
            onViewDrafts={() => router.push(ROUTES.drafts)}
          />
        );
      case 'map':
        return (
          <View
            style={{
              flex: 1,
              backgroundColor: '#020617',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#F9FAFB' }}>Map screen coming soon</Text>
          </View>
        );
      case 'instruction':
        return (
          <View
            style={{
              flex: 1,
              backgroundColor: '#020617',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#F9FAFB' }}>Instructions coming soon</Text>
          </View>
        );
      case 'settings':
          return <SettingsScreen onNavigateToProjects={() => router.push(ROUTES.projects)} />;
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
