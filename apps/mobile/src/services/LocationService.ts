import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Feature flag - loaded from AsyncStorage
let USE_IMPROVED_GPS = false;

// GPS averaging state (only used when improved GPS is enabled)
const recentReadings: Array<{ coords: Coordinates; accuracy: number | null; timestamp: number }> =
  [];
const MAX_READINGS = 10; // Increased from 5 - average more readings for smoother results
const MAX_READING_AGE = 15_000; // Increased from 10s - keep readings longer for better averaging

// Outlier filtering (only used when improved GPS is enabled)
let lastValidCoordinates: Coordinates | null = null;
const MAX_SPEED_MPS = 25; // Reduced from 50 - stricter outlier filtering (25 m/s = 90 km/h)

// Quality change listeners
type QualityChangeListener = (info: LocationQualityInfo) => void;
const qualityListeners: Set<QualityChangeListener> = new Set();

/**
 * Load the GPS feature flag from storage
 */
export async function loadGPSFeatureFlag(): Promise<void> {
  try {
    const value = await AsyncStorage.getItem('@waterways:use_improved_gps');
    USE_IMPROVED_GPS = value === 'true';
    console.log('[GPS] Improved GPS features:', USE_IMPROVED_GPS ? 'ENABLED' : 'DISABLED');
  } catch (error) {
    console.warn('[GPS] Failed to load feature flag:', error);
    USE_IMPROVED_GPS = false;
  }
}

/**
 * Get current state of GPS improvements
 */
