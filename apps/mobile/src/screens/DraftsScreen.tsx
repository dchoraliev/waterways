import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDraftJourneys } from '../hooks/useDraftJourneys';
import { createDraftsScreenStyles } from '../styles/DraftsScreen.styles';
import { useTheme } from '../contexts/ThemeContext';
import { SyncStatus } from '../database/SyncStatus';
import { removeTripById } from '../database/TripManager';
import { showToast } from '../utils/toast';

const DraftsScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createDraftsScreenStyles(colors), [colors]);
  const { drafts, loadPendingDrafts } = useDraftJourneys();

  const draftJourneys = drafts.filter((j) => j.status === SyncStatus.DRAFTED);

  // FIXED: Reload drafts when screen comes into focus (after submissions)
  useFocusEffect(
    React.useCallback(() => {
      loadPendingDrafts();
    }, [loadPendingDrafts])
  );

  // Handle remove draft
  const handleRemoveDraft = React.useCallback(
    async (journeyId: string, observationCount: number) => {
      Alert.alert(
        'Remove Draft Journey',
        `Are you sure you want to remove this draft journey with ${observationCount} observation${observationCount !== 1 ? 's' : ''}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('[DraftsScreen] Removing draft journey:', journeyId);

                // Remove trip from database (cascades to observations)
                await removeTripById(journeyId);

                // Reload drafts to update UI
                await loadPendingDrafts();

                showToast('Draft journey removed');
                console.log('[DraftsScreen] Draft journey removed successfully');
              } catch (error) {
                console.error('[DraftsScreen] Failed to remove draft journey:', error);
                showToast('Failed to remove draft journey');
              }
            },
          },
        ]
      );
    },
    [loadPendingDrafts]
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Saved drafts</Text>
          <Text style={styles.subtitle}>Review, submit and remove journeys you&apos;ve saved.</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>

      {draftJourneys.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No draft journeys yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a journey and save it as a draft from the review screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={draftJourneys}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/review/${item.id}`)}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Journey {item.id}</Text>
                </View>
                <Text style={styles.cardMeta}>
                  {item.observations.length} observations ·{' '}
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleRemoveDraft(item.id, item.observations.length)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default DraftsScreen;
