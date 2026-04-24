import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Keyboard,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createSettingsStyles, createSettingsTokens } from '../styles/SettingsScreen.styles';
import {
  signIn,
  signOut,
  requestPasswordReauthEmail,
  changePasswordWithReauthCode,
  deleteAccount,
} from '@waterways/shared/src/supabase/auth';
import { supabase } from '@waterways/shared/src/supabase/client';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import { getLocalSettings, updateLocalSettings } from '../database/db';
import { useTheme } from '../contexts/ThemeContext';
import { ROUTES } from '../constants/routes';
import { LEGAL_DOCUMENTS_URL } from '../constants/legal';

interface UserProfile {
  name: string;
  email: string;
}

interface SettingsScreenProps {
  onNavigateToProjects?: () => void;
  onSignOutSuccess: () => void;
}

type DailySummaryEmailSettingsResponse = {
  dailySummary: boolean;
  lastDailySummary: string | null;
  updatedAt: string | null;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToProjects,
  onSignOutSuccess,
}) => {
  const router = useRouter();
  const MIN_PASSWORD_LENGTH = 8;
  const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;
  const { mode, setMode, colors } = useTheme();
  const tokens = useMemo(() => createSettingsTokens(colors), [colors]);
  const styles = useMemo(() => createSettingsStyles(tokens), [tokens]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [showEmailPreferencesDialog, setShowEmailPreferencesDialog] = useState(false);

  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordReauthCode, setPasswordReauthCode] = useState('');
  const [hasRequestedPasswordReauth, setHasRequestedPasswordReauth] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReauthCode, setDeleteReauthCode] = useState('');
  const [hasRequestedDeleteReauth, setHasRequestedDeleteReauth] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailySummaryEmailEnabled, setDailySummaryEmailEnabled] = useState(false);
  const [dailySummaryEmailSyncPending, setDailySummaryEmailSyncPending] = useState(false);
  const [isUpdatingDailySummaryEmail, setIsUpdatingDailySummaryEmail] = useState(false);
  const [showNameOnMap, setShowNameOnMap] = useState(true);
  const [showNameOnMapSyncPending, setShowNameOnMapSyncPending] = useState(false);

  const [isUpdatingShowNameOnMap, setIsUpdatingShowNameOnMap] = useState(false);

  const persistDailySummaryLocally = useCallback(
    async (value: boolean, syncPending: boolean): Promise<void> => {
      await updateLocalSettings({
        dailySummaryEmailEnabled: value,
        dailySummaryEmailSyncPending: syncPending,
      });
      setDailySummaryEmailSyncPending(syncPending);
    },
    []
  );

  const persistShowNameOnMapLocally = useCallback(
    async (value: boolean, syncPending: boolean): Promise<void> => {
      await updateLocalSettings({
        showNameOnMap: value,
        showNameOnMapSyncPending: syncPending,
      });
      setShowNameOnMapSyncPending(syncPending);
    },
    []
  );

  const syncPendingDailySummaryEmailSetting = useCallback(async (): Promise<void> => {
    try {
      const localSettings = await getLocalSettings();

      if (!localSettings.dailySummaryEmailSyncPending) {
        return;
      }

      const { data, error } = await supabase.functions.invoke<DailySummaryEmailSettingsResponse>(
        'daily-summary-email-settings',
        {
          body: {
            action: 'set',
            dailySummary: localSettings.dailySummaryEmailEnabled,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data) {
        setDailySummaryEmailEnabled(data.dailySummary);
        await persistDailySummaryLocally(data.dailySummary, false);
      }
    } catch (error) {
      console.warn('Failed to sync pending daily summary setting:', error);
    }
  }, [persistDailySummaryLocally]);

  const syncPendingShowNameOnMapSetting = useCallback(
    async (userId: string): Promise<void> => {
      try {
        const localSettings = await getLocalSettings();

        if (!localSettings.showNameOnMapSyncPending) {
          return;
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({ share_name_on_map: localSettings.showNameOnMap })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }

        setShowNameOnMap(localSettings.showNameOnMap);
        await persistShowNameOnMapLocally(localSettings.showNameOnMap, false);
      } catch (error) {
        console.warn('Failed to sync pending show name on map setting:', error);
      }
    },
    [persistShowNameOnMapLocally]
  );

  const loadUserProfile = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      setUserProfile(null);
      return;
    }

    const user = session?.user;
    const email = user?.email ?? null;
    const localSettingsAtLoad = await getLocalSettings().catch(() => null);
    const hadPendingShowNameOnMapSync = localSettingsAtLoad?.showNameOnMapSyncPending ?? false;

    let firstNameFromDb: string | null = null;
    let lastNameFromDb: string | null = null;
    let showNameOnMapFromDb: boolean | null = null;

    if (user) {
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('first_name, last_name, share_name_on_map')
        .eq('id', user.id)
        .maybeSingle();

      if (dbUserError) {
        console.warn('Error loading users row in SettingsScreen:', dbUserError);
      } else if (dbUser) {
        firstNameFromDb = dbUser.first_name;
        lastNameFromDb = dbUser.last_name;
        showNameOnMapFromDb = dbUser.share_name_on_map ?? true;
      }
    }

    const fullNameFromDb = [firstNameFromDb, lastNameFromDb]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(' ')
      .trim();

    const nameFromMeta =
      fullNameFromDb ||
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      (email ? email.split('@')[0] : undefined);

    if (user && email) {
      setUserProfile({
        email,
        name: nameFromMeta ? String(nameFromMeta) : 'User',
      });

      await syncPendingShowNameOnMapSetting(user.id);

      if (showNameOnMapFromDb !== null && !hadPendingShowNameOnMapSync) {
        setShowNameOnMap(showNameOnMapFromDb);
        await persistShowNameOnMapLocally(showNameOnMapFromDb, false);
      }

      await syncPendingDailySummaryEmailSetting();

      const { data: emailSettingsData, error: emailSettingsError } =
        await supabase.functions.invoke<DailySummaryEmailSettingsResponse>(
          'daily-summary-email-settings',
          {
            body: { action: 'get' },
          }
        );

      if (emailSettingsError) {
        console.warn('Failed to load daily summary email setting:', emailSettingsError.message);
      } else if (emailSettingsData) {
        setDailySummaryEmailEnabled(emailSettingsData.dailySummary);
        await persistDailySummaryLocally(emailSettingsData.dailySummary, false);
      }
    } else {
      setUserProfile(null);
      setShowNameOnMap(true);
    }
  }, [
    persistDailySummaryLocally,
    persistShowNameOnMapLocally,
    syncPendingDailySummaryEmailSetting,
    syncPendingShowNameOnMapSetting,
  ]);

  const loadLocalSettings = useCallback(async () => {
    try {
      const localSettings = await getLocalSettings();
      setNotificationsEnabled(localSettings.notificationsEnabled);
      setDailySummaryEmailEnabled(localSettings.dailySummaryEmailEnabled);
      setDailySummaryEmailSyncPending(localSettings.dailySummaryEmailSyncPending);
      setShowNameOnMap(localSettings.showNameOnMap);
      setShowNameOnMapSyncPending(localSettings.showNameOnMapSyncPending);
    } catch (error) {
      console.warn('Failed to load local settings:', error);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setIsInitialLoading(true);
      await loadLocalSettings();
      await loadUserProfile();
      setIsInitialLoading(false);
    };
    void loadAll();
  }, [loadLocalSettings, loadUserProfile]);

  const handleDarkModeToggle = async (value: boolean) => {
    await setMode(value ? 'dark' : 'light');
  };

  const handleDisableNotificationsToggle = async (disabled: boolean) => {
    const nextNotificationsEnabled = !disabled;
    setNotificationsEnabled(nextNotificationsEnabled);

    try {
      await updateLocalSettings({ notificationsEnabled: nextNotificationsEnabled });
    } catch (error) {
      console.warn('Failed to persist notifications setting:', error);
    }
  };

  const handleDailySummaryEmailToggle = async (value: boolean) => {
    if (isUpdatingDailySummaryEmail) return;

    setDailySummaryEmailEnabled(value);
    setIsUpdatingDailySummaryEmail(true);

    try {
      await persistDailySummaryLocally(value, true);

      const { data, error } = await supabase.functions.invoke<DailySummaryEmailSettingsResponse>(
        'daily-summary-email-settings',
        {
          body: {
            action: 'set',
            dailySummary: value,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data) {
        setDailySummaryEmailEnabled(data.dailySummary);
        await persistDailySummaryLocally(data.dailySummary, false);
      }
    } catch (error: unknown) {
      console.warn('Daily summary setting queued for sync:', error);
    } finally {
      setIsUpdatingDailySummaryEmail(false);
    }
  };

  const initials = useMemo(() => {
    const name = userProfile?.name?.trim();
    if (!name) return 'U';
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [userProfile?.name]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await signOut();

      if (error) {
        Alert.alert('Sign Out Failed', error.message);
      } else {
        onSignOutSuccess();
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

  const handleReturnToLogin = () => {
    router.replace(ROUTES.login);
  };

  const resetEmailDialog = () => {
    setShowEmailDialog(false);
    setNewEmail('');
    setConfirmEmail('');
    setEmailPassword('');
    setEmailError('');
  };

  const resetDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletePassword('');
    setDeleteReauthCode('');
    setHasRequestedDeleteReauth(false);
    setDeleteError('');
  };

  const handleDeletePasswordChange = (value: string) => {
    setDeletePassword(value);
    if (deleteError) setDeleteError('');
  };

  const handleDeleteReauthCodeChange = (value: string) => {
    setDeleteReauthCode(value);
    if (deleteError) setDeleteError('');
  };

  const formatDeleteAccountError = (error: unknown): string => {
    const fallback = 'Unable to delete account. Please try again.';

    if (!error || typeof error !== 'object') {
      return fallback;
    }

    const errorRecord = error as Record<string, unknown>;
    const details: string[] = [];

    if (typeof errorRecord.name === 'string' && errorRecord.name.trim()) {
      details.push(errorRecord.name.trim());
    }

    const context =
      errorRecord.context && typeof errorRecord.context === 'object'
        ? (errorRecord.context as Record<string, unknown>)
        : undefined;

    if (context) {
      const status = context.status;
      const statusText = context.statusText;

      if (typeof status === 'number') {
        details.push(
          `HTTP ${status}${typeof statusText === 'string' && statusText.trim() ? ` ${statusText}` : ''}`
        );
      }

      const jsonPayload =
        context.json && typeof context.json === 'object'
          ? (context.json as Record<string, unknown>)
          : undefined;

      if (jsonPayload && typeof jsonPayload.error === 'string' && jsonPayload.error.trim()) {
        details.push(jsonPayload.error.trim());
      } else if (typeof context.text === 'string' && context.text.trim()) {
        details.push(context.text.trim());
      }
    }

    if (typeof errorRecord.message === 'string' && errorRecord.message.trim()) {
      details.push(errorRecord.message.trim());
    }

    const uniqueDetails = [...new Set(details)];
    return uniqueDetails.length ? uniqueDetails.join(' • ') : fallback;
  };

  const handleEmailChange = async () => {
    if (isUpdatingEmail) return;

    setEmailError('');

    const normalizedNewEmail = newEmail.trim().toLowerCase();
    const normalizedConfirmEmail = confirmEmail.trim().toLowerCase();

    if (!newEmail || !confirmEmail || !emailPassword) {
      setEmailError('All fields are required');
      return;
    }

    if (normalizedNewEmail !== normalizedConfirmEmail) {
      setEmailError('Email addresses do not match');
      return;
    }

    if (!userProfile?.email) {
      setEmailError('No user is currently signed in');
      return;
    }

    if (normalizedNewEmail === userProfile.email.trim().toLowerCase()) {
      setEmailError('New email must be different from your current email');
      return;
    }

    try {
      setIsUpdatingEmail(true);

      const { error: signInError } = await signIn(userProfile.email, emailPassword);
      if (signInError) {
        setEmailError(signInError.message || 'Current password is incorrect');
        return;
      }

      const { data: updateEmailData, error: updateEmailError } = await supabase.auth.updateUser({
        email: normalizedNewEmail,
      });
      if (updateEmailError) {
        setEmailError(updateEmailError.message || 'Unable to update email address');
        return;
      }

      const pendingEmail = updateEmailData?.user?.new_email;
      if (pendingEmail) {
        Alert.alert(
          'Confirm email change',
          `A confirmation email was sent to ${pendingEmail}. Your email will update after confirmation.`
        );
      } else {
        Alert.alert('Success', 'Email address updated successfully.');
      }

      await loadUserProfile();

      setShowEmailDialog(false);
      setNewEmail('');
      setConfirmEmail('');
      setEmailPassword('');
    } catch (error) {
      console.error('Email change error:', error);
      setEmailError('An unexpected error occurred while updating your email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    if (isUpdatingPassword) return;

    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.trim().length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
      return;
    }

    if (!PASSWORD_SPECIAL_CHAR_REGEX.test(newPassword)) {
      setPasswordError('Password must include at least one special character');
      return;
    }

    if (!userProfile?.email) {
      setPasswordError('No user is currently signed in');
      return;
    }

    try {
      setIsUpdatingPassword(true);

      const { error: signInError } = await signIn(userProfile.email, currentPassword);
      if (signInError) {
        setPasswordError(signInError.message || 'Current password is incorrect');
        return;
      }

      if (!hasRequestedPasswordReauth) {
        const { error: reauthRequestError } = await requestPasswordReauthEmail();
        if (reauthRequestError) {
          setPasswordError(reauthRequestError.message || 'Unable to send reauthentication email');
          return;
        }

        setHasRequestedPasswordReauth(true);
        setPasswordError('');
        Alert.alert(
          'Reauthentication email sent',
          'Check your email for the verification code, then enter it to confirm your new password.'
        );
        return;
      }

      if (!passwordReauthCode.trim()) {
        setPasswordError('Reauthentication code is required');
        return;
      }

      const { error: updatePasswordError } = await changePasswordWithReauthCode(
        newPassword,
        passwordReauthCode
      );
      if (updatePasswordError) {
        setPasswordError(updatePasswordError.message || 'Unable to update password');
        return;
      }

      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordReauthCode('');
      setHasRequestedPasswordReauth(false);
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('An unexpected error occurred while updating your password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setDeleteError('');

    if (!deletePassword.trim()) {
      setDeleteError('Password is required');
      return;
    }

    if (!userProfile?.email) {
      setDeleteError('No user is currently signed in');
      return;
    }

    try {
      setIsDeletingAccount(true);

      if (!hasRequestedDeleteReauth) {
        const { error: signInError } = await signIn(userProfile.email, deletePassword);
        if (signInError) {
          setDeleteError(signInError.message || 'Incorrect password');
          return;
        }

        const { error: requestReauthError } = await requestPasswordReauthEmail();
        if (requestReauthError) {
          setDeleteError(requestReauthError.message || 'Unable to send reauthentication email');
          return;
        }

        setHasRequestedDeleteReauth(true);
        setDeleteError('');
        Alert.alert(
          'Reauthentication email sent',
          'Check your email for the verification code, then enter it to confirm account deletion.'
        );
        return;
      }

      if (!deleteReauthCode.trim()) {
        setDeleteError('Reauthentication code is required');
        return;
      }

      const { error: deleteErrorResponse } = await deleteAccount({
        action: 'confirm-delete',
        currentPassword: deletePassword,
      });
      if (deleteErrorResponse) {
        setDeleteError(formatDeleteAccountError(deleteErrorResponse));
        return;
      }

      resetDeleteDialog();
      Alert.alert(
        'Account Deleted',
        'Your account was deleted successfully.',
        [
          {
            text: 'OK',
            onPress: async () => {
              const { error: signOutError } = await signOut();
              if (signOutError) {
                console.warn('Sign out after account deletion failed:', signOutError);
              }
              router.replace(ROUTES.login);
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Delete account re-auth error:', error);
      setDeleteError(formatDeleteAccountError(error));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const performShowNameOnMapUpdate = async (value: boolean) => {
    setShowNameOnMap(value);
    setIsUpdatingShowNameOnMap(true);

    try {
      await persistShowNameOnMapLocally(value, true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw sessionError ?? new Error('No active session');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ share_name_on_map: value })
        .eq('id', session.user.id);

      if (updateError) {
        throw updateError;
      }

      await persistShowNameOnMapLocally(value, false);
    } catch (error: unknown) {
      console.warn('Show name on map setting queued for sync:', error);
    } finally {
      setIsUpdatingShowNameOnMap(false);
    }
  };

  const handleShowNameOnMapToggle = async (value: boolean) => {
    if (isUpdatingShowNameOnMap) return;

    // If turning OFF, show confirmation
    if (!value) {
      Alert.alert(
        'Hide Name on Map?',
        'Hiding your name may decrease collaboration opportunities with other researchers. Are you sure?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Hide Name',
            style: 'destructive',
            onPress: () => performShowNameOnMapUpdate(value),
          },
        ]
      );
      return;
    }

    // If turning ON, update immediately
    await performShowNameOnMapUpdate(value);
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      {isInitialLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={{ color: tokens.text, marginTop: 16 }}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerCentered}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your WaDE preferences and data.</Text>
          </View>

          {!userProfile && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              <View style={styles.cardBody}>
                <Text style={styles.metaValue}>
                  You are currently using the app without logging in.
                </Text>
                <View style={{ height: 12 }} />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleReturnToLogin}
                >
                  <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.buttonText, styles.buttonTextSolid]}>Return to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Profile */}
          {userProfile && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile Information</Text>
              <View style={styles.cardBody}>
                <View style={styles.profileRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{userProfile.name}</Text>
                    <Text style={styles.profileEmail}>{userProfile.email}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Member since</Text>
                  <Text style={styles.metaValue}>October 2025</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Total journeys</Text>
                  <Text style={styles.metaValue}>0</Text>
                </View>

                <View style={{ height: 12 }} />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.button, styles.buttonOutline]}
                  onPress={handleSignOut}
                  disabled={loading}
                >
                  <Ionicons name="log-out-outline" size={18} color={tokens.text} />
                  <Text style={[styles.buttonText, styles.buttonTextOutline]}>
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quick Nav */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Navigation</Text>
            <View style={styles.cardBody}>
              <Pressable
                onPress={handleMyProjects}
                style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
              >
                <View style={styles.navLeft}>
                  <Ionicons name="folder-outline" size={20} color={tokens.primary} />
                  <View>
                    <Text style={styles.navLabel}>My Projects</Text>
                    <Text style={styles.navSubLabel}>View and manage your research projects.</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={tokens.mutedText} />
              </Pressable>
            </View>
          </View>

          {/* Account Management */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Management</Text>
            <View style={styles.cardBody}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  <Ionicons name="mail-outline" size={20} color={tokens.primary} />
                  <Text style={styles.rowLabel}>Change email address</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.button, styles.buttonOutline, styles.buttonSm]}
                  onPress={() => setShowEmailDialog(true)}
                >
                  <Text style={[styles.buttonText, styles.buttonTextOutline]}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  <Ionicons name="lock-closed-outline" size={20} color={tokens.primary} />
                  <Text style={styles.rowLabel}>Change password</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.button, styles.buttonOutline, styles.buttonSm]}
                  onPress={() => setShowPasswordDialog(true)}
                >
                  <Text style={[styles.buttonText, styles.buttonTextOutline]}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />

              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  <Ionicons name="trash-outline" size={20} color={tokens.destructive} />
                  <Text style={[styles.rowLabel, { color: tokens.destructive }]}>
                    Delete account
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.button, styles.buttonDestructive, styles.buttonSm]}
                  onPress={() => setShowDeleteDialog(true)}
                >
                  <Text style={[styles.buttonText, styles.buttonTextSolid]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <View style={styles.cardBody}>
              <Pressable
                onPress={() => setShowNotificationsDialog(true)}
                style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
              >
                <View style={styles.navLeft}>
                  <Ionicons name="notifications-outline" size={20} color={tokens.primary} />
                  <Text style={styles.navLabel}>Customize notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={tokens.mutedText} />
              </Pressable>
            </View>
          </View>

          {/* Email */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Email</Text>
            <View style={styles.cardBody}>
              <Pressable
                onPress={() => setShowEmailPreferencesDialog(true)}
                style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
              >
                <View style={styles.navLeft}>
                  <Ionicons name="mail-outline" size={20} color={tokens.primary} />
                  <Text style={styles.navLabel}>Customize email messages</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={tokens.mutedText} />
              </Pressable>
            </View>
          </View>

          {/* Display */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Display</Text>
            <View style={styles.cardBody}>
              <View style={styles.switchRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="moon-outline" size={20} color={tokens.primary} />
                  <Text style={styles.rowLabel}>Dark mode</Text>
                </View>
                <Switch value={mode === 'dark'} onValueChange={handleDarkModeToggle} />
              </View>
            </View>
          </View>

          {/* Privacy */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Privacy</Text>
            <View style={styles.cardBody}>
              <View style={styles.switchRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="person-outline" size={20} color={tokens.primary} />
                  <Text style={styles.rowLabel}>Show my name on map</Text>
                </View>
                <Switch
                  value={showNameOnMap}
                  onValueChange={handleShowNameOnMapToggle}
                  disabled={isUpdatingShowNameOnMap}
                />
              </View>
              {showNameOnMapSyncPending && (
                <Text style={[styles.metaValue, { marginTop: 8 }]}>
                  Saved offline. This setting will sync when you are back online.
                </Text>
              )}
            </View>
          </View>

          {/* Legal */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Legal</Text>
            <View style={styles.cardBody}>
              <Pressable
                onPress={() => Linking.openURL(LEGAL_DOCUMENTS_URL)}
                style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
              >
                <View style={styles.navLeft}>
                  <Ionicons name="document-text-outline" size={20} color={tokens.mutedText} />
                  <Text style={styles.navLabel}>Legal Documents</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={tokens.mutedText} />
              </Pressable>
            </View>
          </View>

          <View style={{ height: 18 }} />
        </ScrollView>
      )}

      {/* Change Email Modal */}
      <SheetModal
        visible={showEmailDialog}
        title="Change Email Address"
        description="Update your email address. You'll need to enter your current password to confirm."
        onClose={resetEmailDialog}
        styles={styles}
        useKeyboardAvoidingView
      >
        <Field label="New email address" styles={styles}>
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            placeholderTextColor={tokens.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </Field>
        <Field label="Confirm new email address" styles={styles}>
          <TextInput
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            placeholder="Confirm new email address"
            placeholderTextColor={tokens.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </Field>
        <Field label="Current password" styles={styles}>
          <TextInput
            value={emailPassword}
            onChangeText={setEmailPassword}
            placeholder="Enter your current password"
            placeholderTextColor={tokens.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        {!!emailError && <ErrorBox message={emailError} styles={styles} />}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonOutline]}
            onPress={resetEmailDialog}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleEmailChange}
            disabled={isUpdatingEmail}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>
              {isUpdatingEmail ? 'Updating...' : 'Update Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* Change Password Modal */}
      <SheetModal
        visible={showPasswordDialog}
        title="Change Password"
        description={
          hasRequestedPasswordReauth
            ? 'Enter the reauthentication code sent to your email to confirm your password change.'
            : "Enter your current password and choose a new one. You'll receive a reauthentication code by email to confirm the change."
        }
        onClose={() => {
          setShowPasswordDialog(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordReauthCode('');
          setHasRequestedPasswordReauth(false);
          setPasswordError('');
        }}
        styles={styles}
        useKeyboardAvoidingView
      >
        <Field label="Current password" styles={styles}>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={tokens.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        <Field label="New password" styles={styles}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={tokens.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        <Field label="Confirm new password" styles={styles}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={tokens.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        {hasRequestedPasswordReauth && (
          <Field label="Reauthentication code" styles={styles}>
            <TextInput
              value={passwordReauthCode}
              onChangeText={setPasswordReauthCode}
              placeholder="Enter email code"
              placeholderTextColor={tokens.placeholder}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>
        )}
        {!!passwordError && <ErrorBox message={passwordError} styles={styles} />}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonOutline]}
            onPress={() => {
              setShowPasswordDialog(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordReauthCode('');
              setHasRequestedPasswordReauth(false);
              setPasswordError('');
            }}
            disabled={isUpdatingPassword}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonPrimary]}
            onPress={handlePasswordChange}
            disabled={isUpdatingPassword}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>
              {isUpdatingPassword
                ? hasRequestedPasswordReauth
                  ? 'Updating...'
                  : 'Sending code...'
                : hasRequestedPasswordReauth
                  ? 'Confirm Password Change'
                  : 'Send Reauthentication Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* Delete Account Modal */}
      <DeletePasswordModal
        visible={showDeleteDialog}
        password={deletePassword}
        reauthCode={deleteReauthCode}
        hasRequestedReauth={hasRequestedDeleteReauth}
        passwordError={deleteError}
        isSubmitting={isDeletingAccount}
        onPasswordChange={handleDeletePasswordChange}
        onReauthCodeChange={handleDeleteReauthCodeChange}
        onCancel={resetDeleteDialog}
        onConfirm={handleDeleteAccount}
        styles={styles}
        tokens={tokens}
      />

      {/* Notifications Modal */}
      <SheetModal
        visible={showNotificationsDialog}
        title="Notification Settings"
        description="Manage your notification preferences. More options will be available soon."
        onClose={() => setShowNotificationsDialog(false)}
        styles={styles}
      >
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Disable all notifications</Text>
          <Switch value={!notificationsEnabled} onValueChange={handleDisableNotificationsToggle} />
        </View>
        <View style={styles.modalFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonPrimary, { alignSelf: 'flex-end' }]}
            onPress={() => setShowNotificationsDialog(false)}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>Done</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* Email Modal */}
      <SheetModal
        visible={showEmailPreferencesDialog}
        title="Email Settings"
        description={
          dailySummaryEmailSyncPending
            ? 'Manage your email message preferences. Daily Summary is saved locally and will sync when online.'
            : 'Manage your email message preferences. More options will be available soon.'
        }
        onClose={() => setShowEmailPreferencesDialog(false)}
        styles={styles}
      >
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Daily Summary</Text>
          <Switch
            value={dailySummaryEmailEnabled}
            onValueChange={handleDailySummaryEmailToggle}
            disabled={isUpdatingDailySummaryEmail}
          />
        </View>
        <View style={styles.modalFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonPrimary, { alignSelf: 'flex-end' }]}
            onPress={() => setShowEmailPreferencesDialog(false)}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>Done</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>
    </SafeAreaView>
  );
};

type SettingsStyles = ReturnType<typeof createSettingsStyles>;
type SettingsTokens = ReturnType<typeof createSettingsTokens>;

function Field({
  label,
  children,
  styles,
}: {
  label: string;
  children: React.ReactNode;
  styles: SettingsStyles;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ height: 8 }} />
      {children}
    </View>
  );
}

function ErrorBox({ message, styles }: { message: string; styles: SettingsStyles }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function SheetModal({
  visible,
  title,
  description,
  onClose,
  children,
  styles,
  useKeyboardAvoidingView = false,
}: {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  styles: SettingsStyles;
  useKeyboardAvoidingView?: boolean;
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const formScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!visible || !useKeyboardAvoidingView) {
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      // Reset any in-sheet scroll offset so the modal snaps back to its original closed layout.
      globalThis.setTimeout(() => {
        formScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }, 0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible, useKeyboardAvoidingView]);

  const isKeyboardVisible = keyboardHeight > 0;
  const keyboardShift = isKeyboardVisible ? Math.min(Math.round(keyboardHeight * 0.6), 240) : 0;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {useKeyboardAvoidingView ? (
        <View style={[styles.sheetWrap, { paddingBottom: keyboardShift }]}>
          <View style={[styles.sheet, isKeyboardVisible && { maxHeight: '86%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {!!description && <Text style={styles.sheetDesc}>{description}</Text>}
            </View>
            <ScrollView
              ref={formScrollRef}
              style={{ maxHeight: '100%' }}
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEnabled={isKeyboardVisible}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      ) : (
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {!!description && <Text style={styles.sheetDesc}>{description}</Text>}
            </View>
            <View style={styles.sheetBody}>{children}</View>
          </View>
        </View>
      )}
    </Modal>
  );
}

function DeletePasswordModal({
  visible,
  password,
  reauthCode,
  hasRequestedReauth,
  passwordError,
  isSubmitting,
  onPasswordChange,
  onReauthCodeChange,
  onCancel,
  onConfirm,
  styles,
  tokens,
}: {
  visible: boolean;
  password: string;
  reauthCode: string;
  hasRequestedReauth: boolean;
  passwordError: string;
  isSubmitting: boolean;
  onPasswordChange: (value: string) => void;
  onReauthCodeChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  styles: SettingsStyles;
  tokens: SettingsTokens;
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const deleteScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      globalThis.setTimeout(() => {
        deleteScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }, 0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  const isKeyboardVisible = keyboardHeight > 0;
  const keyboardShift = isKeyboardVisible ? Math.min(Math.round(keyboardHeight * 0.6), 240) : 0;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={[styles.sheetWrap, { paddingBottom: keyboardShift }]}>
        <View style={[styles.sheet, isKeyboardVisible && { maxHeight: '86%' }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Delete Account</Text>
            <Text style={styles.sheetDesc}>
              {hasRequestedReauth
                ? 'Enter the reauthentication code we emailed you to permanently delete your account and all related data.'
                : 'Enter your password to receive a reauthentication code by email before deletion.'}
            </Text>
          </View>
          <ScrollView
            ref={deleteScrollRef}
            style={{ maxHeight: '100%' }}
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={isKeyboardVisible}
          >
            <TextInput
              value={password}
              onChangeText={onPasswordChange}
              placeholder="Enter your password"
              placeholderTextColor={tokens.placeholder}
              secureTextEntry
              style={styles.input}
              autoCapitalize="none"
              editable={!isSubmitting && !hasRequestedReauth}
            />
            {hasRequestedReauth && (
              <>
                <View style={{ height: 10 }} />
                <TextInput
                  value={reauthCode}
                  onChangeText={onReauthCodeChange}
                  placeholder="Enter reauthentication code"
                  placeholderTextColor={tokens.placeholder}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
              </>
            )}
            {!!passwordError && (
              <View style={{ marginTop: 8 }}>
                <ErrorBox message={passwordError} styles={styles} />
              </View>
            )}
            <View style={{ height: 16 }} />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.button, styles.buttonOutline]}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.button, styles.buttonDestructive]}
                onPress={onConfirm}
                disabled={isSubmitting}
              >
                <Text style={[styles.buttonText, styles.buttonTextSolid]}>
                  {isSubmitting
                    ? hasRequestedReauth
                      ? 'Deleting...'
                      : 'Sending code...'
                    : hasRequestedReauth
                      ? 'Confirm and Delete'
                      : 'Send Reauthentication Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default SettingsScreen;
