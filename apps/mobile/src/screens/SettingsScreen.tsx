import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/SettingsScreen.styles';
import { getSession, signOut } from 'packages/shared/src/supabase/auth';

interface SettingsScreenProps {
  onNavigateToProjects?: () => void;
  onSignOutSuccess: () => void; // New prop for sign-out action
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToProjects,
  onSignOutSuccess,
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch the user's email on mount using the existing getSession
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await getSession();

      if (error) {
        console.error('Error getting session:', error);
        setUserEmail(null);
        return;
      }

      const email = data.session?.user.email ?? null;
      setUserEmail(email);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Use existing signOut function
      const { error } = await signOut();

      if (error) {
        Alert.alert('Sign Out Failed', error.message);
      } else {
        onSignOutSuccess(); // Navigate back to login screen via prop
      }
    } catch (_error) {
      console.error('Sign Out error:', _error);
      Alert.alert('Error', 'An unexpected error occurred during sign out');
    } finally {
      setLoading(false);
    }
  };

  const handleMyProjects = () => {
    onNavigateToProjects?.();
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* User Info Box */}
      {userEmail && (
        <View style={styles.userInfoBox}>
          <Text style={styles.userInfoTitle}>Logged in as</Text>
          <Text style={styles.userInfoEmail}>{userEmail}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={loading}
          >
            <Text style={styles.signOutButtonText}>{loading ? 'Signing out...' : 'Sign Out'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your WaDE preferences and data.</Text>
      </View>

      {/* My Projects entry */}
      <TouchableOpacity activeOpacity={0.85} style={styles.row} onPress={handleMyProjects}>
        <View style={styles.rowTextCol}>
          <Text style={styles.rowTitle}>My Projects</Text>
          <Text style={styles.rowSubtitle}>View and manage your research projects.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Placeholder for future settings */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>More settings will be available here soon.</Text>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;
