import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { AuthProvider } from './src/services/AuthContext';
import { Dashboard } from './src/pages/Dashboard';
import { Toaster } from './src/components/ui/sonner';
/*import './src/styles/globals.css' */

export default function App() {
  return (
    <AuthProvider>
      <div className="size-full">
        <Toaster />
        <Dashboard />
      </div>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
