import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export enum GPSQuality {
  GOOD = 'good',
  MEDIUM = 'medium',
  BAD = 'bad',
  POOR = 'poor',
  DEAD_RECKONING = 'dead_reckoning',
}

export interface LocationQualityInfo {
  quality: GPSQuality;
  accuracy: number | null;
  usingDeadReckoning: boolean;
  lastGoodFix: number | null;
}

export interface LocationQuality {
  status: 'good' | 'medium' | 'bad' | 'poor' | 'dead_reckoning';
  accuracy: number | null;
  label: string;
}

// -------- Internal Module State --------
let subscription: Location.LocationSubscription | null = null;
let lastCoordinates: Coordinates | null = null;
let _lastAccuracy: number | null = null;
let _lastTimestamp: number | null = null;
let isTracking = false;
let _lastGoodFixTimestamp: number | null = null;

// GPS averaging state - always enabled
const recentReadings: Array<{ coords: Coordinates; accuracy: number | null; timestamp: number }> =
  [];
const MAX_READINGS = 10; // Average last 10 readings for smoother results
const MAX_READING_AGE = 15_000; // Keep readings for 15 seconds

// Outlier filtering
let lastValidCoordinates: Coordinates | null = null;
const MAX_SPEED_MPS = 25; // Reject jumps >25 m/s (90 km/h)

// Quality change listeners
type QualityChangeListener = (info: LocationQualityInfo) => void;
const qualityListeners: Set<QualityChangeListener> = new Set();

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3;
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a GPS reading is an outlier based on speed
 */
function isOutlier(newCoords: Coordinates, timestamp: number): boolean {
  if (!lastValidCoordinates || !_lastTimestamp) {
    return false;
  }

  const distance = calculateDistance(lastValidCoordinates, newCoords);
  const timeDiff = (timestamp - _lastTimestamp) / 1000; // seconds

  if (timeDiff <= 0) return false;

  const speedMps = distance / timeDiff;

  if (speedMps > MAX_SPEED_MPS) {
    console.warn('[GPS] Outlier detected:', {
      distance: distance.toFixed(1),
      timeDiff: timeDiff.toFixed(1),
      speed: speedMps.toFixed(1),
      threshold: MAX_SPEED_MPS,
    });
    return true;
  }

  return false;
}

/**
 * Add a new GPS reading and update averaged coordinates
 */
function addReading(coords: Coordinates, accuracy: number | null, timestamp: number): void {
  // Check for outliers
  if (isOutlier(coords, timestamp)) {
    console.warn('[GPS] Outlier rejected');
    return;
  }

  // Add to buffer
  recentReadings.push({ coords, accuracy, timestamp });

  // Remove old readings
  const cutoff = timestamp - MAX_READING_AGE;
  while (recentReadings.length > 0 && recentReadings[0].timestamp < cutoff) {
    recentReadings.shift();
  }

  // Limit to MAX_READINGS
  while (recentReadings.length > MAX_READINGS) {
    recentReadings.shift();
  }

  // Update averaged coordinates
  const averaged = getAveragedCoordinates();
  if (averaged) {
    lastCoordinates = averaged;
    lastValidCoordinates = coords;
  } else {
    lastCoordinates = coords;
    lastValidCoordinates = coords;
  }

  console.log('[GPS] Updated:', {
    raw: coords,
    averaged: lastCoordinates,
    accuracy: accuracy?.toFixed(1),
    readings: recentReadings.length,
  });
}

/**
 * Get averaged coordinates from recent readings with exponential weighting
 * Newer readings have more weight, better accuracy has more weight
 */
function getAveragedCoordinates(): Coordinates | null {
  if (recentReadings.length === 0) return null;

  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  const now = Date.now();

  for (const reading of recentReadings) {
    // Weight based on accuracy (better accuracy = higher weight)
    const accuracyWeight = reading.accuracy ? 1 / Math.max(reading.accuracy, 1) : 0.1;

    // Weight based on age (newer readings = higher weight, exponential decay)
    const age = (now - reading.timestamp) / 1000; // age in seconds
    const ageWeight = Math.exp(-age / 5); // Decay with 5 second half-life

    // Combined weight
    const weight = accuracyWeight * ageWeight;

    totalWeight += weight;
    weightedLat += reading.coords.latitude * weight;
    weightedLng += reading.coords.longitude * weight;
  }

  if (totalWeight === 0) {
    // Fallback to simple average if no valid weights
    const lat =
      recentReadings.reduce((sum, r) => sum + r.coords.latitude, 0) / recentReadings.length;
    const lng =
      recentReadings.reduce((sum, r) => sum + r.coords.longitude, 0) / recentReadings.length;
    return { latitude: lat, longitude: lng };
  }

  return {
    latitude: weightedLat / totalWeight,
    longitude: weightedLng / totalWeight,
  };
}

