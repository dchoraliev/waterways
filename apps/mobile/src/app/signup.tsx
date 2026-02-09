import React from 'react';
import { useRouter } from 'expo-router';
import SignupScreen from '../screens/SignupScreen';
import { ROUTES } from '../constants/routes';

export default function SignupRoute() {
  const router = useRouter();

  return (
    <SignupScreen
      onSignupSuccess={() => router.replace(ROUTES.login)}
      onBackToLogin={() => router.replace(ROUTES.login)}
    />
  );
}
