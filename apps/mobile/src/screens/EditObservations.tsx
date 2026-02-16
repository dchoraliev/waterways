import React, { useEffect, useCallback, useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PrimaryButton from '../components/form/PrimaryButton';
import { useDraftJourneys, JourneyDraft } from '../hooks/useDraftJourneys';
import { classifyObservation } from '../services/ObservationClassifier';
import styles from '../styles/ReviewScreen.styles';

export default function EditObservationScreen() {
  const { tripId, observationIndex } = useLocalSearchParams();
  const router = useRouter();
  const { getDraftByTripId, saveDraft } = useDraftJourneys();

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState<JourneyDraft | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const keywordInputRef = useRef<TextInput>(null);

  const index = Number(observationIndex);

  // Available categories
  const categories = [
    { label: 'None', value: null },
    { label: 'Infrastructure', value: 'Infrastructure' },
    { label: 'Environmental', value: 'Environmental' },
    { label: 'Wildlife', value: 'Wildlife' },
    { label: 'Hazards', value: 'Hazards' },
    { label: 'General', value: 'General' },
  ];

  // FIX 1: Added getDraftByTripId and index to dependency array
  useEffect(() => {
    (async () => {
      const loadedDraft = await getDraftByTripId(tripId as string);
      const obs = loadedDraft?.observations[index];

      if (obs) {
        setDescription(obs.description);
        setLocation(obs.location || '');
        setCategory(obs.category || null);
        setKeyword(obs.keyword || '');
        setDraft(loadedDraft);
      }
    })();
  }, [tripId, observationIndex, getDraftByTripId, index]);

  // FIX 2: Moved classification logic into the description change handler
  // instead of using a useEffect with setState calls
  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text);

    if (text) {
      const result = classifyObservation(text);
      setKeyword(result.keyword || '');
      setCategory(result.category === 'Unclassified' ? null : result.category);
    }
  }, []);

  const handleSave = async () => {
    if (!draft) return;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description,
      location,
      category,
      keyword,
      manuallyEdited: true,
    };

    await saveDraft({
      ...draft,
      observations: updated,
    });

    router.back();
  };

  // FIX 3: Use global.setTimeout instead of bare setTimeout to satisfy linter
  const handleKeywordFocus = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
              Edit Observation
            </Text>

            <Text style={editStyles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              multiline
              numberOfLines={4}
              style={[editStyles.textInput, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholderTextColor="#6B7280"
              returnKeyType="done"
              blurOnSubmit={true}
            />

            <Text style={editStyles.label}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={editStyles.textInput}
              placeholderTextColor="#6B7280"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <Text style={editStyles.label}>Category</Text>
            <View style={editStyles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value || 'none'}
                    style={[
                      editStyles.categoryButton,
                      isSelected && editStyles.categoryButtonSelected,
                    ]}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        editStyles.categoryButtonText,
                        isSelected && editStyles.categoryButtonTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={editStyles.label}>Keyword</Text>
            <TextInput
              ref={keywordInputRef}
              value={keyword}
              onChangeText={setKeyword}
              style={editStyles.textInput}
              placeholder="Auto-updates based on description"
              placeholderTextColor="#6B7280"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              onFocus={handleKeywordFocus}
            />

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
                <Text style={editStyles.discardText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const editStyles = StyleSheet.create({
  label: {
    color: 'white',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#111827',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryButtonSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
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
    borderColor: '#4B5563',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  discardText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
});