/**
 * Notify all quality change listeners
 */
function notifyQualityListeners(): void {
  const info = getLocationQualityInfo();
  qualityListeners.forEach((listener) => listener(info));
}

/**
 * Add a listener for GPS quality changes
 */
export function addQualityChangeListener(listener: QualityChangeListener): () => void {
  qualityListeners.add(listener);
  return () => qualityListeners.delete(listener);
}

/**
 * Get location quality info (for JourneyScreen)
 */
export function getLocationQualityInfo(): LocationQualityInfo {
  const accuracy = _lastAccuracy;
  const usingDeadReckoning = accuracy === null || accuracy === undefined;

  const goodThreshold = 15;
  const mediumThreshold = 30;
  const poorThreshold = 50;

  let quality: GPSQuality;
  if (usingDeadReckoning) {
    quality = GPSQuality.DEAD_RECKONING;
  } else if (accuracy <= goodThreshold) {
    quality = GPSQuality.GOOD;
    _lastGoodFixTimestamp = Date.now();
  } else if (accuracy <= mediumThreshold) {
    quality = GPSQuality.MEDIUM;
  } else if (accuracy <= poorThreshold) {
    quality = GPSQuality.BAD;
  } else {
    quality = GPSQuality.POOR;
  }

  return {
    quality,
    accuracy,
    usingDeadReckoning,
    lastGoodFix: _lastGoodFixTimestamp,
  };
}

/**
 * Determine GPS quality based on accuracy
 */
export function getLocationQuality(): LocationQuality {
  const accuracy = _lastAccuracy;

  if (accuracy === null || accuracy === undefined) {
    return {
      status: 'dead_reckoning',
      accuracy: null,
      label: 'Dead Reckoning',
    };
  }

  // Quality thresholds
  const goodThreshold = 15;
  const mediumThreshold = 30;
  const badThreshold = 50;

  if (accuracy <= goodThreshold) {
    return {
      status: 'good',
      accuracy,
      label: 'Good GPS',
    };
  }

  if (accuracy <= mediumThreshold) {
    return {
      status: 'medium',
      accuracy,
      label: 'Medium GPS',
    };
  }

  if (accuracy <= badThreshold) {
    return {
      status: 'bad',
      accuracy,
      label: 'Bad GPS',
    };
  }

  return {
    status: 'poor',
    accuracy,
    label: 'Poor GPS',
  };
}

/**
 * Validate location permissions
 */
export async function validateLocationPermission(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }
}

/**
 * Start location tracking
 * Note: Previously accepted options parameter for backward compatibility,
 * but now always uses improved GPS settings (BestForNavigation, 5m, 3s)
 */
export async function startLocationTracking(): Promise<void> {
  if (isTracking) {
    console.log('[GPS] Already tracking');
    return;
  }

  try {
    await validateLocationPermission();

    // Always use improved GPS settings
    const accuracy = Location.Accuracy.BestForNavigation; // Highest accuracy
    const distanceInterval = 5; // Update every 5m
    const timeInterval = 3_000; // Update every 3s

    // Prime with last known
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown) {
      lastCoordinates = {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
      _lastAccuracy = lastKnown.coords.accuracy ?? null;
      _lastTimestamp = lastKnown.timestamp;
      console.log('[GPS] Primed from last known:', {
        coords: lastCoordinates,
        accuracy: _lastAccuracy,
      });
    }

    subscription = await Location.watchPositionAsync(
      {
        accuracy,
        distanceInterval,
        timeInterval,
        mayShowUserSettingsDialog: true,
      },
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        _lastAccuracy = position.coords.accuracy ?? null;
        _lastTimestamp = position.timestamp;

        addReading(coords, _lastAccuracy, position.timestamp);
        notifyQualityListeners();
      }
    );

    isTracking = true;
    console.log('[GPS] Started tracking:', {
      accuracy,
      distanceInterval,
      timeInterval,
    });
  } catch (error) {
    console.error('[GPS] Failed to start tracking:', error);
    throw error;
  }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  isTracking = false;
  console.log('[GPS] Stopped tracking');
}

/**
 * Get current coordinates
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  // If tracking, return cached averaged coordinates
  if (isTracking && lastCoordinates) {
    return lastCoordinates;
  }

  // Otherwise request new fix
  const accuracy = Location.Accuracy.Balanced;

  const position = await Location.getCurrentPositionAsync({
    accuracy,
    mayShowUserSettingsDialog: true,
  });

  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  lastCoordinates = coords;
  _lastAccuracy = position.coords.accuracy ?? null;
  _lastTimestamp = position.timestamp;

  addReading(coords, _lastAccuracy, position.timestamp);

  return lastCoordinates;
}
