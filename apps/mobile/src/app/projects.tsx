import React from 'react';
import { useRouter } from 'expo-router';
import MyProjectsScreen from '../screens/MyProjectScreen';

export default function MyProjectsRoute() {
  const router = useRouter();
  
  // TODO: Replace with actual userId from your auth context
  const userId = 'temp-user-id';
  
  return <MyProjectsScreen userId={userId} />;
}
