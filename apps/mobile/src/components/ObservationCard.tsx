import React, { useMemo, useState } from 'react';
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
import { SyncStatus } from '../database/SyncStatus';
import { CATEGORIES } from '../services/ObservationClassifier';
import { useTheme } from '../contexts/ThemeContext';
import { AppColors } from '../styles/colors';
import videoIcon from '../assets/icons/video_attached.png';

export type ObservationStatus = SyncStatus;

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

const ZoomableImageIOS: React.FC<{
  uri: string;
  sharedStyles: ReturnType<typeof createSharedStyles>;
}> = ({ uri, sharedStyles }) => {
  //const { width, height } = Dimensions.get('window');

  // iOS-only native zoom support
  if (Platform.OS !== 'ios') {
    return (
      <View style={sharedStyles.zoomRoot}>
        <Image source={{ uri }} style={sharedStyles.zoomImage} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={sharedStyles.zoomRoot}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={sharedStyles.zoomScrollContent}
        minimumZoomScale={1}
        maximumZoomScale={4}
        bouncesZoom
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        centerContent
      >
        <Image source={{ uri }} style={sharedStyles.zoomImageIOS} resizeMode="contain" />
      </ScrollView>

      <View style={sharedStyles.zoomHintWrap} pointerEvents="none">
        <Text style={sharedStyles.zoomHintText}>Pinch to zoom • Drag to pan</Text>
      </View>
    </View>
  );
};

const ObservationCard: React.FC<ObservationCardProps> = ({ observation, onEdit }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createObservationCardStyles(colors), [colors]);
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const { time, location, description, tags, status } = observation;

  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const hasValidMedia = observation.hasMedia === true && !!observation.mediaFilePath;
  const mediaUri = hasValidMedia ? ensureUri(observation.mediaFilePath as string) : null;

  const isPhoto = observation.mediaType === 'photo';
  const isVideo = observation.mediaType === 'video';

  function getCategoryColor(cat: string): string {
    const category = Object.entries(CATEGORIES).find(
      ([key]) => key.toLowerCase() === cat.toLowerCase()
    );
    return category ? category[1].color : '#6B7280'; // default to gray if not found
  }

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
            <View
              style={[styles.statusBadge, status === SyncStatus.PENDING && styles.statusOffline]}
            >
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
          <SafeAreaView style={sharedStyles.modalRoot}>
            <View style={sharedStyles.modalHeader}>
              <Pressable
                onPress={() => setPhotoModalVisible(false)}
                style={sharedStyles.closeButton}
              >
                <Text style={sharedStyles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            <View style={sharedStyles.modalBody}>
              <ZoomableImageIOS uri={mediaUri} sharedStyles={sharedStyles} />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
};

function createObservationCardStyles(themeColors: AppColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.surface,
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
      color: themeColors.textMuted,
      marginBottom: 2,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationIcon: {
      width: 14,
      height: 14,
      tintColor: themeColors.textMuted,
      marginRight: 4,
    },
    locationText: {
      fontSize: 12,
      color: themeColors.textMuted,
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
      backgroundColor: themeColors.success,
    },
    statusOffline: {
      backgroundColor: themeColors.danger,
    },
    statusText: {
      fontSize: 11,
      color: themeColors.textPrimary,
    },
    mediaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    mediaIcon: {
      width: 18,
      height: 18,
      tintColor: themeColors.textMuted,
    },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editIcon: {
      width: 14,
      height: 14,
      tintColor: themeColors.textMuted,
      marginRight: 4,
    },
    editText: {
      fontSize: 12,
      color: themeColors.textPrimary,
    },
    description: {
      fontSize: 13,
      color: themeColors.textPrimary,
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
    classificationText: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
    classificationLabel: {
      fontWeight: '600',
      color: themeColors.textPrimary,
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
      color: themeColors.textPrimary,
      fontWeight: '600',
    },
    keywordText: {
      fontSize: 12,
      color: themeColors.textMuted,
    },
    keywordLabel: {
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    mediaSection: {
      marginTop: 12,
      alignItems: 'flex-end',
    },
    viewMediaButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    viewMediaText: {
      fontSize: 13,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
  });
}

function createSharedStyles(themeColors: AppColors) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: themeColors.primaryDark,
    },
    modalHeader: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    closeButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    closeButtonText: {
      color: themeColors.textPrimary,
      fontWeight: '700',
    },
    modalBody: {
      flex: 1,
    },
    zoomRoot: {
      flex: 1,
      backgroundColor: themeColors.primaryDark,
    },
    zoomScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImage: {
      width: '100%',
      height: '100%',
    },
    zoomImageIOS: {
      width: '100%',
      height: '100%',
    },
    zoomHintWrap: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: themeColors.overlay,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    zoomHintText: {
      color: themeColors.textPrimary,
      fontSize: 12,
      textAlign: 'center',
    },
  });
}

export default ObservationCard;
