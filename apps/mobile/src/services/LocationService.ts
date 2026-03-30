import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  source?: 'gps' | 'dead_reckoning' | 'cached';
}

export enum GPSQuality {
  GOOD = 'good', // < 5 meters
  MEDIUM = 'medium', // 5-15 meters
  POOR = 'poor', // > 15 meters
}

export interface LocationQualityInfo {
  quality: GPSQuality;
  accuracy: number | null;
  usingDeadReckoning: boolean;
  lastGoodFix: number | null; // timestamp
}

// -------- Internal Module State --------
let subscription: Location.LocationSubscription | null = null;
let lastCoordinates: Coordinates | null = null;
let _lastAccuracy: number | null = null;
let _lastTimestamp: number | null = null;
let _lastGoodFixTimestamp: number | null = null;
let isTracking = false;

// Dead reckoning state
let _deadReckoningEnabled = true;
let _lastHeading: number | null = null; // degrees from GPS
let _lastSpeed: number | null = null; // m/s from GPS

// Quality thresholds (in meters)
const GOOD_ACCURACY_THRESHOLD = 5;
const MEDIUM_ACCURACY_THRESHOLD = 15;
const POOR_GPS_TIMEOUT_MS = 30000; // 30 seconds without good GPS = poor
const DEAD_RECKONING_UPDATE_INTERVAL = 1000; // Update position every 1 second when dead reckoning

// Listeners for quality changes
type QualityChangeListener = (info: LocationQualityInfo) => void;
const qualityListeners: Set<QualityChangeListener> = new Set();

/**
 * Get current GPS quality level based on accuracy
 */
function getGPSQuality(accuracy: number | null): GPSQuality {
  if (accuracy === null) return GPSQuality.POOR;
  if (accuracy < GOOD_ACCURACY_THRESHOLD) return GPSQuality.GOOD;
  if (accuracy < MEDIUM_ACCURACY_THRESHOLD) return GPSQuality.MEDIUM;
  return GPSQuality.POOR;
}

/**
 * Check if we should use dead reckoning based on GPS quality
 */
function shouldUseDeadReckoning(): boolean {
  if (!_deadReckoningEnabled) return false;

  const now = Date.now();
  const timeSinceGoodFix = _lastGoodFixTimestamp ? now - _lastGoodFixTimestamp : Infinity;
  const currentQuality = getGPSQuality(_lastAccuracy);

  // Use dead reckoning if:
  // 1. GPS quality is poor, OR
  // 2. Haven't had a good fix in 30 seconds
  return currentQuality === GPSQuality.POOR || timeSinceGoodFix > POOR_GPS_TIMEOUT_MS;
}

/**
 * Calculate new position using dead reckoning
 * Based on last known position, heading, speed, and time elapsed
 */
function calculateDeadReckoningPosition(
  lastPos: Coordinates,
  heading: number | null,
  speed: number | null,
  elapsedSeconds: number
): Coordinates {
  if (!heading || !speed || speed < 0.5) {
    // Not moving or no heading data - return last position
    return { ...lastPos, source: 'dead_reckoning' };
  }

  // Convert heading to radians
  const headingRad = (heading * Math.PI) / 180;

  // Calculate distance traveled (speed * time)
  const distanceMeters = speed * elapsedSeconds;

  // Earth's radius in meters
  const earthRadius = 6371000;

  // Calculate new latitude
  const deltaLat = (distanceMeters * Math.cos(headingRad)) / earthRadius;
  const newLat = lastPos.latitude + (deltaLat * 180) / Math.PI;

  // Calculate new longitude
  const deltaLon =
    (distanceMeters * Math.sin(headingRad)) /
    (earthRadius * Math.cos((lastPos.latitude * Math.PI) / 180));
  const newLon = lastPos.longitude + (deltaLon * 180) / Math.PI;

  return {
    latitude: newLat,
    longitude: newLon,
    accuracy: 20, // Dead reckoning is less accurate
    source: 'dead_reckoning',
  };
}

/**
 * Notify all listeners of quality changes
 */
function notifyQualityChange(): void {
  const info = getLocationQualityInfo();
  qualityListeners.forEach((listener) => listener(info));
}

/**
 * Subscribe to location quality changes
 */
export function addQualityChangeListener(listener: QualityChangeListener): () => void {
  qualityListeners.add(listener);
  return () => qualityListeners.delete(listener);
}

/**
 * Get current location quality information
 */
export function getLocationQualityInfo(): LocationQualityInfo {
  return {
    quality: getGPSQuality(_lastAccuracy),
    accuracy: _lastAccuracy,
    usingDeadReckoning: shouldUseDeadReckoning(),
    lastGoodFix: _lastGoodFixTimestamp,
  };
}

/**
 * Enable or disable dead reckoning fallback
 */
