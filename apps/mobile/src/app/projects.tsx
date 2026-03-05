import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@waterways/shared/src/supabase/client';
import MyProjectScreen from '../screens/MyProjectScreen';
import { useTheme } from '../contexts/ThemeContext';

export default function MyProjectsRoute() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          setUserId(user.id);
        } else {
          // Fallback for testing if no user is logged in
          setUserId('00000000-0000-0000-0000-000000000000');
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setUserId('00000000-0000-0000-0000-000000000000');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  if (loading || !userId) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <MyProjectScreen />;
}
