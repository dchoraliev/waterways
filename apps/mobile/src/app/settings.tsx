import React from 'react';
import SettingsScreen from '../screens/SettingsScreen';
import { useRouter } from 'expo-router'; // 1. Import useRouter

export default function SettingsRoute() {
  const router = useRouter(); // 2. Initialize router

  const handleSignOut = () => {
    router.replace('/'); // 3. Define the sign-out success action (navigate to login)
  };

  return <SettingsScreen onSignOutSuccess={handleSignOut} />; // 4. Pass the required prop
}