export function setDeadReckoningEnabled(enabled: boolean): void {
  _deadReckoningEnabled = enabled;
  console.log(`Dead reckoning ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Requests permissions and throws if denied.
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
 * Starts background-safe tracking using watchPositionAsync.
 * Now includes dead reckoning fallback and quality monitoring.
 */
export async function startLocationTracking(options?: {
  accuracy?: Location.Accuracy;
  distanceInterval?: number;
  timeInterval?: number;
  enableDeadReckoning?: boolean;
}): Promise<void> {
  if (subscription || isTracking) return;

  isTracking = true;
  _deadReckoningEnabled = options?.enableDeadReckoning ?? true;

  try {
    await validateLocationPermission();

    const accuracy = options?.accuracy ?? Location.Accuracy.Balanced;
    const distanceInterval = options?.distanceInterval ?? 25;
    const timeInterval = options?.timeInterval ?? 10_000;

    // Prime with last known (cheap, no GPS wakeup)
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown) {
      lastCoordinates = {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy ?? undefined,
        source: 'cached',
      };
      _lastAccuracy = lastKnown.coords.accuracy ?? null;
      _lastTimestamp = lastKnown.timestamp;
      _lastSpeed = lastKnown.coords.speed ?? null;
      _lastHeading = lastKnown.coords.heading ?? null;

      // Check if this is a good fix
      const quality = getGPSQuality(_lastAccuracy);
      if (quality === GPSQuality.GOOD) {
        _lastGoodFixTimestamp = lastKnown.timestamp;
      }
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
        const newAccuracy = position.coords.accuracy ?? null;
        const previousQuality = getGPSQuality(_lastAccuracy);

        lastCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: newAccuracy ?? undefined,
          source: 'gps',
        };
        _lastAccuracy = newAccuracy;
        _lastTimestamp = position.timestamp;
        _lastSpeed = position.coords.speed ?? null;
        _lastHeading = position.coords.heading ?? null;

        // Track when we got a good GPS fix
        const currentQuality = getGPSQuality(newAccuracy);
        if (currentQuality === GPSQuality.GOOD) {
          _lastGoodFixTimestamp = position.timestamp;
        }

        // Notify listeners if quality changed
        if (currentQuality !== previousQuality) {
          notifyQualityChange();
        }
      }
    );

    console.log('Started location tracking with options:', {
      accuracy,
      distanceInterval,
      timeInterval,
      deadReckoningEnabled: _deadReckoningEnabled,
    });

    // Start dead reckoning update loop if enabled
    if (_deadReckoningEnabled) {
      startDeadReckoningLoop();
    }
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    isTracking = false;
    throw error;
  }
}

/**
 * Dead reckoning update loop - runs when GPS quality is poor
 */
let deadReckoningInterval: number | null = null;

function startDeadReckoningLoop(): void {
  if (deadReckoningInterval) return;

  deadReckoningInterval = globalThis.setInterval(() => {
    if (!shouldUseDeadReckoning() || !lastCoordinates) return;

    const now = Date.now();
    const elapsedSeconds = _lastTimestamp ? (now - _lastTimestamp) / 1000 : 0;

    if (elapsedSeconds > 0 && elapsedSeconds < 60) {
      // Update position using dead reckoning
      const newPos = calculateDeadReckoningPosition(
        lastCoordinates,
        _lastHeading,
        _lastSpeed,
        elapsedSeconds
      );

      lastCoordinates = newPos;
      _lastTimestamp = now;

      // Notify quality change (we're now using dead reckoning)
      notifyQualityChange();
    }
  }, DEAD_RECKONING_UPDATE_INTERVAL);
}

function stopDeadReckoningLoop(): void {
  if (deadReckoningInterval) {
    globalThis.clearInterval(deadReckoningInterval);
    deadReckoningInterval = null;
  }
}

/**
 * Stops tracking.
 */
export function stopLocationTracking(): void {
  if (!subscription) return;

  subscription.remove();
  subscription = null;
  isTracking = false;

  stopDeadReckoningLoop();

  console.log('Stopped location tracking');
}

/**
 * Returns:
 * - Cached coordinates instantly if tracking
 * - Dead reckoning estimate if GPS is poor
 * - Otherwise tries last known
 * - Otherwise fetches a new position
 */
export async function getCurrentCoordinates(options?: {
  forceHighAccuracy?: boolean;
}): Promise<Coordinates> {
  await validateLocationPermission();

  // If actively tracking and we have a value
  if (subscription && lastCoordinates) {
    // Check if we should use dead reckoning
    if (shouldUseDeadReckoning() && _deadReckoningEnabled) {
      const now = Date.now();
      const elapsedSeconds = _lastTimestamp ? (now - _lastTimestamp) / 1000 : 0;

      if (elapsedSeconds > 0 && elapsedSeconds < 60) {
        return calculateDeadReckoningPosition(
          lastCoordinates,
          _lastHeading,
          _lastSpeed,
          elapsedSeconds
        );
      }
    }

    return lastCoordinates;
  }

  // Otherwise request new fix
  const accuracy = options?.forceHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced;

  const position = await Location.getCurrentPositionAsync({
    accuracy,
    mayShowUserSettingsDialog: true,
  });

  const newAccuracy = position.coords.accuracy ?? null;

  lastCoordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: newAccuracy ?? undefined,
    source: 'gps',
  };
  _lastAccuracy = newAccuracy;
  _lastTimestamp = position.timestamp;
  _lastSpeed = position.coords.speed ?? null;
  _lastHeading = position.coords.heading ?? null;

  // Track good fix
  const quality = getGPSQuality(newAccuracy);
  if (quality === GPSQuality.GOOD) {
    _lastGoodFixTimestamp = position.timestamp;
  }

  return lastCoordinates;
}
