import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocalSettings, updateLocalSettings } from '../database/db';
import { AppColors, getThemeColors, ThemeMode } from '../styles/colors';

type ThemeContextValue = {
  mode: ThemeMode;
  isReady: boolean;
  isDarkMode: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPersistedTheme = async () => {
      try {
        const localSettings = await getLocalSettings();
        if (!isMounted) return;

        setModeState(localSettings.darkModeEnabled ? 'dark' : 'light');
      } catch (error) {
        console.warn('Failed to load persisted theme mode:', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void loadPersistedTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);

    try {
      await updateLocalSettings({ darkModeEnabled: nextMode === 'dark' });
    } catch (error) {
      console.warn('Failed to persist theme mode:', error);
    }
  }, []);

  const toggleMode = useCallback(async () => {
    await setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isReady,
      isDarkMode: mode === 'dark',
      colors: getThemeColors(mode),
      setMode,
      toggleMode,
    }),
    [mode, isReady, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
