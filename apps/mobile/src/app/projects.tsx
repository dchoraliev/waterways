import React from 'react';
import MyProjectScreen from '../screens/MyProjectScreen'; 

export default function MyProjectsRoute() {

  // TODO: Replace with actual userId from your auth context
  const userId = '00000000-0000-0000-0000-000000000000';

  // The ProjectsScreen doesn't take props, but if you want to pass them later...
  return <MyProjectScreen userId={userId} />;
}
