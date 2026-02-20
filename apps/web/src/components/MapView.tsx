import { useState, useMemo } from 'react';
import { Map, Marker } from 'pigeon-maps';
import type { Observation } from '../types/observation';
import { X, MapPin } from 'lucide-react';
import { clusterObservations, type Cluster } from '../utils/clustering';

interface MapViewProps {
  observations: Observation[];
  onObservationClick: (observation: Observation) => void;
}

export function MapView({ observations, onObservationClick }: MapViewProps) {
  // 🇺🇸 Start centered on the US and don't recenter on filters
  const [center, setCenter] = useState<[number, number]>([39.5, -98.35]);
  const [zoom, setZoom] = useState(4);
  const [, setClickedObservationId] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  // No useEffect here – we don't recenter based on observations at all
  const clusters = useMemo(() => {
    return clusterObservations(observations, zoom);
  }, [observations, zoom]);

  const handleMarkerClick = (cluster: Cluster) => {
    if (cluster.isCluster) {
      setSelectedCluster(cluster);
      setClickedObservationId(null);
    } else {
      const observation = cluster.observations[0];
      setClickedObservationId(observation.id);
      setSelectedCluster(null);
      onObservationClick(observation);
    }
  };

  return (
    <div className="size-full relative">
      <Map
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center as [number, number]);
          setZoom(zoom);
        }}
      >
        {clusters.map((cluster) => (
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
                    bg-destructive text-destructive-foreground
                    shadow-lg cursor-pointer transition-transform duration-200
                    ${cluster.observations.length >= 10 ? 'size-14' : 'size-12'}
                  `}
                >
                  <span className="font-semibold">{cluster.observations.length}</span>
                </div>
              </div>
            ) : (
              <div className="pointer-events-none">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-auto">
                  <MapPin
                    className="size-8 text-destructive drop-shadow-lg cursor-pointer transition-colors"
                    fill="currentColor"
                  />
                </div>
              </div>
            )}
          </Marker>
        ))}
      </Map>

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
            {selectedCluster.observations.map((obs) => (
              <button
                key={obs.id}
                onClick={() => {
                  setClickedObservationId(obs.id);
                  setSelectedCluster(null);
                  onObservationClick(obs);
                }}
                className="w-full text-left p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <p className="text-neutral-950 font-medium mb-1">Observation #{obs.id}</p>
                <p className="text-sm text-gray-600">Type: {obs.type}</p>
                <p className="text-sm text-gray-600">Date: {obs.date}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
