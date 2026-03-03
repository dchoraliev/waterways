import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import styles from '../styles/TripRecoveryModal.styles';

export interface IncompleteTrip {
  id: string;
  start_time: number;
  observationCount: number;
  mediaCount: number;
  lastSaved: number;
  isReviewing: boolean;
}

interface TripRecoveryModalProps {
  visible: boolean;
  trip: IncompleteTrip | null;
  onResume: () => void;
  onDiscard: () => void;
}

export default function TripRecoveryModal({
  visible,
  trip,
  onResume,
  onDiscard,
}: TripRecoveryModalProps) {
  // Move Date.now() call outside of render to fix purity issue
  const [currentTime] = React.useState(() => Date.now());

  // Early return if no trip or not visible
  if (!visible || !trip) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const timeAgo = (timestamp: number) => {
    const minutes = Math.floor((currentTime - timestamp) / 60000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onDiscard}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>🔄</Text>
            <Text style={styles.title}>Incomplete Journey Found</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            We found an incomplete journey that was interrupted. Would you like to resume it?
          </Text>

          {/* Trip Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Started:</Text>
              <Text style={styles.infoValue}>{formatDate(trip.start_time)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time ago:</Text>
              <Text style={styles.infoValue}>{timeAgo(trip.start_time)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last saved:</Text>
              <Text style={styles.infoValue}>{timeAgo(trip.lastSaved)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Observations:</Text>
              <Text style={styles.infoValue}>{trip.observationCount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Photos/Videos:</Text>
              <Text style={styles.infoValue}>{trip.mediaCount}</Text>
            </View>
          </View>

          {/* Warning */}
          {trip.observationCount > 0 && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ If you discard this journey, all {trip.observationCount} observation
                {trip.observationCount !== 1 ? 's' : ''} and {trip.mediaCount} media file
                {trip.mediaCount !== 1 ? 's' : ''} will be permanently deleted.
              </Text>
            </View>
          )}

          {/* Actions - Only Resume and Discard */}
          <View style={styles.actions}>
            {/* Discard Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.discardButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onDiscard}
            >
              <Text style={styles.discardButtonText}>Discard Journey</Text>
            </Pressable>

            {/* Resume Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.resumeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onResume}
            >
              <Text style={styles.resumeButtonText}>Resume Journey</Text>
            </Pressable>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            This journey will remain saved until you resume or discard it.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
