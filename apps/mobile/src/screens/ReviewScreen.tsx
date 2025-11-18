import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import styles from '../styles/ReviewScreen.styles';
import ObservationCard, { Observation } from '../components/ObservationCard';
import PrimaryButton from '../components/form/PrimaryButton';
import { useDraftJourneys } from '../hooks/useDraftJourneys';
import { ROUTES } from '../constants/routes';

export interface ReviewScreenProps {
  tripId: string;
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

const ReviewScreen: React.FC<ReviewScreenProps> = ({ tripId }) => {
  const router = useRouter();
  const { getDraftById, saveDraft } = useDraftJourneys();

  const effectiveTripId = tripId || 'sample-trip';

  const existingJourney = getDraftById(effectiveTripId);
  const observations = existingJourney?.observations || DEFAULT_SAMPLE_OBSERVATIONS;

  // keep createdAt stable without calling Date.now in render/handlers
  const baseCreatedAt = existingJourney?.createdAt ?? 0;

  const handleSaveDraft = () => {
    saveDraft({
      id: effectiveTripId,
      createdAt: baseCreatedAt,
      status: 'draft',
      observations,
    });

    // stay on review or go home; for now go home
    router.replace(ROUTES.home);
  };

  const handleSubmitJourney = () => {
    saveDraft({
      id: effectiveTripId,
      createdAt: baseCreatedAt,
      status: 'submitted',
      observations,
    });

    // later this will also upload to the backend; for now just go home
    router.replace(ROUTES.home);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Journey review</Text>
          <Text style={styles.subtitle}>Trip ID: {effectiveTripId}</Text>
        </View>

        {/* Observations list */}
        {observations.map((obs) => (
          <ObservationCard key={obs.id} observation={obs} />
        ))}

        {/* Project assignment card */}
        <View style={styles.projectCard}>
          <Text style={styles.projectTitle}>Project Assignment</Text>
          <Text style={styles.projectSubtitle}>Research Project (Optional)</Text>

          <View style={styles.projectDropdown}>
            <Text style={styles.projectDropdownText}>No project selected</Text>
          </View>

          <View style={styles.projectButtonsRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>+ Create Project</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>+ Join Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline info banner */}
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            You have {observations.length} observations that will be uploaded automatically when
            internet connection is restored.
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
