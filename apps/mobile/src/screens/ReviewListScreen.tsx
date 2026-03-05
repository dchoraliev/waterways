import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@waterways/shared/src/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { createReviewListScreenStyles } from '../styles/ReviewListScreen.styles';
import { useTheme } from '../contexts/ThemeContext';

interface SubmittedJourney {
  id: string;
  location: string;
  duration: number; // seconds
  observationCount: number;
  submittedDate: string;
  projectName: string;
}

type TripRow = {
  id: string;
  user_id: string | null;
  project_id: string | null;
  start_time: string | null;
  end_time: string | null;
  start_location: string | null;
  end_location: string | null;
  created_at: string;
  unique_userID_localID_pair: string | null;
};

type ObservationTripRow = {
  trip_id: string | null;
};

type ProjectNameRow = {
  id: string;
  name: string;
};

const ReviewListScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createReviewListScreenStyles(colors), [colors]);
  const { userId, loading: authLoading } = useAuth();
  const [submittedJourneys, setSubmittedJourneys] = useState<SubmittedJourney[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);

      if (authLoading) {
        return;
      }

      if (!userId) {
        setSubmittedJourneys([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('trips')
        .select(
          'id, user_id, project_id, start_time, end_time, start_location, end_location, created_at, unique_userID_localID_pair'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const trips = data as TripRow[];
        const tripIds = trips.map((row) => row.id);
        const projectIds = Array.from(
          new Set(trips.map((row) => row.project_id).filter(Boolean))
        ) as string[];
        let observationCounts: Record<string, number> = {};
        let projectNames: Record<string, string> = {};

        if (tripIds.length > 0) {
          const { data: observationRows } = await supabase
            .from('observations')
            .select('trip_id')
            .in('trip_id', tripIds)
            .eq('user_id', userId);

          const typedObservationRows = (observationRows ?? []) as ObservationTripRow[];
          observationCounts = typedObservationRows.reduce<Record<string, number>>((acc, row) => {
            const tripId = row.trip_id;
            if (tripId) {
              acc[tripId] = (acc[tripId] ?? 0) + 1;
            }
            return acc;
          }, {});
        }

        if (projectIds.length > 0) {
          const { data: projectRows } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', projectIds);

          const typedProjectRows = (projectRows ?? []) as ProjectNameRow[];
          projectNames = typedProjectRows.reduce<Record<string, string>>((acc, row) => {
            acc[row.id] = row.name;
            return acc;
          }, {});
        }

        const mapped = trips.map((row) => {
          const start = row.start_time ? new Date(row.start_time) : null;
          const end = row.end_time ? new Date(row.end_time) : null;
          const duration =
            start && end ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)) : 0;

          const location =
            [row.start_location, row.end_location].filter(Boolean).join(' → ').trim() ||
            'Unknown location';

          return {
            id: row.id,
            location,
            duration,
            observationCount: observationCounts[row.id] ?? 0,
            submittedDate: new Date(row.created_at).toLocaleDateString(),
            projectName: row.project_id
              ? (projectNames[row.project_id] ?? 'Unknown project')
              : 'Unknown project',
          };
        });

        setSubmittedJourneys(mapped);
      }

      setLoading(false);
    };

    fetchTrips();
  }, [authLoading, userId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Previous Journeys</Text>
            <Text style={styles.subtitle}>View your submitted journey history</Text>
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

        {loading ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : submittedJourneys.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No Journeys Yet</Text>
            <Text style={styles.emptySubtitle}>Your submitted journeys will appear here</Text>
          </View>
        ) : (
          <View>
            {submittedJourneys.map((journey) => (
              <Pressable
                key={journey.id}
                onPress={() => router.push(`/review/${journey.id}/observations`)}
                style={styles.card}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>📅 {journey.submittedDate}</Text>
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.cardMeta}>⏱️ {formatDuration(journey.duration)}</Text>
                    </View>
                    <View style={styles.tagRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{journey.observationCount} observations</Text>
                      </View>
                      <View style={[styles.tag, styles.tagMuted]}>
                        <Text style={styles.tagMutedText}>{journey.projectName}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewListScreen;
