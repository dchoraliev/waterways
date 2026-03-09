// apps/mobile/src/screens/MapScreen.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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
  type: string;
  date: string;
  latitude: number;
  longitude: number;
  observation: string | null;
  projectName: string | null;
}

interface FilteredObservationRow {
  id: string;
  created_at: string | null;
  categories: string[] | null;
  latitude: number | null;
  longitude: number | null;
  observation: string | null;
  project_name: string | null;
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
// Leaflet HTML builder
// ─────────────────────────────────────────────────────────────────────────────
function buildLeafletHTML(
  observations: Observation[],
  categoryColors: Record<string, string>,
  isDark: boolean
): string {
  const obsJson = JSON.stringify(
    observations.map((o) => ({
      id: o.id,
      lat: o.latitude,
      lng: o.longitude,
      type: o.type,
      date: o.date,
      observation: o.observation,
      projectName: o.projectName,
      color: categoryColors[o.type?.toUpperCase()] ?? '#38BDF8',
    }))
  );

  const bgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const cardBg = isDark ? '#141414' : '#ffffff';
  const textColor = isDark ? '#f5f5f5' : '#111111';
  const mutedColor = isDark ? '#737373' : '#666666';
  const borderColor = isDark ? '#222222' : '#e0e0e0';
  const closeBg = isDark ? '#1a1a1a' : '#f0f0f0';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: ${bgColor}; }
    #map { width: 100%; height: 100%; }

