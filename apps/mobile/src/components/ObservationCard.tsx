import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import TagPill from './TagPill';

export type ObservationStatus = 'Offline' | 'Synced';

export interface Observation {
  id: string;
  time: string;
  location?: string;
  description: string;
  tags: string[];
  hasAudio?: boolean;
  status?: ObservationStatus;
}

// adjust path if you put the icon somewhere else
const audioIcon = require('../assets/icons/audio.png');
const locationIcon = require('../assets/icons/location-pin.png');
const editIcon = require('../assets/icons/edit.png');

interface ObservationCardProps {
  observation: Observation;
}

const ObservationCard: React.FC<ObservationCardProps> = ({ observation }) => {
  const { time, location, description, tags, hasAudio, status } = observation;

  return (
    <View style={styles.card}>
      {/* Top row: time + location + status + Edit */}
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
          {status ? (
            <View
              style={[
                styles.statusBadge,
                status === 'Offline' && styles.statusOffline,
              ]}
            >
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}
          <View style={styles.editRow}>
            <Image source={editIcon} style={styles.editIcon} />
            <Text style={styles.editText}>Edit</Text>
          </View>
        </View>
      </View>

      {/* Main description */}
      <Text style={styles.description}>{description}</Text>

      {/* Tags */}
      {tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      {/* Audio banner */}
      {hasAudio ? (
        <View style={styles.audioRow}>
          <Image source={audioIcon} style={styles.audioIcon} />
          <Text style={styles.audioText}>Audio recording available</Text>
        </View>
      ) : null}
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
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  audioIcon: {
    width: 16,
    height: 16,
    tintColor: '#9CA3AF',
    marginRight: 6,
  },
  audioText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
});

export default ObservationCard;
