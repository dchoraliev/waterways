import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { classifyObservation } from '../services/ObservationClassifier';
import { createReviewScreenStyles } from '../styles/ReviewScreen.styles';
import ObservationCard, { Observation } from '../components/ObservationCard';
import PrimaryButton from '../components/form/PrimaryButton';
import { JourneyDraft, useDraftJourneys } from '../hooks/useDraftJourneys';
import ProjectSelector from '../components/ProjectSelector';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { syncTrip } from '../database/SyncManager';
import { getObservationsByTripId } from '../database/ObservationManager';
import { Observation as DBObservation } from '@waterways/shared/src/models/local-db-rows';
import { useTheme } from '../contexts/ThemeContext';

export interface ReviewScreenProps {
  tripId?: string;
}

// Sample observations for placeholder journeys
const DEFAULT_SAMPLE_OBSERVATIONS: Observation[] = [
  {
    id: 'obs-1',
    time: '04:08 AM',
    location: '',
    description:
      'Butterfly activity notably high. Counted at least 12 monarch butterflies on the milkweed plants. Weather conditions ideal - sunny with light breeze.',
    tags: ['comment'],
    hasAudio: true,
    status: 'Offline',
  },
  {
    id: 'obs-2',
    time: '04:25 AM',
    location: '',
    description:
      'Evidence of small mammal activity. Found fresh tracks in the mud near the water source, likely raccoon based on size and shape.',
    tags: ['mammal', 'water quality'],
    hasAudio: false,
    status: 'Offline',
  },
];

/**
 * Convert database observation to UI observation format
 */
function dbObservationToUIObservation(dbObs: DBObservation): Observation {
  const time = dbObs.created_at
    ? new Date(dbObs.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const location =
    dbObs.latitude != null && dbObs.longitude != null
      ? `${dbObs.latitude.toFixed(6)}, ${dbObs.longitude.toFixed(6)}`
      : '';

  return {
    id: dbObs.id,
    time,
    location,
    description: dbObs.observation || '',
    tags: dbObs.category_id ? [dbObs.category_id] : [],
    hasAudio: !!dbObs.audio_media_id,
    status: dbObs.sync_status === 'synced' ? 'Synced' : 'Offline',
  };
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ tripId: propTripId }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createReviewScreenStyles(colors), [colors]);
  const params = useLocalSearchParams<{ id?: string; tripId?: string }>();
  const { getDraftByTripId, saveDraft } = useDraftJourneys();

  // Get tripId from props, route param [id], or query param tripId
  const tripId =
    propTripId ||
    (typeof params.id === 'string' ? params.id : params.id?.[0]) ||
    (typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0]) ||
    'sample-trip';

  const { userId, loading: authLoading } = useAuth();

  const [existingJourney, setExistingJourney] = useState<JourneyDraft | null | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [dbObservations, setDbObservations] = useState<DBObservation[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    existingJourney?.projectId || null
  );

  const [baseCreatedAt, setBaseCreatedAt] = useState(0);

  // Function to load all data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load DB observations for real trips
      if (tripId !== 'sample-trip') {
        const observations = await getObservationsByTripId(tripId);
        setDbObservations(observations || []);
      }

      // Load draft journey
      const journey = await getDraftByTripId(tripId);
      setExistingJourney(journey);

      if (journey) {
        setSelectedProjectId(journey.projectId || null);
        setBaseCreatedAt(journey.createdAt ?? 0);
      } else {
        setBaseCreatedAt(0);
      }
    } catch (error) {
      console.error('[ReviewScreen] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [tripId, getDraftByTripId]);
  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus (returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  // While loading
  if (loading || existingJourney === undefined) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textPrimary, marginTop: 16 }}>Loading observations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine which observations to use
  const rawObservations =
    existingJourney?.observations ||
    (tripId === 'sample-trip'
      ? DEFAULT_SAMPLE_OBSERVATIONS
      : dbObservations.map(dbObservationToUIObservation));
  // MERGED: Only auto-classify if the observation hasn't been manually edited
  const observations = rawObservations.map((obs) => {
    // If observation was manually edited, preserve its category and keyword
    if (obs.manuallyEdited) {
      return obs;
    }

    // Otherwise, auto-classify
    const result = classifyObservation(obs.description || '');

    return {
      ...obs,
      category: result.category === 'Unclassified' ? null : result.category,
      keyword: result.keyword,
    };
  });

  const handleSaveDraft = () => {
    saveDraft({
      id: tripId,
      createdAt: baseCreatedAt,
      status: 'draft',
      observations,
      projectId: selectedProjectId,
    });

    router.replace(ROUTES.home);
  };

  const handleSubmitJourney = async () => {
    saveDraft({
      id: tripId,
      createdAt: baseCreatedAt,
      status: 'submitted',
      observations,
      projectId: selectedProjectId,
    });

    // Sync the trip to backend
    if (tripId !== 'sample-trip') {
      try {
        await syncTrip(tripId);
      } catch (error) {
        console.error('[ReviewScreen] Failed to sync trip:', error);
        // Continue anyway - will sync later
      }
    }

    router.replace(ROUTES.home);
  };

  // Guard against rendering if auth status is still loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ color: colors.textPrimary, textAlign: 'center', marginTop: 50 }}>
          Loading user data...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Journey review</Text>
          <Text style={styles.subtitle}>Trip ID: {tripId}</Text>
        </View>

        {/* Observations list */}
        {observations.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>
              No observations recorded for this journey.
            </Text>
          </View>
        ) : (
          observations.map((obs, index) => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onEdit={() =>
                router.push({
                  pathname: '../edit-observation',
                  params: {
                    id: obs.id,
                    tripId: tripId,
                    observationIndex: index.toString(),
                  },
                })
              }
            />
          ))
        )}

        {/* Project Assignment */}
        <ProjectSelector
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          userId={userId || '00000000-0000-0000-0000-000000000000'}
        />

        {/* Offline info banner */}
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            You have {observations.length} observation{observations.length !== 1 ? 's' : ''} that
            will be uploaded automatically when internet connection is restored.
          </Text>
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.saveDraftButton}
            onPress={handleSaveDraft}
          >
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>

          <PrimaryButton
            label="Submit Journey"
            onPress={handleSubmitJourney}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewScreen;
