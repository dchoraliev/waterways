import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopAppBar from '../components/TopAppBar';
import BottomNav, { BottomTabKey } from '../components/BottomNav';
import HomeScreen from '../screens/HomeScreen';

export default function HomeRoute() {
  const [currentTab, setCurrentTab] = useState<BottomTabKey>('home');

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onStartJourney={() => console.log('Start Journey')}
            onViewRecordings={() => console.log('View Previous Recordings')}
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
        return (
          <View
            style={{
              flex: 1,
              backgroundColor: '#020617',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#F9FAFB' }}>Settings coming soon</Text>
          </View>
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
        <BottomNav currentTab={currentTab} onTabPress={setCurrentTab} />
      </View>
    </SafeAreaView>
  );
}
