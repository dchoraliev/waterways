import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  SafeAreaView,
  Linking,
  Alert,
  Share,
  Platform,
  ScrollView,
  //Dimensions,
  ShareContent,
} from 'react-native';
import TagPill from './TagPill';
import locationIcon from '../assets/icons/location-pin.png';
import editIcon from '../assets/icons/edit.png';
import mediaIcon from '../assets/icons/media_attached_icon.png';
import videoIcon from '../assets/icons/video_attached.png';

export type ObservationStatus = 'Offline' | 'Synced' | 'Error';

export interface Observation {
  id: string;
  time: string;
  location?: string;
  description: string;
  tags: string[];
  hasAudio?: boolean;
  hasMedia?: boolean;
  mediaType?: 'photo' | 'video' | null;
  mediaTimestamp?: number | null;
  mediaFilePath?: string | null; // Local file path or URL
  status?: ObservationStatus;
  category?: string | null;
  keyword?: string | null;
  manuallyEdited?: boolean;
}

interface ObservationCardProps {
  observation: Observation;
  onEdit?: () => void;
}

function ensureUri(path: string): string {
  if (/^[a-zA-Z]+:\/\//.test(path)) return path;
  return `file://${path}`;
}

async function openVideoExternally(path: string) {
  const uri = encodeURI(ensureUri(path));

  // 1) Try direct open
  try {
    const canOpen = await Linking.canOpenURL(uri);
    if (canOpen) {
      await Linking.openURL(uri);
      return;
    }
  } catch {
    // ignore and fall back
  }

  // 2) Fallback: Share sheet (built-in, no installs)
  try {
    const content: ShareContent = Platform.OS === 'ios' ? { url: uri } : { message: uri };

    await Share.share(content);
  } catch (e) {
    console.warn('[ObservationCard] Failed to open video externally', e);
    Alert.alert(
      'Unable to open video',
      'Your device could not open this video file. If this is a local file, try saving it to Photos/Files first.'
    );
  }
}

const ZoomableImageIOS: React.FC<{ uri: string }> = ({ uri }) => {
  //const { width, height } = Dimensions.get('window');

  // iOS-only native zoom support
  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.zoomRoot}>
        <Image source={{ uri }} style={styles.zoomImage} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={styles.zoomRoot}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.zoomScrollContent}
        minimumZoomScale={1}
        maximumZoomScale={4}
        bouncesZoom
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        centerContent
      >
        <Image source={{ uri }} style={styles.zoomImageIOS} resizeMode="contain" />
      </ScrollView>

      <View style={styles.zoomHintWrap} pointerEvents="none">
        <Text style={styles.zoomHintText}>Pinch to zoom • Drag to pan</Text>
      </View>
    </View>
  );
};

const ObservationCard: React.FC<ObservationCardProps> = ({ observation, onEdit }) => {
  const { time, location, description, tags, status } = observation;

  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  function getCategoryColor(cat: string): string {
    switch (cat) {
      case 'Infrastructure':
        return '#3B82F6';
      case 'Environmental':
        return '#10B981';
      case 'Wildlife':
        return '#F59E0B';
      case 'Hazards':
        return '#EF4444';
      case 'General':
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  }

  const hasValidMedia = observation.hasMedia === true && !!observation.mediaFilePath;
  const mediaUri = hasValidMedia ? ensureUri(observation.mediaFilePath as string) : null;

  const isPhoto = observation.mediaType === 'photo';
  const isVideo = observation.mediaType === 'video';

  return (
    <View style={styles.card}>
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

          {observation.hasMedia === true && (
            <View style={styles.mediaRow}>
              <Image
                testID="media-icon"
                source={observation.mediaType === 'video' ? videoIcon : mediaIcon}
                style={styles.mediaIcon}
              />
            </View>
          )}

          <TouchableOpacity style={styles.editRow} onPress={onEdit}>
            <Image source={editIcon} style={styles.editIcon} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </View>
      )}

      {(observation.category || observation.keyword) && (
        <View style={styles.classificationRow}>
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

          {observation.keyword && (
            <Text style={styles.keywordText}>
              <Text style={styles.keywordLabel}>Keyword: </Text>
              {observation.keyword}
            </Text>
          )}
        </View>
      )}

      {/* View Media Button */}
      {hasValidMedia && (
        <View style={styles.mediaSection}>
          <TouchableOpacity
            style={styles.viewMediaButton}
            onPress={() => {
              if (isPhoto) {
                setPhotoModalVisible(true);
              } else if (isVideo) {
                Alert.alert(
                  'Video preview not available',
                  'This build does not include an in-app video player. You can open the video in your device player instead.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open Video',
                      onPress: () => openVideoExternally(observation.mediaFilePath as string),
                    },
                  ]
                );
              } else {
                Alert.alert('Media type unknown', 'Cannot preview this media.');
              }
            }}
          >
            <Text style={styles.viewMediaText}>
              {isPhoto ? 'View Photo' : isVideo ? 'View Video' : 'View Media'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* In-app photo viewer modal */}
      {isPhoto && mediaUri && (
        <Modal
          visible={photoModalVisible}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <SafeAreaView style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setPhotoModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ZoomableImageIOS uri={mediaUri} />
            </View>
          </SafeAreaView>
        </Modal>
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
    gap: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#065F46',
  },
  statusOffline: {
    backgroundColor: '#92400E',
  },
  statusText: {
    fontSize: 11,
    color: '#F9FAFB',
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaIcon: {
    width: 18,
    height: 18,
    tintColor: '#9CA3AF',
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
  classificationRow: {
    marginTop: 8,
    gap: 4,
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
    color: '#D1D5DB',
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
  mediaSection: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  viewMediaButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewMediaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  zoomScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImageIOS: {
    width: '100%',
    height: '100%',
  },

  // Modal styles
  modalRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },

  // Zoom viewer styles
  zoomRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  zoomHintWrap: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  zoomHintText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ObservationCard;
