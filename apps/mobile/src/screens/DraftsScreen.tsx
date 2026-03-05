import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDraftJourneys } from '../hooks/useDraftJourneys';
import { createDraftsScreenStyles } from '../styles/DraftsScreen.styles';
import { useTheme } from '../contexts/ThemeContext';

const DraftsScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createDraftsScreenStyles(colors), [colors]);
  const { drafts } = useDraftJourneys();

  const draftJourneys = drafts.filter((j) => j.status === 'draft');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Saved drafts</Text>
          <Text style={styles.subtitle}>Review and submit journeys you&apos;ve saved.</Text>
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
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => router.push(`/review/${item.id}`)}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Journey {item.id}</Text>
                <Text style={styles.cardStatus}>Draft</Text>
              </View>
              <Text style={styles.cardMeta}>
                {item.observations.length} observations ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default DraftsScreen;
