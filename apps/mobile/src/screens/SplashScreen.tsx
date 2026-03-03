import waterwaysLogo from '../../assets/logo/waterways-logo.png';
import { useEffect } from 'react';
import { initializeDatabase } from '../database/db';
import { getSession } from '@waterways/shared/src/supabase/auth';
import RippleSplash from '../components/RippleSplash';
import { useRouter } from 'expo-router';
import { ROUTES } from '../constants/routes';
import { startNetworkListener } from '../services/NetworkService';
import { updateAndSyncOfflineDataToCurrentUser } from '../services/OfflineService';

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    console.log('Splash screen...');

    // Initialize everything on the app start
    (async () => {
      try {
        // Initialize database
        console.log('[Splash Screen] Initializing database...');
        await initializeDatabase();
        // start network listener to auto-sync when connectivity is regained
        console.log('[Splash Screen] Starting network listener...');
        await startNetworkListener();
        // Check for existing user session
        console.log('[Splash Screen] Checking existing user session...');
        const { data } = await getSession();

        if (!isMounted) return;

        if (data?.session) {
          // Valid session exists -> Navigate to home screen
          // Attempt to update any offline data to the current user and fire auto-sync
          await updateAndSyncOfflineDataToCurrentUser();

          console.log('[Splash Screen] Valid session found, navigating to home...');
          router.replace(ROUTES.home);
        } else {
          // No session -> Go to the login screen
          console.log('[Splash Screen] No valid session, navigating to login...');
          router.replace(ROUTES.login);
        }
      } catch (err) {
        console.error('[Splash Screen] Unexpected error:', err);
        // Go to the login screen on error
        if (isMounted) {
          router.replace(ROUTES.login);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <RippleSplash source={waterwaysLogo} backgroundColor="#020617" color="#1D4ED8" size={72} />
  );
};

export default SplashScreen;
