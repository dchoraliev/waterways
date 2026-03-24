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
  observerName: string;
  keywords: string[];
  photos: string[];
}

interface FilteredObservationRow {
  id: string;
  created_at: string | null;
  categories: string[] | null;
  latitude: number | null;
  longitude: number | null;
  observation: string | null;
  project_name: string | null;
  observer_name: string | null;
  keywords: string[] | null;
  observation_media: string[] | null;
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
      ...o,
      lat: o.latitude,
      lng: o.longitude,
      color: categoryColors[o.type?.toUpperCase()] ?? '#38BDF8',
    }))
  );

  const cardBg = isDark ? '#1c1c1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const secondaryBg = isDark ? '#27272a' : '#f4f4f5';
  const mapEmptyBg = isDark ? '#141414' : '#e5e7eb';

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
    html, body { width: 100%; height: 100%; background: ${mapEmptyBg}; font-family: -apple-system, sans-serif; }
    #map { width: 100%; height: 100%; background: ${mapEmptyBg}; }

    .custom-cluster {
      background: #ef4444; border-radius: 50%; border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }

    #sheet {
      display: none; position: fixed; bottom: 0; left: 0; right: 0;
      background: ${cardBg}; border-top: 1px solid ${borderColor};
      max-height: 85%; z-index: 9999; flex-direction: column;
      border-radius: 20px 20px 0 0; box-shadow: 0 -10px 25px rgba(0,0,0,0.1);
    }
    #sheet.visible { display: flex; }
    #sheet-header {
      padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid ${borderColor};
    }
    #sheet-title { font-size: 18px; font-weight: 600; color: ${textColor}; }
    #sheet-close { background: ${secondaryBg}; border: none; padding: 8px; border-radius: 50%; color: ${textColor}; cursor: pointer; }

    #sheet-body { overflow-y: auto; flex: 1; padding: 0; }
    
    .obs-content { padding: 24px 20px; border-bottom: 8px solid ${secondaryBg}; }
    .badge-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .badge { 
      background: ${secondaryBg}; color: ${textColor}; padding: 4px 12px; 
      border-radius: 99px; font-size: 12px; font-weight: 500; border: 1px solid ${borderColor};
    }
    
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .meta-block h3 { font-size: 13px; font-weight: 500; color: ${mutedColor}; margin-bottom: 4px; }
    .meta-block p { font-size: 14px; color: ${textColor}; }

    .section-title { font-size: 14px; font-weight: 600; color: ${textColor}; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .description-text { font-size: 14px; color: ${textColor}; line-height: 1.6; margin-bottom: 24px; }
    
    .media-container { display: flex; flex-direction: column; gap: 12px; }
    .obs-img { width: 100%; height: auto; border-radius: 12px; object-fit: cover; background: ${secondaryBg}; }

    #backdrop { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 9998; }
    #backdrop.visible { display: block; }

    #legend-toggle {
      position: fixed; bottom: 24px; left: 16px; z-index: 9000;
      background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 8px;
      padding: 8px 12px; display: flex; align-items: center; gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-size: 13px; color: ${textColor};
    }
    #legend-panel {
      display: none; position: fixed; bottom: 68px; left: 16px; z-index: 9000;
      background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 10px;
      padding: 12px 14px; min-width: 180px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }
    #legend-panel.visible { display: block; }
    .legend-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-label { font-size: 13px; color: ${textColor}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="backdrop" onclick="closeSheet()"></div>
  <div id="sheet">
    <div id="sheet-header">
      <span id="sheet-title">Observation</span>
      <button id="sheet-close" onclick="closeSheet()">✕</button>
    </div>
    <div id="sheet-body"></div>
  </div>

  <div id="legend-panel"><div id="legend-items"></div></div>
  <button id="legend-toggle" onclick="toggleLegend()">ℹ︎ Legend</button>

  <script>
    var map = L.map('map', { 
      center: [39.5, -98.35], 
      zoom: 4, 
      zoomControl: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    });

    var currentTileLayer;

    function addTileLayer(satellite) {
      if (currentTileLayer) map.removeLayer(currentTileLayer);
      var url = satellite 
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      currentTileLayer = L.tileLayer(url, { 
        maxZoom: 19,
        updateWhenIdle: false, // Fetch tiles while panning
        keepBuffer: 4         // Pre-load a 4-tile margin around the screen
      }).addTo(map);
    }
    addTileLayer(false);

    var legendItems = document.getElementById('legend-items');
    ${JSON.stringify(Object.entries(categoryColors))}.forEach(([type, color]) => {
      legendItems.innerHTML += '<div class="legend-row"><div class="legend-dot" style="background:'+color+'"></div><span class="legend-label">'+type+'</span></div>';
    });

    function toggleLegend() { document.getElementById('legend-panel').classList.toggle('visible'); }

    var markerGroup = L.markerClusterGroup({
      iconCreateFunction: function(c) {
        return L.divIcon({
          html: '<div class="custom-cluster" style="width:44px;height:44px;">' + c.getChildCount() + '</div>',
          className: '', iconSize: [44, 44]
        });
      },
      disableClusteringAtZoom: 15,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });

    function escapeHtml(str) { return str ? str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

    function showSheet(obsList) {
      document.getElementById('legend-panel').classList.remove('visible');
      document.getElementById('sheet-title').textContent = obsList.length > 1 ? obsList.length + ' Observations' : 'Observation Detail';
      
      var body = document.getElementById('sheet-body');
      body.innerHTML = obsList.map(function(o) {
        var badges = [o.type, ...(o.keywords || [])].map(k => '<span class="badge">'+escapeHtml(k)+'</span>').join('');
        var photos = (o.photos || []).map(p => '<img src="'+p+'" class="obs-img" />').join('');

        return \`
          <div class="obs-content">
            <div class="badge-container">\${badges}</div>
            
            <div class="meta-grid">
              <div class="meta-block"><h3>Date</h3><p>\${o.date}</p></div>
              <div class="meta-block"><h3>Observer</h3><p>\${escapeHtml(o.observerName)}</p></div>
              \${o.projectName ? \`<div class="meta-block"><h3>Project</h3><p>\${escapeHtml(o.projectName)}</p></div>\` : ''}
            </div>

            <div class="section-title">Description</div>
            <p class="description-text">\${escapeHtml(o.observation || 'No description provided.')}</p>

            \${photos ? '<div class="section-title">Media</div><div class="media-container">' + photos + '</div>' : ''}
          </div>
        \`;
      }).join('');
      
      document.getElementById('sheet').classList.add('visible');
      document.getElementById('backdrop').classList.add('visible');
    }

    function closeSheet() {
      document.getElementById('sheet').classList.remove('visible');
      document.getElementById('backdrop').classList.remove('visible');
    }

    var observations = ${obsJson};
    observations.forEach(function(o) {
      var icon = L.divIcon({
        html: '<div style="width:22px;height:22px;border-radius:50%;background:'+o.color+';border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: '', iconSize: [22, 22]
      });
      var marker = L.marker([o.lat, o.lng], { icon: icon });
      marker._obsData = o;
      marker.on('click', function() { showSheet([this._obsData]); });
      markerGroup.addLayer(marker);
    });

    markerGroup.on('clusterclick', function(e) {
      if (map.getZoom() >= 14) {
        showSheet(e.layer.getAllChildMarkers().map(m => m._obsData));
      }
    });

    map.addLayer(markerGroup);

    window.addEventListener('message', function(e) {
      var msg = JSON.parse(e.data);
      if (msg.type === 'SET_SATELLITE') addTileLayer(msg.value);
    });
  </script>
</body>
</html>`;
}

const MapScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSatellite, setIsSatellite] = useState(false);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const { colors, mode } = useTheme();
  const tokens = useMemo(() => createMapTokens(colors), [colors]);
  const styles = useMemo(() => createMapScreenStyles(tokens), [tokens]);
  const isDark = mode === 'dark';

  useEffect(() => {
    async function fetchData() {
      try {
        const args = buildObservationRpcArgs({ limit: 500, offset: 0 });
        const { data, error } = await supabase.rpc('get_filtered_observations', {
          ...args,
          p_limit: 500,
        });

        if (error) throw error;

        const formatted: Observation[] = ((data ?? []) as unknown as FilteredObservationRow[])
          .filter((o) => o.latitude != null && o.longitude != null)
          .map((o) => ({
            id: String(o.id),
            type: o.categories?.[0] ?? 'Observation',
            date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
            latitude: Number(o.latitude),
            longitude: Number(o.longitude),
            observation: o.observation,
            projectName: o.project_name,
            observerName: o.observer_name ?? 'Anonymous',
            keywords: o.keywords ?? [],
            photos: o.observation_media ?? [],
          }));

        setObservations(formatted);
      } catch (err) {
        console.error('Failed to fetch observations:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCategories() {
      const { data } = await supabase
        .from('observation_categories')
        .select('type, color')
        .eq('is_active', true);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row) => {
          if (row.color) map[row.type.toUpperCase()] = row.color;
        });
        setCategoryColors(map);
      }
    }

    fetchData();
    fetchCategories();
  }, []);

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
      <View style={styles.topBar}>
        <Text style={styles.cardTitle}>
          {loading ? 'Loading...' : `${observations.length} Observations`}
        </Text>
        <TouchableOpacity
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
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
          />
        )}
      </View>
    </SafeAreaView>
  );
};

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
