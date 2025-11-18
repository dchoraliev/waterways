import React from 'react';
import { useRouter } from 'expo-router';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import { ROUTES } from '../constants/routes';

export default function ResetPasswordRoute() {
  const router = useRouter();

  return (
    <ResetPasswordScreen
      onSubmitDone={() => router.replace(ROUTES.login)}
      onBackToLogin={() => router.replace(ROUTES.login)}
    />
  );
}
