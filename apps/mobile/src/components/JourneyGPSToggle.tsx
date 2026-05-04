import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface JourneyGPSToggleProps {
  onToggle?: (enabled: boolean) => void;
  style?: ViewStyle;
}

export function JourneyGPSToggle({ onToggle, style }: JourneyGPSToggleProps) {
  const [useImprovedGPS, setUseImprovedGPS] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSetting = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem('@waterways:use_improved_gps');
      const enabled = value === 'true';
      setUseImprovedGPS(enabled);
      onToggle?.(enabled);
    } catch (error) {
      console.warn('[GPS Toggle] Failed to load setting:', error);
    } finally {
      setLoading(false);
    }
  }, [onToggle]);

  useEffect(() => {
    loadSetting();
  }, [loadSetting]);

  const handleToggle = async (value: boolean) => {
    try {
      setUseImprovedGPS(value);
      await AsyncStorage.setItem('@waterways:use_improved_gps', value.toString());
      onToggle?.(value);

      console.log('[GPS Toggle] Improved GPS:', value ? 'ENABLED' : 'DISABLED');
    } catch (error) {
      console.error('[GPS Toggle] Failed to save setting:', error);
      setUseImprovedGPS(!value);
    }
  };

  if (loading) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Ionicons name="locate" size={18} color="#888" style={styles.icon} />
        <Text style={styles.label}>Improved GPS (Beta)</Text>
        <Switch
          value={useImprovedGPS}
          onValueChange={handleToggle}
          trackColor={{ false: '#767577', true: '#4A9FD8' }}
          thumbColor={useImprovedGPS ? '#fff' : '#f4f3f4'}
        />
      </View>
      {useImprovedGPS && <Text style={styles.hint}>Using GPS averaging & outlier filtering</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 26, // Align with label
  },
});
