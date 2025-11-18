import React from 'react';
import { KeyboardAvoidingView, Platform, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/AuthScreenLayout.styles';

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerWrapper}>
            {/* top text */}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            {/* card wrapper */}
            <View style={styles.card}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreenLayout;
