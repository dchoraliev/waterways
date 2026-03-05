import React, { useMemo } from 'react';
import { KeyboardAvoidingView, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAuthScreenLayoutStyles } from '../styles/AuthScreenLayout.styles';
import { useTheme } from '../contexts/ThemeContext';

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({ title, subtitle, children }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createAuthScreenLayoutStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root}>
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
