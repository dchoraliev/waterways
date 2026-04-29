import { useState, useMemo } from 'react';
import { Map, Marker } from 'pigeon-maps';
import type { Observation } from '../types/observation';
import {
  X,
  MapPin,
  Satellite,
  Map as MapIcon,
  Camera,
  Info,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { clusterObservations, type Cluster } from '../utils/clustering';

// ── Tile providers ──────────────────────────────────────────────
const OSM_SUBDOMAINS = ['a', 'b', 'c'] as const;

function osmProvider(x: number, y: number, z: number): string {
  const s = OSM_SUBDOMAINS[Math.abs((x + y + z) % OSM_SUBDOMAINS.length)];
  return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function satelliteProvider(x: number, y: number, z: number): string {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

function formatScaleDistance(meters: number): string {
  if (meters >= 2000) {
    return `${Math.round(meters / 1000)} km`;
  }
  return `${Math.round(meters)} m`;
}

function getNiceScaleDistance(maxDistance: number): number {
  if (maxDistance <= 0) return 0;

  const exponent = Math.floor(Math.log10(maxDistance));
  const magnitude = 10 ** exponent;
  const niceSteps = [1, 2, 5];

  let best = magnitude;
  for (const step of niceSteps) {
    const candidate = step * magnitude;
    if (candidate <= maxDistance) {
      best = candidate;
    }
  }

  return best;
}
// ────────────────────────────────────────────────────────────────

interface ObservationCategory {
  id: number;
  type: string;
  color: string | null;
  keywords: string[] | null;
  is_fallback: boolean;
}

// Color mapping function based on observation type matching categories from database
function getObservationTypeColor(
  observation: Observation,
  categories: ObservationCategory[]
): string {
  const lowerType = observation.type.toLowerCase();

  // Debug logging
  console.log('Getting color for type:', lowerType, 'Categories:', categories.length);

  // If no categories loaded, use simple fallback colors for common types
  if (categories.length === 0) {
    console.log('No categories loaded, using fallback colors');
    if (lowerType.includes('bridge') || lowerType.includes('dam') || lowerType.includes('pipe'))
      return '#007AFF'; // blue
    if (lowerType.includes('erosion') || lowerType.includes('algae') || lowerType.includes('trash'))
      return '#34C759'; // green
    if (lowerType.includes('bird') || lowerType.includes('fish') || lowerType.includes('mammal'))
      return '#FF9500'; // orange
    if (lowerType.includes('obstruction')) return '#FF3B30'; // red
    return '#5856D6'; // purple fallback
  }

  // Find matching category by keywords or direct type match
  for (const category of categories) {
    // Check direct type match first
    if (category.type.toLowerCase() === lowerType) {
      console.log('Found direct match:', category.type, 'Color:', category.color);
      return category.color || '#5856D6'; // fallback purple
    }

    // Check keyword matches
    if (category.keywords) {
      const keywordMatches = category.keywords.some(
        (keyword) =>
          lowerType.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(lowerType)
      );
      if (keywordMatches) {
        console.log('Found keyword match:', category.type, 'Color:', category.color);
        return category.color || '#5856D6'; // fallback purple
      }
    }
  }

  // Find fallback category
  const fallbackCategory = categories.find((cat) => cat.is_fallback);
  if (fallbackCategory && fallbackCategory.color) {
    console.log(
      'Using fallback category:',
      fallbackCategory.type,
      'Color:',
      fallbackCategory.color
    );
    return fallbackCategory.color;
  }

  // Final fallback color
  console.log('Using final fallback color');
  return '#5856D6'; // purple
}

interface MapViewProps {
  observations: Observation[];
  categories: ObservationCategory[];
  isTruncated?: boolean;
  onObservationClick: (observation: Observation) => void;
  onClusterOpen?: () => void;
  onBoundsChange?: (view: { ne: [number, number]; sw: [number, number]; zoom: number }) => void;
  loading?: boolean;
  zoomTooLow?: boolean;
}

export function MapView({
  observations,
  categories,
  onObservationClick,
  onClusterOpen,
  onBoundsChange,
  loading = false,
  zoomTooLow = false,
  isTruncated = false,
}: Readonly<MapViewProps>) {
  // 🇺🇸 Start centered on the US and don't recenter on filters
  const [center, setCenter] = useState<[number, number]>([39.5, -98.35]);
  const [zoom, setZoom] = useState(4);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [, setClickedObservationId] = useState<string | null>(null);

  // Build legend categories from database categories
  const legendCategories = useMemo(() => {
    return categories
      .filter((cat) => !cat.is_fallback && cat.color) // Only show non-fallback categories with colors
      .map((cat) => ({
        name: cat.type,
        color: cat.color!,
        keywords: cat.keywords || [],
      }));
  }, [categories]);

  const clusters = useMemo(() => {
    return clusterObservations(observations, zoom);
  }, [observations, zoom]);

  const scaleBar = useMemo(() => {
    const latitude = center[0];
    const metersPerPixel = (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
    const maxScaleWidthPx = 72;
    const maxDistanceMeters = metersPerPixel * maxScaleWidthPx;
    const niceDistanceMeters = getNiceScaleDistance(maxDistanceMeters);

    if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0 || niceDistanceMeters <= 0) {
      return null;
    }

    return {
      widthPx: niceDistanceMeters / metersPerPixel,
      label: formatScaleDistance(niceDistanceMeters),
    };
  }, [center, zoom]);

  const handleMarkerClick = (cluster: Cluster) => {
    if (cluster.isCluster) {
      onClusterOpen?.();
      if (zoom < 10) {
        const nextZoom = Math.min(zoom + 2, 18);
        setCenter([cluster.lat, cluster.lng]);
        setZoom(nextZoom);
        return;
      }
      setSelectedCluster(cluster);
    } else {
      const observation = cluster.observations[0];
      setSelectedCluster(null);
      onObservationClick(observation);
    }
  };

  const getClusterLabel = (cluster: Cluster) => {
    const countText = String(cluster.observations.length);
    return isTruncated && cluster.isCluster ? `${countText}+` : countText;
  };

  return (
    <div className="size-full relative">
      <Map
        center={center}
        zoom={zoom}
        provider={isSatellite ? satelliteProvider : osmProvider}
        onBoundsChanged={({ center, zoom, bounds }) => {
          setCenter(center);
          setZoom(zoom);
          onBoundsChange?.({
            ne: bounds.ne,
            sw: bounds.sw,
            zoom,
          });
        }}
      >
        {clusters.map((cluster) => {
          return (
            <Marker
              key={cluster.id}
              anchor={[cluster.lat, cluster.lng]}
              onClick={() => handleMarkerClick(cluster)}
            >
              {cluster.isCluster ? (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                  <div
                    className={`
                      flex items-center justify-center rounded-full
                      bg-blue-600 text-white
                      shadow-lg cursor-pointer transition-transform duration-200
                      ${cluster.observations.length >= 10 ? 'size-14' : 'size-12'}
                    `}
                  >
                    <span className="font-semibold">{getClusterLabel(cluster)}</span>
                  </div>
                </div>
              ) : (
                <div className="pointer-events-none">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-auto">
                    <MapPin
                      className="size-8 drop-shadow-lg cursor-pointer transition-colors"
                      style={{
                        color: getObservationTypeColor(cluster.observations[0], categories),
                      }}
                      fill="currentColor"
                    />
                  </div>
                </div>
              )}
            </Marker>
          );
        })}
      </Map>

      {/* ── Control buttons and legend ── */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end gap-2">
        {/* Legend panel */}
        {isLegendOpen && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 mb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Map Legend</h3>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              {legendCategories.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs text-gray-700 flex-1">{category.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Observations are color-coded by type. Clusters show when multiple observations are
                close together.
              </p>
            </div>
          </div>
        )}

        {/* Control buttons row */}
        <div className="flex gap-2">
          {/* Legend toggle button */}
          <button
            onClick={() => setIsLegendOpen((prev) => !prev)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              shadow-lg border transition-colors duration-200
              ${
                isLegendOpen
                  ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
            title="Toggle legend"
          >
            <Info className="size-4" />
            {isLegendOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>

          {/* Satellite toggle button */}
          <button
            onClick={() => setIsSatellite((prev) => !prev)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              shadow-lg border transition-colors duration-200
              ${
                isSatellite
                  ? 'bg-white text-neutral-900 border-gray-300 hover:bg-gray-50'
                  : 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800'
              }
            `}
            title={isSatellite ? 'Switch to Map view' : 'Switch to Satellite view'}
          >
            {isSatellite ? (
              <>
                <MapIcon className="size-4" /> Map
              </>
            ) : (
              <>
                <Satellite className="size-4" /> Satellite
              </>
            )}
          </button>
        </div>
      </div>

      {zoomTooLow && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-white/95 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 shadow">
          Zoom in to load observations
        </div>
      )}

      {loading && !zoomTooLow && (
        <div className="absolute top-3 right-3 z-[900] bg-white/60 rounded-md px-2 py-1 text-xs text-gray-500">
          Loading observations…
        </div>
      )}

      {scaleBar && (
        <div className="absolute bottom-0 right-51 z-[850] pointer-events-none select-none">
          <div className="inline-flex items-center gap-1.5 rounded-sm bg-white/50 border border-gray-300 px-1.5 py-1 shadow-sm">
            <div className="relative h-2" style={{ width: `${Math.max(scaleBar.widthPx, 12)}px` }}>
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-900" />
              <div className="absolute left-0 top-0 h-2 w-px bg-gray-900" />
              <div className="absolute right-0 top-0 h-2 w-px bg-gray-900" />
            </div>
            <div className="text-[10px] font-medium leading-none text-gray-700">
              {scaleBar.label}
            </div>
          </div>
        </div>
      )}

      {selectedCluster && (
        <div className="absolute left-4 top-4 w-80 max-h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[1000]">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <p className="text-neutral-950 font-medium">
              {selectedCluster.observations.length} Observations
            </p>
            <button
              onClick={() => setSelectedCluster(null)}
              className="rounded-lg size-9 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-2 space-y-2 overflow-y-auto max-h-[400px]">
            {selectedCluster.observations.map((obs) => {
              const createdAtDate = new Date(obs.createdAt);
              const formattedDate = Number.isNaN(createdAtDate.getTime())
                ? obs.date
                : `${createdAtDate.getUTCMonth() + 1}/${createdAtDate.getUTCDate()}/${createdAtDate.getUTCFullYear()}`;
              const mediaCount = obs.photos.length + obs.videos.length;

              let observationNumber = null;
              if (obs.projectName && obs.projectName.toLowerCase() !== 'untitled project') {
                const projectObservations = observations
                  .filter((o) => o.projectName === obs.projectName)
                  .sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  );

                observationNumber = projectObservations.findIndex((o) => o.id === obs.id) + 1;
              }

              return (
                <button
                  key={obs.id}
                  onClick={() => {
                    setClickedObservationId(obs.id);
                    onObservationClick(obs);
                  }}
                  className="w-full text-left p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Color indicator dot */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: getObservationTypeColor(obs, categories) }}
                    />
                    <div className="flex-1 min-w-0">
                      {obs.projectName &&
                      obs.projectName.toLowerCase() !== 'untitled project' &&
                      observationNumber ? (
                        <>
                          <div className="flex items-center gap-2 mb-1 min-w-0">
                            <p className="text-neutral-950 font-medium truncate">
                              {obs.projectName} #{observationNumber}
                            </p>
                            {mediaCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 shrink-0">
                                <Camera className="size-3 text-blue-600" />
                                {mediaCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{obs.type}</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                          <p className="text-neutral-950 font-medium truncate">{obs.type}</p>
                          {mediaCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 shrink-0">
                              <Camera className="size-3 text-blue-600" />
                              {mediaCount}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{formattedDate}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