    .custom-cluster {
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .custom-cluster-large { background: #dc2626; }

    #sheet {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: ${cardBg};
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      border: 1px solid ${borderColor};
      max-height: 480px;
      z-index: 9999;
      flex-direction: column;
    }
    #sheet.visible { display: flex; }
    #sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid ${borderColor};
      flex-shrink: 0;
    }
    #sheet-title {
      font-size: 16px;
      font-weight: 600;
      color: ${textColor};
      font-family: -apple-system, sans-serif;
    }
    #sheet-close {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: ${closeBg};
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: ${textColor};
    }
    #sheet-body {
      overflow-y: auto;
      padding: 0 16px 24px;
      flex: 1;
    }
    .obs-row {
      display: flex;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid ${borderColor};
      gap: 12px;
    }
    .obs-pin { color: #3b82f6; font-size: 18px; flex-shrink: 0; margin-top: 2px; }
    .obs-label {
      font-size: 14px;
      font-weight: 500;
      color: ${textColor};
      font-family: -apple-system, sans-serif;
      margin-bottom: 2px;
    }
    .obs-sub {
      font-size: 12px;
      color: ${mutedColor};
      font-family: -apple-system, sans-serif;
      margin-top: 2px;
    }
    #backdrop {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      z-index: 9998;
    }
    #backdrop.visible { display: block; }

    /* Override leaflet cluster styles */
    .marker-cluster { background: transparent !important; box-shadow: none !important; }
    .marker-cluster div { background: transparent !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="backdrop" onclick="closeSheet()"></div>
  <div id="sheet">
    <div id="sheet-header">
      <span id="sheet-title"></span>
      <button id="sheet-close" onclick="closeSheet()">✕</button>
    </div>
    <div id="sheet-body"></div>
  </div>

  <script>
    var observations = ${obsJson};
    var currentTileLayer;

    var map = L.map('map', {
      center: [39.5, -98.35],
      zoom: 4,
      zoomControl: true,
    });

    function addTileLayer(satellite) {
      if (currentTileLayer) map.removeLayer(currentTileLayer);
      if (satellite) {
        currentTileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: '© Esri', maxZoom: 19 }
        ).addTo(map);
      } else {
        currentTileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '© OpenStreetMap contributors', maxZoom: 19, subdomains: ['a','b','c'] }
        ).addTo(map);
      }
    }

    addTileLayer(false);

    function createClusterIcon(cluster) {
      var count = cluster.getChildCount();
      var size = count >= 10 ? 52 : 44;
      var cls = count >= 10 ? 'custom-cluster custom-cluster-large' : 'custom-cluster';
      return L.divIcon({
        html: '<div class="' + cls + '" style="width:' + size + 'px;height:' + size + 'px;">' + count + '</div>',
        className: '',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
    }

    var markerGroup = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
    });

    // Store obs by marker so we can show in sheet
    var markerObsMap = [];

    observations.forEach(function(obs) {
      var icon = L.divIcon({
        html: '<div style="width:22px;height:22px;border-radius:50%;background:' + obs.color + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.35);font-size:10px;color:#fff;">●</div>',
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      var marker = L.marker([obs.lat, obs.lng], { icon: icon });
      marker._obsData = obs;
      marker.on('click', function() {
        showSheet([this._obsData]);
      });
      markerGroup.addLayer(marker);
    });

    // Show sheet when a cluster is clicked (if zoomed in enough)
    markerGroup.on('clusterclick', function(e) {
      var zoom = map.getZoom();
      if (zoom >= 14) {
        var markers = e.layer.getAllChildMarkers();
        var obsData = markers.map(function(m) { return m._obsData; });
        showSheet(obsData);
      }
      // otherwise default zoom-in behavior handles it
    });

    map.addLayer(markerGroup);

    // Listen for satellite toggle from React Native
    window.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'SET_SATELLITE') {
          addTileLayer(msg.value);
        }
      } catch(err) {}
    });

    // Also handle Android
    document.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'SET_SATELLITE') {
          addTileLayer(msg.value);
        }
      } catch(err) {}
    });

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function showSheet(obs) {
      var title = obs.length > 1 ? obs.length + ' Observations' : 'Observation #' + obs[0].id;
      document.getElementById('sheet-title').textContent = title;
      var body = document.getElementById('sheet-body');
      body.innerHTML = obs.map(function(o) {
        return '<div class="obs-row">' +
          '<span class="obs-pin">📍</span>' +
          '<div>' +
            '<div class="obs-label">' + escapeHtml(o.observation || 'Observation #' + o.id) + '</div>' +
            '<div class="obs-sub">' + escapeHtml(o.type) + ' · ' + escapeHtml(o.date) + '</div>' +
            (o.projectName ? '<div class="obs-sub">Project: ' + escapeHtml(o.projectName) + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');
      document.getElementById('sheet').classList.add('visible');
      document.getElementById('backdrop').classList.add('visible');
    }

    function closeSheet() {
      document.getElementById('sheet').classList.remove('visible');
      document.getElementById('backdrop').classList.remove('visible');
    }
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const MapScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSatellite, setIsSatellite] = useState(false);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const { colors } = useTheme();
  const tokens = useMemo(() => createMapTokens(colors), [colors]);
  const styles = useMemo(() => createMapScreenStyles(tokens), [tokens]);
  const isDark = colors.background === '#0a0a0a';

  // ── Fetch observations ──
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

        const formatted: Observation[] = ((data ?? []) as FilteredObservationRow[])
          .filter((o) => o.latitude != null && o.longitude != null)
          .map((o) => ({
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

  // ── Fetch category colors ──
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

  // ── Toggle satellite via WebView postMessage ──
  const handleSatelliteToggle = () => {
    const next = !isSatellite;
    setIsSatellite(next);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_SATELLITE', value: next }));
  };

  const html = useMemo(
    () => buildLeafletHTML(observations, categoryColors, isDark),
    [observations, categoryColors, isDark]
  );

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
          onPress={handleSatelliteToggle}
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

      {/* Map */}
      <View style={styles.mapFull}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.primary} />
            <Text style={styles.loadingText}>Loading observations...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={styles.webView}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            scrollEnabled={false}
            allowsInlineMediaPlayback
          />
        )}
      </View>
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
    mapFull: { flex: 1 },
    webView: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: TOKENS.text },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: TOKENS.mutedText, fontSize: 14 },
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
  });
}

export default MapScreen;
