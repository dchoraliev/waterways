import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { classifyObservation } from '../services/ObservationClassifier';
import styles from '../styles/ReviewScreen.styles';
import ObservationCard, { Observation } from '../components/ObservationCard';
import PrimaryButton from '../components/form/PrimaryButton';
import { JourneyDraft, useDraftJourneys } from '../hooks/useDraftJourneys';
import ProjectSelector from '../components/ProjectSelector';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { SyncStatus, syncTrip } from '../database/SyncManager';
import { getObservationsByTripId } from '../database/ObservationManager';
import { getTripById } from '../database/TripManager';
import { Observation as DBObservation } from '@waterways/shared/src/models/local-db-rows';
import { showToast } from '../utils/toast';
import { updateTripById } from '../database/TripManager';

const ACTIVE_TRIP_KEY = '@waterways:active_trip_id';

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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveInProgressRef = useRef(false);
  const syncInProgressRef = useRef(false);
  const [baseCreatedAt, setBaseCreatedAt] = useState(0);

  // Active trip state
  const [isActiveTrip, setIsActiveTrip] = useState(false);

  // STABLE function - doesn't change between renders
  const checkAndLoadData = useCallback(async () => {
    if (tripId === 'sample-trip') {
      setIsActiveTrip(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Check trip status
      const trip = await getTripById(tripId);

      if (trip && !trip.end_time) {
        console.log('[ReviewScreen] Trip is active (no end_time)');
        setIsActiveTrip(true);
      } else {
        console.log('[ReviewScreen] Trip is complete (has end_time)');
        setIsActiveTrip(false);
      }

      // Load observations
      const observations = await getObservationsByTripId(tripId);
      setDbObservations(observations || []);

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
  }, [tripId, getDraftByTripId]); // ONLY tripId and getDraftByTripId

  // Load data on mount ONLY
  useEffect(() => {
    checkAndLoadData();
  }, [tripId, checkAndLoadData]); // ONLY reload when tripId changes

  // Reload ONLY when screen comes back into focus (not on every re-render)
  useFocusEffect(
    useCallback(() => {
      // Just reload, don't create new function
      void checkAndLoadData();
    }, [checkAndLoadData])
  );

  // Track unsaved changes when project is selected
  useEffect(() => {
    if (selectedProjectId && !loading) {
      setHasUnsavedChanges(true);
    }
  }, [selectedProjectId, loading]);

  // Determine which observations to use
  const rawObservations =
    existingJourney?.observations ||
    (tripId === 'sample-trip'
      ? DEFAULT_SAMPLE_OBSERVATIONS
      : dbObservations.map(dbObservationToUIObservation));

  // Memoize observations to prevent recreation
  const observations = useMemo(() => {
    return rawObservations.map((obs) => {
      if (obs.manuallyEdited) {
        return obs;
      }

      const result = classifyObservation(obs.description || '');

      return {
        ...obs,
        category: result.category === 'Unclassified' ? null : result.category,
        keyword: result.keyword,
      };
    });
  }, [rawObservations]);

  // Store in ref
  const observationsRef = useRef(observations);
  useEffect(() => {
    observationsRef.current = observations;
  }, [observations]);

  // Auto-save draft function
  const autoSaveDraft = useCallback(async () => {
    if (!hasUnsavedChanges || saveInProgressRef.current || tripId === 'sample-trip') {
      return;
    }

    saveInProgressRef.current = true;

    try {
      console.log('[ReviewScreen] Auto-saving draft before unmount...');

      await saveDraft({
        id: tripId,
        createdAt: baseCreatedAt || Date.now(),
        status: 'draft',
        observations: observationsRef.current,
        projectId: selectedProjectId,
      });

      console.log('[ReviewScreen] Draft auto-saved successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('[ReviewScreen] Auto-save failed:', error);
    } finally {
      saveInProgressRef.current = false;
    }
  }, [hasUnsavedChanges, tripId, selectedProjectId, baseCreatedAt, saveDraft]);

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && !saveInProgressRef.current) {
        void autoSaveDraft();
      }
    };
  }, [hasUnsavedChanges, autoSaveDraft]);

  // Handle continue journey
  const handleContinueJourney = useCallback(async () => {
    try {
      console.log('[ReviewScreen] Continuing active journey:', tripId);

      await AsyncStorage.setItem(ACTIVE_TRIP_KEY, tripId);

      router.replace('/journey');
    } catch (error) {
      console.error('[ReviewScreen] Error continuing journey:', error);
      showToast('Failed to continue journey');
    }
  }, [tripId, router]);

  // Handle save draft button
  const handleSaveDraft = useCallback(async () => {
    await saveDraft({
      id: tripId,
      createdAt: baseCreatedAt,
      status: 'draft',
      observations: observationsRef.current,
      projectId: selectedProjectId,
    });

    // Update the trip's project_id, and sync status as drafted
    updateTripById(tripId, { project_id: selectedProjectId, sync_status: SyncStatus.DRAFTED });

    setHasUnsavedChanges(false);
    router.replace(ROUTES.home);
  }, [tripId, baseCreatedAt, selectedProjectId, saveDraft, router]);

  // Handle submit journey button - PREVENT DUPLICATE SYNCS
  const handleSubmitJourney = useCallback(async () => {
    // Prevent duplicate sync calls
    if (syncInProgressRef.current) {
      console.log('[ReviewScreen] Sync already in progress, skipping');
      return;
    }

    syncInProgressRef.current = true;

    try {
      await saveDraft({
        id: tripId,
        createdAt: baseCreatedAt,
        status: 'submitted',
        observations: observationsRef.current,
        projectId: selectedProjectId,
      });

      setHasUnsavedChanges(false);

      // Sync the trip to backend (only if not sample)
      if (tripId !== 'sample-trip') {
        console.log('[ReviewScreen] Starting trip sync...');
        try {
          await updateTripById(tripId, {
            project_id: selectedProjectId,
            sync_status: SyncStatus.REVIEWED,
          });
          await syncTrip(tripId);
          console.log('[ReviewScreen] Trip sync completed');
        } catch (error) {
          console.error('[ReviewScreen] Failed to sync trip:', error);
          // Continue anyway - will sync later
        }
      }

      router.replace(ROUTES.home);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [tripId, baseCreatedAt, selectedProjectId, saveDraft, router]);

  // Guard against rendering if auth status is still loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ color: '#F9FAFB', textAlign: 'center', marginTop: 50 }}>
          Loading user data...
        </Text>
      </SafeAreaView>
    );
  }

  // While loading
  if (loading || existingJourney === undefined) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ color: '#F9FAFB', marginTop: 16 }}>Loading observations...</Text>
        </View>
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

        {/* Active journey banner */}
        {isActiveTrip && (
          <View style={styles.activeJourneyBanner}>
            <View style={styles.activeJourneyInfo}>
              <Text style={styles.activeJourneyIcon}>⏱️</Text>
              <View style={styles.activeJourneyTextContainer}>
                <Text style={styles.activeJourneyTitle}>Journey In Progress</Text>
                <Text style={styles.activeJourneySubtitle}>
                  This journey is still active. You can continue recording observations.
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.continueJourneyButton, pressed && { opacity: 0.8 }]}
              onPress={handleContinueJourney}
            >
              <Text style={styles.continueJourneyText}>Continue Journey</Text>
            </Pressable>
          </View>
        )}

        {/* Observations list */}
        {observations.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
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

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <View
            style={{ padding: 8, backgroundColor: '#92400E', borderRadius: 4, marginBottom: 12 }}
          >
            <Text style={{ color: '#FEF3C7', fontSize: 12 }}>
              • Unsaved changes (will auto-save when you leave)
            </Text>
          </View>
        )}

        {/* Bottom buttons */}
        <View style={styles.bottomButtonsRow}>
          {isActiveTrip ? (
            /* Active trip - show Save Draft and Continue Journey */
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.saveDraftButton, { flex: 1 }]}
                onPress={handleSaveDraft}
              >
                <Text style={styles.saveDraftText}>Save Draft</Text>
              </TouchableOpacity>

              <PrimaryButton
                label="Continue Journey"
                onPress={handleContinueJourney}
                style={[styles.submitButton, { flex: 1 }]}
              />
            </>
          ) : (
            /* Complete trip - show Save Draft and Submit Journey */
            <>
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
                disabled={syncInProgressRef.current}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewScreen;
