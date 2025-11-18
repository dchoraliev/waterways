import React from 'react';
import { useRouter } from 'expo-router';
import SettingsScreen from '../screens/SettingsScreen';
import { ROUTES } from '../constants/routes';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      onOpenProjects={() => {
        router.push(ROUTES.projects);
      }}
    />
  );
}
