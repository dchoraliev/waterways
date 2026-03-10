import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '../contexts/ThemeContext';
import { AppColors } from '../styles/colors';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface OtherObservation {
  id: string;
  latitude: number;
  longitude: number;
  description?: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation: LatLng | null;
  otherObservations: OtherObservation[];
  onConfirm: (location: LatLng) => void;
  onCancel: () => void;
}

export interface MapViewProps {
  currentLocation: LatLng | null;
  otherObservations: OtherObservation[];
  interactive?: boolean;
  onLocationUpdate?: (location: LatLng) => void;
  style?: object;
  onLoad?: () => void;
}

function buildLeafletHTML(
  current: LatLng | null,
  others: OtherObservation[],
  interactive: boolean
): string {
  const center = current ?? { latitude: 0, longitude: 0 };
  const zoom = current ? 15 : 2;

  const othersJson = JSON.stringify(
    others.map((o) => ({
      id: o.id,
      lat: o.latitude,
      lng: o.longitude,
      description: o.description ?? '',
    }))
  );

  const currentJson = current
    ? JSON.stringify({ lat: current.latitude, lng: current.longitude })
    : 'null';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .instruction-banner {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: rgba(20, 20, 20, 0.82);
      color: #fff;
      font-size: 13px;
      font-family: -apple-system, sans-serif;
      padding: 8px 16px;
      border-radius: 20px;
      white-space: nowrap;
      pointer-events: none;
      backdrop-filter: blur(6px);
    }
  </style>
</head>
<body>
  ${interactive ? '<div class="instruction-banner">Tap anywhere to move the pin</div>' : ''}
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var interactive = ${interactive};
    var map = L.map('map', {
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: false,
      scrollWheelZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    }).setView([${center.latitude}, ${center.longitude}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Other observation markers (grey dots)
    var othersData = ${othersJson};
    var otherIcon = L.divIcon({
      className: '',
      html: '<div style="width:12px;height:12px;background:#9CA3AF;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    othersData.forEach(function(obs) {
      var marker = L.marker([obs.lat, obs.lng], { icon: otherIcon }).addTo(map);
      if (obs.description && interactive) {
        marker.bindTooltip(
          obs.description.substring(0, 60) + (obs.description.length > 60 ? '…' : ''),
          { direction: 'top', offset: [0, -10] }
        );
      }
    });

    // Current observation marker — teal pin
    var currentData = ${currentJson};

    var pinSvg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">' +
      '<path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#14B8A6"/>' +
      '<circle cx="14" cy="14" r="6" fill="#fff"/>' +
      '</svg>'
    );

    var currentIcon = L.divIcon({
      className: '',
      html: '<img src="data:image/svg+xml,' + pinSvg + '" style="width:28px;height:36px;" />',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    });

    var currentMarker = null;
    if (currentData) {
      currentMarker = L.marker([currentData.lat, currentData.lng], { icon: currentIcon }).addTo(map);
    }

    if (interactive) {
      map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        if (currentMarker) {
          currentMarker.setLatLng([lat, lng]);
        } else {
          currentMarker = L.marker([lat, lng], { icon: currentIcon }).addTo(map);
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locationUpdate', lat: lat, lng: lng }));
      });
    }

    if (!currentData && othersData.length > 0) {
      var bounds = L.latLngBounds(othersData.map(function(o) { return [o.lat, o.lng]; }));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  </script>
</body>
</html>
  `;
}

// Shared Leaflet WebView — used by both preview and full-screen modal
export const LeafletMapView: React.FC<MapViewProps> = ({
  currentLocation,
  otherObservations,
  interactive = true,
  onLocationUpdate,
  style,
  onLoad,
}) => {
  const html = useMemo(
    () => buildLeafletHTML(currentLocation, otherObservations, interactive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentLocation?.latitude, currentLocation?.longitude, interactive]
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!onLocationUpdate) return;
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationUpdate') {
        onLocationUpdate({ latitude: data.lat, longitude: data.lng });
      }
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <WebView
      source={{ html }}
      style={[{ flex: 1 }, style]}
      onLoad={onLoad}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      mixedContentMode="always"
      allowFileAccess
      allowUniversalAccessFromFileURLs
      scrollEnabled={false}
    />
  );
};

// Full-screen modal picker
const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  currentLocation,
  otherObservations,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pendingLocation, setPendingLocation] = useState<LatLng | null>(currentLocation);
  const [mapReady, setMapReady] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setPendingLocation(currentLocation);
      setMapReady(false);
    }
  }, [visible, currentLocation]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pick Location</Text>
          {pendingLocation && (
            <Text style={styles.coordText}>
              {pendingLocation.latitude.toFixed(6)}, {pendingLocation.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {!mapReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading map…</Text>
            </View>
          )}
          <LeafletMapView
            currentLocation={pendingLocation}
            otherObservations={otherObservations}
            interactive
            onLocationUpdate={setPendingLocation}
            onLoad={() => setMapReady(true)}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, !pendingLocation && styles.confirmButtonDisabled]}
            onPress={() => pendingLocation && onConfirm(pendingLocation)}
            activeOpacity={0.8}
            disabled={!pendingLocation}
          >
            <Text style={styles.confirmText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 56 : 20,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    coordText: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      zIndex: 10,
    },
    loadingText: {
      color: colors.textMuted,
      marginTop: 12,
      fontSize: 14,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelText: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    confirmButtonDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default LocationPickerModal;
