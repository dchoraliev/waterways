import React from 'react';
import { useRouter } from 'expo-router';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import { ROUTES } from '../constants/routes';

export default function ResetPasswordRoute() {
  const router = useRouter();

  return (
    <ResetPasswordScreen
      onPasswordChange={() => router.replace(ROUTES.home)}
      onBackToLogin={() => router.replace(ROUTES.login)}
    />
  );
}
