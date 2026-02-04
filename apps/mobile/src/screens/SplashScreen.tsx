import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import waterwaysLogo from '../../assets/logo/Waterways Logo.png';
import { useEffect, useState } from 'react';
import { initializeDatabase } from '../database/db';
import { getSession } from 'packages/shared/src/supabase/auth';
import RippleSplash from '../components/RippleSplash';
import { useRouter } from 'expo-router';
import { ROUTES } from '../constants/routes';

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    console.log('Splash screen...');

    // Initialize everything on the app start
    (async () => {
      try {
        // Initialize database
        console.log('Initializing database...');
        await initializeDatabase();
        // Check for existing user session
        console.log('Checking existing user session...');
        const { data, error } = await getSession();

        if (!isMounted) return;

        if (data?.session) {
          // Valid session exists -> proceed to the home page
          console.log('Valid session found, navigating to home...');
          router.replace(ROUTES.home);
        } else {
          // No session -> Go to the login screen
          console.log('No valid session, navigating to login...');
          router.replace(ROUTES.login);
        }
      } catch (err) {
        console.error('Unepected error:', err);
        // Go to the login screen on error
        if (isMounted) {
          router.replace(ROUTES.login);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <RippleSplash source={waterwaysLogo} backgroundColor="#020617" color="#1D4ED8" size={72} />
  );
};

export default SplashScreen;
