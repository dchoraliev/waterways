import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../screens/LoginScreen';

export default function IndexRoute() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.replace('/home');
  };

  return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
