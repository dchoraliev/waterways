// apps/mobile/src/screens/MapScreen.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@waterways/shared/src/supabase/client';
import { buildObservationRpcArgs } from '@waterways/shared/src/utils/observation-query';
import { AppColors } from '../styles/colors';
import { useTheme } from '../contexts/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface Observation {
  id: string;
  type: string; // derived from categories[0]
  date: string; // derived from created_at
  latitude: number;
  longitude: number;
  observation: string | null;
  projectName: string | null;
}

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  isCluster: boolean;
  observations: Observation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Clustering
// ─────────────────────────────────────────────────────────────────────────────
function getPixelDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  zoom: number
): number {
  const scale = 256 * Math.pow(2, zoom);
  const x1 = (lng1 + 180) * (scale / 360);
  const y1 =
    ((1 -
      Math.log(Math.tan((lat1 * Math.PI) / 180) + 1 / Math.cos((lat1 * Math.PI) / 180)) / Math.PI) /
      2) *
    scale;
  const x2 = (lng2 + 180) * (scale / 360);
  const y2 =
    ((1 -
      Math.log(Math.tan((lat2 * Math.PI) / 180) + 1 / Math.cos((lat2 * Math.PI) / 180)) / Math.PI) /
      2) *
    scale;
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function clusterObservations(observations: Observation[], zoom: number): Cluster[] {
  const clusterRadius = zoom >= 12 ? 40 : zoom >= 9 ? 60 : zoom >= 6 ? 80 : 100;
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  observations.forEach((obs) => {
    if (processed.has(obs.id)) return;

    const cluster: Cluster = {
      id: obs.id,
      lat: obs.latitude,
      lng: obs.longitude,
      observations: [obs],
      isCluster: false,
    };

    observations.forEach((other) => {
      if (processed.has(other.id) || obs.id === other.id) return;

      const distance = getPixelDistance(
        obs.latitude,
        obs.longitude,
        other.latitude,
        other.longitude,
        zoom
      );

      if (distance < clusterRadius) {
        cluster.observations.push(other);
        processed.add(other.id);
      }
    });

    if (cluster.observations.length > 1) {
      cluster.lat =
        cluster.observations.reduce((s, o) => s + o.latitude, 0) / cluster.observations.length;
      cluster.lng =
        cluster.observations.reduce((s, o) => s + o.longitude, 0) / cluster.observations.length;
      cluster.isCluster = true;
      cluster.id = cluster.observations
        .map((o) => o.id)
        .sort()
        .join('-');
    }

    processed.add(obs.id);
    clusters.push(cluster);
  });

  return clusters;
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
function createMapTokens(themeColors: AppColors) {
  return {
    bg: themeColors.background,
    card: themeColors.surface,
    border: themeColors.border,
    primary: themeColors.primary,
    destructive: themeColors.danger,
    text: themeColors.textPrimary,
    mutedText: themeColors.textMuted,
    inputBg: themeColors.surface,
    overlay: themeColors.overlay,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_REGION: Region = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 40,
  longitudeDelta: 60,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(4);
  const [isSatellite, setIsSatellite] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const { colors } = useTheme();
  const tokens = useMemo(() => createMapTokens(colors), [colors]);
  const styles = useMemo(() => createMapScreenStyles(tokens), [tokens]);

  // ── Fetch from Supabase using get_filtered_observations RPC ──
  useEffect(() => {
    async function fetchObservations() {
      try {
        const args = buildObservationRpcArgs({ limit: 500, offset: 0 });
        const { data, error } = await supabase.rpc('get_filtered_observations', {
          ...args,
          p_categories: args.p_categories ?? undefined,
          p_keywords: args.p_keywords ?? undefined,
          p_project_id: args.p_project_id ?? undefined,
          p_since: args.p_since ?? undefined,
          p_until: args.p_until ?? undefined,
          p_min_lat: args.p_min_lat ?? undefined,
          p_min_lng: args.p_min_lng ?? undefined,
          p_max_lat: args.p_max_lat ?? undefined,
          p_max_lng: args.p_max_lng ?? undefined,
          p_year: args.p_year ?? undefined,
          p_month: args.p_month ?? undefined,
          p_limit: args.p_limit ?? undefined,
          p_offset: args.p_offset ?? undefined,
        });

        if (error) throw error;

        const formatted: Observation[] = (data || [])
          .filter((o: any) => o.latitude != null && o.longitude != null)
          .map((o: any) => ({
            id: String(o.id),
            type:
              Array.isArray(o.categories) && o.categories.length > 0
                ? o.categories[0]
                : 'Observation',
            date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
            latitude: Number(o.latitude),
            longitude: Number(o.longitude),
            observation: o.observation ?? null,
            projectName: o.project_name ?? null,
          }));

        setObservations(formatted);
      } catch (err) {
        console.error('Failed to fetch observations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchObservations();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('observation_categories')
        .select('type, color')
        .eq('is_active', true);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: { type: string; color: string | null }) => {
          if (row.color) map[row.type.toUpperCase()] = row.color;
        });
        setCategoryColors(map);
      }
    }
    fetchCategories();
  }, []);

  const clusters = useMemo(() => clusterObservations(observations, zoom), [observations, zoom]);

  const handleRegionChangeComplete = (region: Region) => {
    const approxZoom = Math.round(Math.log2(360 / region.longitudeDelta));
    setZoom(approxZoom);
  };

  const handleMarkerPress = (cluster: Cluster) => {
    if (cluster.isCluster && cluster.observations.length > 10) {
      const nextZoom = Math.min(zoom + 2, 18);
      const latDelta = 360 / Math.pow(2, nextZoom);
      const lngDelta = 360 / Math.pow(2, nextZoom);
      mapRef.current?.animateToRegion(
        {
          latitude: cluster.lat,
          longitude: cluster.lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        },
        400
      );
    } else {
      setSelectedCluster(cluster);
    }
  };

  function getCategoryColor(type: string): string {
    const upper = type.toUpperCase();
    return categoryColors[upper] ?? tokens.primary;
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.cardTitle}>
          {loading
            ? 'Loading...'
            : `${observations.length} Observation${observations.length !== 1 ? 's' : ''}`}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.button, styles.buttonOutline, styles.buttonSm]}
          onPress={() => setIsSatellite((prev) => !prev)}
        >
          <Ionicons
            name={isSatellite ? 'map-outline' : 'earth-outline'}
            size={13}
            color={tokens.text}
          />
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>
            {isSatellite ? 'Map' : 'Satellite'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full screen map */}
      <View style={styles.mapFull}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.primary} />
            <Text style={styles.loadingText}>Loading observations...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={INITIAL_REGION}
            mapType={isSatellite ? 'satellite' : 'standard'}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsCompass
          >
            {clusters.map((cluster) =>
              cluster.isCluster ? (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
                  onPress={() => handleMarkerPress(cluster)}
                  tracksViewChanges={false}
                >
                  <View
                    style={[
                      styles.clusterMarker,
                      cluster.observations.length >= 10 && styles.clusterMarkerLarge,
                    ]}
                  >
                    <Text style={styles.clusterText}>{cluster.observations.length}</Text>
                  </View>
                </Marker>
              ) : (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
                  onPress={() => handleMarkerPress(cluster)}
                  tracksViewChanges={false}
                >
                  <View
                    style={[
                      styles.singleMarker,
                      { backgroundColor: getCategoryColor(cluster.observations[0].type) },
                    ]}
                  >
                    <Ionicons name="location" size={12} color="#fff" />
                  </View>
                </Marker>
              )
            )}
          </MapView>
        )}
      </View>

      {/* Modal — unchanged */}
      <Modal
        visible={!!selectedCluster}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCluster(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedCluster(null)} />
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {selectedCluster && selectedCluster.observations.length > 1
                  ? `${selectedCluster.observations.length} Observations`
                  : `Observation #${selectedCluster?.observations[0]?.id}`}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedCluster(null)}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={tokens.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {selectedCluster?.observations.map((obs) => (
                <View key={obs.id} style={styles.obsRow}>
                  <View style={styles.obsRowLeft}>
                    <Ionicons name="location-outline" size={20} color={tokens.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsRowLabel}>
                        {obs.observation ?? `Observation #${obs.id}`}
                      </Text>
                      <Text style={styles.obsSubLabel}>
                        {obs.type} · {obs.date}
                      </Text>
                      {obs.projectName && (
                        <Text style={styles.obsSubLabel}>Project: {obs.projectName}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
function createMapScreenStyles(TOKENS: ReturnType<typeof createMapTokens>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: TOKENS.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: TOKENS.card,
      borderBottomWidth: 1,
      borderBottomColor: TOKENS.border,
    },
    mapFull: {
      flex: 1,
    },
    cardTitle: { fontSize: 15, fontWeight: '600', color: TOKENS.text },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: TOKENS.mutedText, fontSize: 14 },
    clusterMarker: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: TOKENS.destructive,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    clusterMarkerLarge: { width: 52, height: 52, borderRadius: 26 },
    clusterText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
    },
    buttonSm: { paddingHorizontal: 10, paddingVertical: 6 },
    buttonOutline: { borderWidth: 1, borderColor: TOKENS.border, backgroundColor: 'transparent' },
    buttonText: { fontSize: 13, fontWeight: '500' },
    buttonTextOutline: { color: TOKENS.text },
    pressed: { opacity: 0.6 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: TOKENS.overlay },
    sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    sheet: {
      backgroundColor: TOKENS.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderWidth: 1,
      borderColor: TOKENS.border,
      maxHeight: 480,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: TOKENS.border,
    },
    sheetTitle: { fontSize: 16, fontWeight: '600', color: TOKENS.text },
    sheetBody: { paddingHorizontal: 16, paddingBottom: 24, maxHeight: 380 },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: TOKENS.inputBg,
    },
    obsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: TOKENS.border,
    },
    obsRowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
    obsRowLabel: { fontSize: 14, fontWeight: '500', color: TOKENS.text, marginBottom: 2 },
    obsSubLabel: { fontSize: 12, color: TOKENS.mutedText, marginTop: 2 },

    singleMarker: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    },
  });
}

export default MapScreen;
