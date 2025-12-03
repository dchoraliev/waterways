import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { initializeDatabase } from './src/database/db';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App mounted, initializing database...');
    initializeDatabase()
      .then(() => {
        console.log('Database initialized successfully');
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error('Database initialization failed:', error);
        setError(error?.message || 'Unknown error');
      });
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing database...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.successText}>✓ Database initialized!</Text>
      <Text>Waterways App Ready</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    color: '#00aa00',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