export function isImprovedGPSEnabled(): boolean {
  return USE_IMPROVED_GPS;
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 * Only used when improved GPS is enabled
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
 * Check if a GPS reading is an outlier
 * Only used when improved GPS is enabled
 */
function isOutlier(newCoords: Coordinates, timestamp: number): boolean {
  if (!USE_IMPROVED_GPS) return false;
  if (!lastValidCoordinates || !_lastTimestamp) return false;

  const distance = calculateDistance(lastValidCoordinates, newCoords);
  const timeDelta = (timestamp - _lastTimestamp) / 1000;

  if (timeDelta <= 0) return false;

  const speed = distance / timeDelta;
  return speed > MAX_SPEED_MPS;
}

/**
 * Add a reading to the averaging buffer
 * Only used when improved GPS is enabled
 */
function addReading(coords: Coordinates, accuracy: number | null, timestamp: number): void {
  if (!USE_IMPROVED_GPS) {
    // Old behavior: just update last coordinates directly
    lastCoordinates = coords;
    return;
  }

  // New behavior: outlier filtering + averaging
  if (isOutlier(coords, timestamp)) {
    console.warn('[GPS] Outlier rejected:', {
      coords,
      distance: lastValidCoordinates
        ? calculateDistance(lastValidCoordinates, coords).toFixed(1)
        : 'N/A',
      timeSinceLast: _lastTimestamp ? ((timestamp - _lastTimestamp) / 1000).toFixed(1) : 'N/A',
    });
    return;
  }

  recentReadings.push({ coords, accuracy, timestamp });

  const now = Date.now();
  while (recentReadings.length > 0) {
    const oldest = recentReadings[0];
    if (now - oldest.timestamp > MAX_READING_AGE || recentReadings.length > MAX_READINGS) {
      recentReadings.shift();
    } else {
      break;
    }
  }

  lastValidCoordinates = coords;
}

/**
 * Get averaged coordinates from recent readings with exponential weighting
 * Newer readings have more weight, better accuracy has more weight
 */
function getAveragedCoordinates(): Coordinates | null {
  if (!USE_IMPROVED_GPS || recentReadings.length === 0) return null;

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
 * Get best accuracy from recent readings
 * Only used when improved GPS is enabled
 */
function getBestRecentAccuracy(): number | null {
  if (!USE_IMPROVED_GPS || recentReadings.length === 0) return null;

  const accuracies = recentReadings.map((r) => r.accuracy).filter((a): a is number => a !== null);

  if (accuracies.length === 0) return null;

  return Math.min(...accuracies);
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

  // Thresholds change based on feature flag
  const goodThreshold = USE_IMPROVED_GPS ? 15 : 20;
  const mediumThreshold = USE_IMPROVED_GPS ? 30 : 40;
  const badThreshold = USE_IMPROVED_GPS ? 50 : 60;

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
 * Get location quality info (for JourneyScreen)
 */
export function getLocationQualityInfo(): LocationQualityInfo {
  const accuracy = _lastAccuracy;
  const usingDeadReckoning = accuracy === null || accuracy === undefined;

  const threshold = USE_IMPROVED_GPS ? 15 : 20;
  const mediumThreshold = USE_IMPROVED_GPS ? 30 : 40;
  const poorThreshold = USE_IMPROVED_GPS ? 50 : 60;

  let quality: GPSQuality;
  if (usingDeadReckoning) {
    quality = GPSQuality.DEAD_RECKONING;
  } else if (accuracy <= threshold) {
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
 * Add a listener for GPS quality changes
 */
export function addQualityChangeListener(listener: QualityChangeListener): () => void {
  qualityListeners.add(listener);
  return () => qualityListeners.delete(listener);
}

/**
 * Notify all quality listeners of a change
 */
function notifyQualityChange(): void {
  const info = getLocationQualityInfo();
  qualityListeners.forEach((listener) => listener(info));
}

/**
 * Get the last known accuracy value
 */
export function getLastAccuracy(): number | null {
  return _lastAccuracy;
}

/**
 * Requests permissions and throws if denied
 */
export async function validateLocationPermission(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    console.warn('Location permission not granted');
    throw new Error('Location permission not granted');
  }

  console.log('Location permission granted');
}

/**
 * Starts background-safe tracking using watchPositionAsync
 * Behavior changes based on USE_IMPROVED_GPS flag
 */
export async function startLocationTracking(options?: {
  accuracy?: Location.Accuracy;
  distanceInterval?: number;
  timeInterval?: number;
  enableDeadReckoning?: boolean;
}): Promise<void> {
  if (subscription || isTracking) return;

  // ALWAYS reload feature flag before starting (allows real-time toggling)
  await loadGPSFeatureFlag();

  isTracking = true;

  try {
    await validateLocationPermission();

    // Settings change based on improved GPS flag
    const accuracy = USE_IMPROVED_GPS
      ? Location.Accuracy.BestForNavigation // NEW: Always use highest when improved
      : (options?.accuracy ?? Location.Accuracy.High);
    const distanceInterval = USE_IMPROVED_GPS
      ? 5 // NEW: Always 5m when improved (ignore passed options)
      : (options?.distanceInterval ?? 25); // OLD: Use passed or default 25m
    const timeInterval = USE_IMPROVED_GPS
      ? 3_000 // NEW: Always 3s when improved (ignore passed options)
      : (options?.timeInterval ?? 10_000); // OLD: Use passed or default 10s

    // Prime with last known
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown) {
      const coords = {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
      lastCoordinates = coords;
      _lastAccuracy = lastKnown.coords.accuracy ?? null;
      _lastTimestamp = lastKnown.timestamp;

      addReading(coords, _lastAccuracy, lastKnown.timestamp);
    }

    // Start watching for updates
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

        // Add to buffer (different behavior based on flag)
        addReading(coords, position.coords.accuracy ?? null, position.timestamp);

        if (USE_IMPROVED_GPS) {
          // NEW: Use averaged coordinates
          const averaged = getAveragedCoordinates();
          if (averaged) {
            lastCoordinates = averaged;
          } else {
            lastCoordinates = coords;
          }

          // Use best recent accuracy
          const bestAccuracy = getBestRecentAccuracy();
          _lastAccuracy = bestAccuracy ?? position.coords.accuracy ?? null;
        } else {
          // OLD: Use raw coordinates directly
          lastCoordinates = coords;
          _lastAccuracy = position.coords.accuracy ?? null;
        }

        _lastTimestamp = position.timestamp;

        // Notify listeners
        notifyQualityChange();

        console.log(
          '[GPS] Updated:',
          USE_IMPROVED_GPS
            ? {
                raw: coords,
                averaged: lastCoordinates,
                accuracy: _lastAccuracy?.toFixed(1),
                readings: recentReadings.length,
                mode: 'IMPROVED',
              }
            : {
                coords: lastCoordinates,
                accuracy: _lastAccuracy?.toFixed(1),
                mode: 'STANDARD',
              }
        );
      }
    );

    console.log('[GPS] Started tracking:', {
      mode: USE_IMPROVED_GPS ? 'IMPROVED' : 'STANDARD',
      accuracy,
      distanceInterval,
      timeInterval,
    });
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    isTracking = false;
    throw error;
  }
}

/**
 * Stops tracking
 */
export function stopLocationTracking(): void {
  if (!subscription) return;

  subscription.remove();
  subscription = null;
  isTracking = false;

  // Clear averaging state
  recentReadings.length = 0;
  lastValidCoordinates = null;

  console.log('Stopped location tracking');
}

/**
 * Returns coordinates
 */
export async function getCurrentCoordinates(options?: {
  forceHighAccuracy?: boolean;
}): Promise<Coordinates> {
  await validateLocationPermission();

  // If actively tracking and we have coordinates, return them
  if (subscription && lastCoordinates) {
    return lastCoordinates;
  }

  // Otherwise request new fix
  const accuracy = options?.forceHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced;

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
