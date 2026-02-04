import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/SettingsScreen.styles';
import { getSession, signOut } from 'packages/shared/src/supabase/auth';
import { TOKENS } from '../styles/SettingsScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';

interface UserProfile {
  name: string;
  email: string;
}

interface SettingsScreenProps {
  onNavigateToProjects?: () => void;
  onSignOutSuccess: () => void; // New prop for sign-out action
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToProjects,
  onSignOutSuccess,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);

  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Toggles (wire these to your real settings storage later)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch the user's email on mount using the existing getSession
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await getSession();

      if (error) {
        console.error('Error getting session:', error);
        setUserProfile(null);
        return;
      }

      const user = data.session?.user;
      const email = user?.email ?? null;
      const nameFromMeta =
        (user?.user_metadata?.full_name as string | undefined) ||
        (user?.user_metadata?.name as string | undefined) ||
        (email ? email.split('@')[0] : undefined);

      if (email) {
        setUserProfile({
          email,
          name: nameFromMeta ? String(nameFromMeta) : 'User',
        });
      } else {
        setUserProfile(null);
      }
    };
    fetchUser();
  }, []);

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

  const handleEmailChange = () => {
    setEmailError('');

    if (!newEmail || !confirmEmail || !emailPassword) {
      setEmailError('All fields are required');
      return;
    }

    if (newEmail !== confirmEmail) {
      setEmailError('Email addresses do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // TODO: wire to your backend (supabase updateUser) if desired.
    // For now, just close. Keeping this UI because the web component had it.
    setShowEmailDialog(false);
    setNewEmail('');
    setConfirmEmail('');
    setEmailPassword('');
    Alert.alert('Not Implemented', 'Email updates are not wired up yet.');
  };

  const handlePasswordChange = () => {
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    // TODO: wire to your backend if desired.
    setShowPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Not Implemented', 'Password updates are not wired up yet.');
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    Alert.alert('Not Implemented', 'Account deletion is not wired up yet.');
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCentered}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your WaDE preferences and data.</Text>
        </View>

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
                <Ionicons name="log-out-outline" size={18} color={TOKENS.text} />
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
                <Ionicons name="folder-outline" size={20} color={TOKENS.primary} />
                <View>
                  <Text style={styles.navLabel}>My Projects</Text>
                  <Text style={styles.navSubLabel}>View and manage your research projects.</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={TOKENS.mutedText} />
            </Pressable>
          </View>
        </View>

        {/* Account Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Management</Text>
          <View style={styles.cardBody}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Ionicons name="mail-outline" size={20} color={TOKENS.primary} />
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
                <Ionicons name="lock-closed-outline" size={20} color={TOKENS.primary} />
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
                <Ionicons name="trash-outline" size={20} color={TOKENS.destructive} />
                <Text style={[styles.rowLabel, { color: TOKENS.destructive }]}>Delete account</Text>
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
                <Ionicons name="notifications-outline" size={20} color={TOKENS.primary} />
                <Text style={styles.navLabel}>Customize notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={TOKENS.mutedText} />
            </Pressable>
          </View>
        </View>

        {/* Display */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Display</Text>
          <View style={styles.cardBody}>
            <View style={styles.switchRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon-outline" size={20} color={TOKENS.primary} />
                <Text style={styles.rowLabel}>Dark mode</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <View style={styles.cardBody}>
            <Pressable
              onPress={() =>
                Alert.alert('Terms', 'Terms & Conditions screen not wired in this file.')
              }
              style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
            >
              <View style={styles.navLeft}>
                <Ionicons name="document-text-outline" size={20} color={TOKENS.mutedText} />
                <Text style={styles.navLabel}>Terms and Conditions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={TOKENS.mutedText} />
            </Pressable>
          </View>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>

      {/* Change Email Modal */}
      <SheetModal
        visible={showEmailDialog}
        title="Change Email Address"
        description="Update your email address. You'll need to enter your current password to confirm."
        onClose={() => setShowEmailDialog(false)}
      >
        <Field label="New email address">
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            placeholderTextColor={TOKENS.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </Field>
        <Field label="Confirm new email address">
          <TextInput
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            placeholder="Confirm new email address"
            placeholderTextColor={TOKENS.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </Field>
        <Field label="Current password">
          <TextInput
            value={emailPassword}
            onChangeText={setEmailPassword}
            placeholder="Enter your current password"
            placeholderTextColor={TOKENS.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        {!!emailError && <ErrorBox message={emailError} />}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonOutline]}
            onPress={() => setShowEmailDialog(false)}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleEmailChange}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>Update Email</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* Change Password Modal */}
      <SheetModal
        visible={showPasswordDialog}
        title="Change Password"
        description="Enter your current password and choose a new one. Passwords must be at least 8 characters long."
        onClose={() => setShowPasswordDialog(false)}
      >
        <Field label="Current password">
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={TOKENS.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        <Field label="New password">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={TOKENS.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        <Field label="Confirm new password">
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={TOKENS.placeholder}
            secureTextEntry
            style={styles.input}
          />
        </Field>
        {!!passwordError && <ErrorBox message={passwordError} />}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonOutline]}
            onPress={() => setShowPasswordDialog(false)}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, styles.buttonPrimary]}
            onPress={handlePasswordChange}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* Delete Account Modal */}
      <ConfirmModal
        visible={showDeleteDialog}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including all journey recordings, observations, photos, and videos."
        confirmText="Delete Account"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
      />

      {/* Notifications Modal */}
      <SheetModal
        visible={showNotificationsDialog}
        title="Notification Settings"
        description="Manage your notification preferences. More options will be available soon."
        onClose={() => setShowNotificationsDialog(false)}
      >
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Disable all notifications</Text>
          <Switch
            value={!notificationsEnabled}
            onValueChange={(checked) => setNotificationsEnabled(!checked)}
          />
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
    </SafeAreaView>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ height: 8 }} />
      {children}
    </View>
  );
}

function ErrorBox({ message }: { message: string }) {
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
}: {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            {!!description && <Text style={styles.sheetDesc}>{description}</Text>}
          </View>
          <View style={styles.sheetBody}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({
  visible,
  title,
  description,
  confirmText,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdropSolid}>
        <View style={styles.confirmBox}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={{ height: 8 }} />
          <Text style={styles.sheetDesc}>{description}</Text>
          <View style={{ height: 16 }} />
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.button, styles.buttonOutline]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ width: 12 }} />
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.button, styles.buttonDestructive]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.buttonTextSolid]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default SettingsScreen;
