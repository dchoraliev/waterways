import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import TagPill from './TagPill';
import locationIcon from '../assets/icons/location-pin.png';
import editIcon from '../assets/icons/edit.png';

export type ObservationStatus = 'Offline' | 'Synced' | 'Error';

export interface Observation {
  id: string;
  time: string;
  location?: string;
  description: string; // transcription text
  tags: string[];
  hasAudio?: boolean;
  status?: ObservationStatus;
  category?: string | null; // used ONLY for color coding
  keyword?: string | null; // shown as text: "Keyword: <keyword>"
}

interface ObservationCardProps {
  observation: Observation;
}

const ObservationCard: React.FC<ObservationCardProps> = ({ observation }) => {
  const { time, location, description, tags, status } = observation;

  function getCategoryColor(cat: string): string {
    switch (cat) {
      case 'Infrastructure':
        return '#3B82F6'; // blue
      case 'Environmental':
        return '#10B981'; // green
      case 'Wildlife':
        return '#F59E0B'; // amber
      case 'Hazards':
        return '#EF4444'; // red
      case 'General':
        return '#9CA3AF'; // gray
      default:
        return '#6B7280'; // neutral gray (Unclassified)
    }
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.timeLocationCol}>
          <Text style={styles.timeText}>{time}</Text>

          {location ? (
            <View style={styles.locationRow}>
              <Image source={locationIcon} style={styles.locationIcon} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.headerRight}>
          {status && (
            <View style={[styles.statusBadge, status === 'Offline' && styles.statusOffline]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}

          <View style={styles.editRow}>
            <Image source={editIcon} style={styles.editIcon} />
            <Text style={styles.editText}>Edit</Text>
          </View>
        </View>
      </View>

      {/* 🔹 Transcription text (only once) */}
      <Text style={styles.description}>{description}</Text>

      {/* 🔹 Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </View>
      )}
      {(observation.category || observation.keyword) && (
        <View style={styles.classificationRow}>
          {/* CATEGORY WITH SMALL COLOR DOT */}
          {observation.category && observation.category !== 'Unclassified' && (
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: getCategoryColor(observation.category) },
                ]}
              />
              <Text style={styles.categoryText}>{observation.category}</Text>
            </View>
          )}

          {/* KEYWORD TEXT */}
          {observation.keyword && (
            <Text style={styles.keywordText}>
              <Text style={styles.keywordLabel}>Keyword: </Text>
              {observation.keyword}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLocationCol: {
    flexShrink: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 14,
    height: 14,
    tintColor: '#9CA3AF',
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#065F46',
    marginRight: 8,
  },
  statusOffline: {
    backgroundColor: '#92400E',
  },
  statusText: {
    fontSize: 11,
    color: '#F9FAFB',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    width: 14,
    height: 14,
    tintColor: '#9CA3AF',
    marginRight: 4,
  },
  editText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  description: {
    fontSize: 13,
    color: '#F9FAFB',
    marginTop: 4,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  // 🔹 CATEGORY pill (color-coded)
  classificationRow: {
    marginTop: 8,
    gap: 4,
  },

  classificationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  classificationLabel: {
    fontWeight: '600',
    color: '#D1D5DB',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  categoryText: {
    fontSize: 12,
    color: '#D1D5DB', // soft bright gray
    fontWeight: '600',
  },

  keywordText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  keywordLabel: {
    fontWeight: '600',
    color: '#D1D5DB',
  },
});

export default ObservationCard;
