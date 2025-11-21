// apps/mobile/src/app/projects.tsx (Corrected)
import React from 'react';
import { useRouter } from 'expo-router';
import MyProjectScreen from '../screens/MyProjectScreen'; // <-- Changed import

export default function MyProjectsRoute() {
  const router = useRouter();
  
  // TODO: Replace with actual userId from your auth context
  const userId = 'temp-user-id';
  
  // The ProjectsScreen doesn't take props, but if you want to pass them later...
  return <MyProjectScreen  userId={userId} />; 
}
