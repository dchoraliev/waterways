import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PrimaryButton from '../components/form/PrimaryButton';
import { useDraftJourneys, JourneyDraft } from '../hooks/useDraftJourneys';
import { classifyObservation, CATEGORIES } from '../services/ObservationClassifier';
import { createReviewScreenStyles } from '../styles/ReviewScreen.styles';
import { useTheme } from '../contexts/ThemeContext';
import { AppColors } from '../styles/colors';
import LocationPickerModal, {
  LatLng,
  OtherObservation,
  LeafletMapView,
} from '../components/LocationPickerModal';

export default function EditObservationScreen() {
  const { tripId, observationIndex } = useLocalSearchParams();
  const router = useRouter();
  const { getDraftByTripId, saveDraft } = useDraftJourneys();
  const { colors } = useTheme();
  const reviewStyles = useMemo(() => createReviewScreenStyles(colors), [colors]);
  const editStyles = useMemo(() => createEditObservationStyles(colors), [colors]);

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState<JourneyDraft | null>(null);

  // Map state
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [otherObservations, setOtherObservations] = useState<OtherObservation[]>([]);
  const [previewMapReady, setPreviewMapReady] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const keywordInputRef = useRef<TextInput>(null);

  const index = Number(observationIndex);
  const placeholderColor = colors.textMuted;
  const categoryEntries = Object.entries(CATEGORIES);

  useEffect(() => {
    (async () => {
      const loadedDraft = await getDraftByTripId(tripId as string);
      const obs = loadedDraft?.observations[index];

      if (obs) {
        setDescription(obs.description);
        setLocation(obs.location || '');
        const fallback =
          Object.entries(CATEGORIES).find(([_k, d]) => !!d?.is_fallback)?.[0] ?? null;
        setCategory(obs.category ?? fallback);
        setKeyword(obs.keyword || '');
        setDraft(loadedDraft);

        // Build sibling observations for map context
        if (loadedDraft?.observations) {
          const others: OtherObservation[] = loadedDraft.observations
            .map((o, i) => {
              if (i === index) return null;
              const coords = parseLocationCoords(o.location || '');
              if (!coords) return null;
              return {
                id: o.id,
                latitude: coords.latitude,
                longitude: coords.longitude,
                description: o.description,
              } as OtherObservation;
            })
            .filter((o): o is OtherObservation => o !== null);
          setOtherObservations(others);
        }
      }
    })();
  }, [tripId, observationIndex, getDraftByTripId, index]);

  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text);
    if (text) {
      const result = classifyObservation(text);
      setKeyword(result.keyword || '');
      if (result.category === 'OTHERS') {
        const fallback =
          Object.entries(CATEGORIES).find(([_k, d]) => !!d?.is_fallback)?.[0] ?? null;
        setCategory(fallback);
      } else {
        setCategory(result.category);
      }
    }
  }, []);

  const handleSave = async () => {
    if (!draft) return;

    // Update observation in memory
    const updated = [...draft.observations];
    const currentObs = updated[index];

    updated[index] = {
      ...currentObs,
      description,
      location,
      category,
      keyword,
      manuallyEdited: true,
      hasMedia: currentObs.hasMedia,
      mediaType: currentObs.mediaType,
      mediaTimestamp: currentObs.mediaTimestamp,
      mediaFilePath: currentObs.mediaFilePath,
    };

    // CRITICAL FIX: Save observation changes to database
    const locationCoords = parseLocationCoords(location);
    const { updateObservationById } = await import('../database/ObservationManager');

    await updateObservationById(currentObs.id, {
      observation: description,
      latitude: locationCoords?.latitude ?? null,
      longitude: locationCoords?.longitude ?? null,
      category_id: category,
    });

    console.log('[EditObservation] Saved observation to database:', currentObs.id);

    // Update draft in memory
    await saveDraft({ ...draft, observations: updated });
    router.back();
  };

  const handleKeywordFocus = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleLocationConfirm = useCallback((coords: LatLng) => {
    setLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    setLocationPickerVisible(false);
    // Reset preview so it reloads with new coordinates
    setPreviewMapReady(false);
  }, []);

  const currentLatLng = useMemo(() => parseLocationCoords(location), [location]);
  const hasLocation = currentLatLng !== null;

  return (
    <SafeAreaView style={reviewStyles.root} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={editStyles.titleText}>Edit Observation</Text>

            {/* Description */}
            <Text style={editStyles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              multiline
              numberOfLines={4}
              style={[editStyles.textInput, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholderTextColor={placeholderColor}
              returnKeyType="done"
              blurOnSubmit={true}
            />

            {/* Location */}
            <Text style={editStyles.label}>Location</Text>

            {/* Inline map preview — only shown when location is set */}
            {hasLocation && (
              <TouchableOpacity
                onPress={() => setLocationPickerVisible(true)}
                activeOpacity={0.9}
                style={editStyles.mapPreviewContainer}
              >
                {/* Non-interactive preview map */}
                <LeafletMapView
                  currentLocation={currentLatLng}
                  otherObservations={otherObservations}
                  interactive={false}
                  onLoad={() => setPreviewMapReady(true)}
                  style={editStyles.mapPreview}
                />

                {/* Loading shimmer while tiles load */}
                {!previewMapReady && (
                  <View style={editStyles.mapPreviewLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}

                {/* "Edit location" overlay badge */}
                <View style={editStyles.mapPreviewBadge}>
                  <Text style={editStyles.mapPreviewBadgeText}> Tap to edit location</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Coordinates row / tap-to-set button */}
            <TouchableOpacity
              onPress={() => setLocationPickerVisible(true)}
              activeOpacity={0.75}
              style={[editStyles.textInput, editStyles.locationButton]}
            >
              <Text
                style={[editStyles.locationButtonText, !location && { color: placeholderColor }]}
                numberOfLines={1}
              >
                {location || 'Tap to set location on map'}
              </Text>
              <Text style={editStyles.locationIcon}>📍</Text>
            </TouchableOpacity>

            {/* Category */}
            <Text style={editStyles.label}>Category</Text>
            <View style={editStyles.categoryGrid}>
              {categoryEntries.map(
                ([catName, data]: [
                  string,
                  { is_fallback: boolean; color: string; keywords: string[] },
                ]) => {
                  const isSelected = category === catName;
                  const borderColor = data?.color ?? colors.border;
                  return (
                    <TouchableOpacity
                      key={catName}
                      style={[
                        editStyles.categoryButton,
                        { borderColor },
                        isSelected && { backgroundColor: borderColor, borderColor },
                      ]}
                      onPress={() => setCategory(catName)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          editStyles.categoryButtonText,
                          isSelected && editStyles.categoryButtonTextSelected,
                        ]}
                      >
                        {catName}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            {/* Keyword */}
            <Text style={editStyles.label}>Keyword</Text>
            <TextInput
              ref={keywordInputRef}
              value={keyword}
              onChangeText={setKeyword}
              style={editStyles.textInput}
              placeholder="Auto-updates based on description"
              placeholderTextColor={placeholderColor}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              onFocus={handleKeywordFocus}
            />

            {/* Buttons */}
            <View style={editStyles.buttonContainer}>
              <PrimaryButton
                label="Save Changes"
                onPress={handleSave}
                style={editStyles.saveButton}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                style={editStyles.discardButton}
                onPress={() => router.back()}
              >
                <Text style={editStyles.discardText}>Discard Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Full-screen location picker modal */}
      <LocationPickerModal
        visible={locationPickerVisible}
        currentLocation={currentLatLng}
        otherObservations={otherObservations}
        onConfirm={handleLocationConfirm}
        onCancel={() => setLocationPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function parseLocationCoords(locationStr: string): LatLng | null {
  if (!locationStr) return null;
  const parts = locationStr.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { latitude: parts[0], longitude: parts[1] };
  }
  return null;
}

const createEditObservationStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    titleText: {
      color: themeColors.textPrimary,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    label: {
      color: themeColors.textPrimary,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '500',
    },
    textInput: {
      backgroundColor: themeColors.surface,
      color: themeColors.textPrimary,
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      fontSize: 16,
    },
    // Inline map preview
    mapPreviewContainer: {
      height: 150,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: themeColors.border,
      marginBottom: 10,
      position: 'relative',
    },
    mapPreview: {
      flex: 1,
    },
    mapPreviewLoading: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapPreviewBadge: {
      position: 'absolute',
      bottom: 10,
      alignSelf: 'center',
      backgroundColor: 'rgba(20,20,20,0.72)',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
    },
    mapPreviewBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    // Location row
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
    },
    locationButtonText: {
      color: themeColors.textPrimary,
      fontSize: 16,
      flex: 1,
    },
    locationIcon: {
      fontSize: 18,
      marginLeft: 8,
    },
    // Category
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    categoryButton: {
      backgroundColor: themeColors.surface,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    categoryButtonText: {
      color: themeColors.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
    categoryButtonTextSelected: {
      color: themeColors.textPrimary,
    },
    // Buttons
    buttonContainer: {
      gap: 12,
      marginTop: 8,
    },
    saveButton: {
      marginBottom: 0,
    },
    discardButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    discardText: {
      color: themeColors.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
  });
