import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ClassifierTag from './ClassifierTag';
import { CATEGORIES } from '../../services/ObservationClassifier';
import { useTheme } from '../../contexts/ThemeContext';

const toTitleCase = (input: string) =>
  input
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const ObservationClassifiers = () => {
  const { colors } = useTheme();
  const entries = Object.entries(CATEGORIES);

  const classifierStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 15,
          paddingTop: 10,
          paddingBottom: 5,
        },
        subtitle: {
          color: colors.textMuted,
          marginBottom: 15,
          fontSize: 16,
        },
        category: {
          marginBottom: 15,
        },
        categoryTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 8,
        },
        tagList: {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        noteBox: {
          marginTop: 15,
          padding: 15,
          borderRadius: 8,
          backgroundColor: colors.primary,
        },
        noteText: {
          color: colors.background,
          fontSize: 14,
          lineHeight: 20,
        },
        fallbackBox: {
          marginBottom: 8,
          padding: 10,
          borderRadius: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        fallbackText: {
          color: colors.textMuted,
          fontSize: 14,
        },
      }),
    [colors]
  );

  return (
    <View style={classifierStyles.container}>
      <Text style={classifierStyles.subtitle}>Available tags to classify your observations</Text>

      {entries.length === 0 ? (
        <Text style={[classifierStyles.subtitle, { marginBottom: 0 }]}>
          No categories available
        </Text>
      ) : (
        entries.map(([categoryName, data]) => (
          <View style={classifierStyles.category} key={categoryName}>
            <Text style={classifierStyles.categoryTitle}>{toTitleCase(categoryName)}</Text>
            {data.keywords.length === 0 && data.is_fallback ? (
              <View style={classifierStyles.fallbackBox}>
                <Text style={classifierStyles.fallbackText}>
                  {"This category collects miscellaneous observations that don't match other tags."}
                </Text>
              </View>
            ) : (
              <View style={classifierStyles.tagList}>
                {data.keywords.map((kw) => (
                  <ClassifierTag
                    key={`${categoryName}-${kw}`}
                    label={toTitleCase(kw)}
                    color={data.color}
                  />
                ))}
              </View>
            )}
          </View>
        ))
      )}

      <View style={classifierStyles.noteBox}>
        <Text style={classifierStyles.noteText}>
          Simply say the classifier name after your wake word to tag your observation. Multiple
          classifiers can be added to a single observation.
        </Text>
      </View>
    </View>
  );
};

export default ObservationClassifiers;
