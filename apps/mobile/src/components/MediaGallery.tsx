import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { getMediaForObservation } from '../services/MediaQueries';

interface MediaGalleryProps {
  observationId: string;
}

interface MediaItem {
  id: string;
  media_type: string;
  local_file_path: string;
  created_at?: number;
}

export default function MediaGallery({ observationId }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mediaFiles = await getMediaForObservation(observationId);
        if (mounted) {
          setMedia(mediaFiles as MediaItem[]);
        }
      } catch (error) {
        console.error('[MediaGallery] Failed to load media:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [observationId]);

  if (loading || media.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attached Media ({media.length})</Text>
      <View style={styles.grid}>
        {media.map((item) => (
          <View key={item.id} style={styles.mediaItem}>
            {item.media_type === 'image' ? (
              <Image
                source={{ uri: item.local_file_path }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : item.media_type === 'video' ? (
              <View style={[styles.thumbnail, styles.videoPlaceholder]}>
                <Text style={styles.videoIcon}>🎥</Text>
                <Text style={styles.videoText}>Video</Text>
              </View>
            ) : item.media_type === 'audio' ? (
              <View style={[styles.thumbnail, styles.audioPlaceholder]}>
                <Text style={styles.audioIcon}>🎵</Text>
                <Text style={styles.audioText}>Audio</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 64) / 3; // 3 thumbnails per row with padding

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  videoIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  videoText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  audioPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  audioIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  audioText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
