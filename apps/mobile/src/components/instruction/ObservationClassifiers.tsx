import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ClassifierTag from './ClassifierTag';
import { CATEGORIES } from '../../services/ObservationClassifier';

const toTitleCase = (input: string) =>
  input
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const ObservationClassifiers = () => {
  const entries = Object.entries(CATEGORIES);

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
                  This category collects miscellaneous observations that don’t match other tags.
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
          Simply say the classifier name after your wake word to tag your observation.
        </Text>
      </View>
    </View>
  );
};

const classifierStyles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 5,
  },
  subtitle: {
    color: '#cbd5e1',
    marginBottom: 15,
    fontSize: 16,
  },
  category: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
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
    backgroundColor: '#3b82f6',
  },
  noteText: {
    color: '#F9FAFB',
    fontSize: 14,
    lineHeight: 20,
  },
  fallbackBox: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  fallbackText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
});

export default ObservationClassifiers;
