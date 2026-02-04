import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../screens/LoginScreen';
import { ROUTES } from '../constants/routes';

export default function LoginRoute() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.replace(ROUTES.home);
  };

  return (
    <LoginScreen
      onLoginSuccess={handleLoginSuccess}
      onForgotPassword={() => router.push(ROUTES.resetPassword)}
      onSignUp={() => router.push(ROUTES.signup)}
    />
  );
}
