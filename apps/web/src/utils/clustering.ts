import { Observation } from '../types/observation';

export interface Cluster {
  id: string;
  lat: number;
  lng: number;
  observations: Observation[];
  isCluster: boolean;
}

// Calculate pixel distance between two lat/lng points at a given zoom level
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

// Cluster observations based on zoom level
export function clusterObservations(observations: Observation[], zoom: number): Cluster[] {
  // Cluster radius in pixels - decreases as zoom increases
  const clusterRadius = zoom >= 12 ? 40 : zoom >= 9 ? 60 : zoom >= 6 ? 80 : 100;

  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  observations.forEach((observation) => {
    if (processed.has(observation.id)) return;

    const cluster: Cluster = {
      id: observation.id,
      lat: observation.location.lat,
      lng: observation.location.lng,
      observations: [observation],
      isCluster: false,
    };

    // Find nearby observations to cluster
    observations.forEach((other) => {
      if (processed.has(other.id) || observation.id === other.id) return;

      const distance = getPixelDistance(
        observation.location.lat,
        observation.location.lng,
        other.location.lat,
        other.location.lng,
        zoom
      );

      if (distance < clusterRadius) {
        cluster.observations.push(other);
        processed.add(other.id);
      }
    });

    // Calculate center of cluster
    if (cluster.observations.length > 1) {
      const avgLat =
        cluster.observations.reduce((sum, obs) => sum + obs.location.lat, 0) /
        cluster.observations.length;
      const avgLng =
        cluster.observations.reduce((sum, obs) => sum + obs.location.lng, 0) /
        cluster.observations.length;
      cluster.lat = avgLat;
      cluster.lng = avgLng;
      cluster.isCluster = true;
      cluster.id = cluster.observations
        .map((o) => o.id)
        .sort()
        .join('-');
    }

    processed.add(observation.id);
    clusters.push(cluster);
  });

  return clusters;
}
