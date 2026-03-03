import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@waterways/shared/src/supabase/client';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/ReviewObservationsScreen.styles';
import { classifierTagCategoryMap, classifierTagPalette } from '../styles/colors';

type ObservationRow = {
  id: string;
  created_at: string;
  observation: string | null;
  categories: string[] | null;
  trip_id: string | null;
  user_id: string | null;
};

type TripRow = {
  id: string;
  project_id: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  user_id: string | null;
};

type ObservationUI = {
  id: string;
  time: string;
  description: string;
  tags: string[];
};

const ReviewObservationsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, loading: authLoading } = useAuth();

  const [observations, setObservations] = useState<ObservationUI[]>([]);
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [projectName, setProjectName] = useState<string>('Unknown project');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripAndObservations = async () => {
      setLoading(true);

      if (authLoading) {
        return;
      }

      if (!userId || !id) {
        setObservations([]);
        setTrip(null);
        setLoading(false);
        return;
      }

      const { data: tripData } = await supabase
        .from('trips')
        .select('id, project_id, start_time, end_time, created_at, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!tripData) {
        setTrip(null);
        setObservations([]);
        setProjectName('Unknown project');
        setLoading(false);
        return;
      }

      setTrip(tripData);

      if (tripData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', tripData.project_id)
          .maybeSingle();

        setProjectName(projectData?.name ?? 'Unknown project');
      } else {
        setProjectName('Unknown project');
      }

      const { data: obsData, error: obsError } = await supabase
        .from('observations')
        .select('id, created_at, observation, categories, trip_id, user_id')
        .eq('trip_id', id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!obsError && obsData) {
        const mapped = (obsData as ObservationRow[]).map((row) => {
          const createdAt = new Date(row.created_at);
          return {
            id: row.id,
            time: createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            description: row.observation ?? 'No observation text',
            tags: row.categories ?? [],
          };
        });

        setObservations(mapped);
      }

      setLoading(false);
    };

    fetchTripAndObservations();
  }, [authLoading, userId, id]);

  const observationCount = observations.length;

  const duration = (() => {
    if (!trip?.start_time || !trip?.end_time) return 0;
    const start = new Date(trip.start_time).getTime();
    const end = new Date(trip.end_time).getTime();
    return Math.max(0, Math.floor((end - start) / 1000));
  })();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTagStyle = (tag: string) => {
    const key = tag.toLowerCase();
    const category = classifierTagCategoryMap[key] ?? 'default';
    return classifierTagPalette[category];
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Journey Details <Text style={styles.headerTitleMuted}>· {projectName}</Text>
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryItem}>
            📅 {trip?.created_at ? new Date(trip.created_at).toLocaleDateString() : '—'}
          </Text>
          <Text style={styles.summaryMuted}>⏱️ {formatDuration(duration)}</Text>
          <View style={styles.summaryTag}>
            <Text style={styles.summaryTagText}>{observationCount} observations</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Observations</Text>

        {loading ? (
          <ActivityIndicator color="#94a3b8" />
        ) : observations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No observations recorded</Text>
          </View>
        ) : (
          <View>
            {observations.map((obs) => (
              <View key={obs.id} style={styles.card}>
                {/* Time + Tags */}
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMetaText}>🕒 {obs.time}</Text>
                  {obs.tags.map((tag, index) => {
                    const tagStyle = getTagStyle(tag);
                    return (
                      <View
                        key={`${obs.id}-${index}`}
                        style={[styles.tag, { backgroundColor: tagStyle.bg }]}
                      >
                        <Text style={[styles.tagText, { color: tagStyle.text }]}>{tag}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Description */}
                <Text style={styles.description}>{obs.description}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewObservationsScreen;
