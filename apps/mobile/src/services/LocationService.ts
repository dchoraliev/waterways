import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// -------- Internal Module State --------
let subscription: Location.LocationSubscription | null = null;
let lastCoordinates: Coordinates | null = null;
let lastAccuracy: number | null = null;
let lastTimestamp: number | null = null;
let isTracking = false;

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
 * Battery-friendly defaults:
 * - Balanced accuracy
 * - Updates every 25 meters
 * - Max once every 10 seconds (Android)
 */
export async function startLocationTracking(options?: {
  accuracy?: Location.Accuracy;
  distanceInterval?: number;
  timeInterval?: number; // Android only
}): Promise<void> {
  if (subscription || isTracking) return;

  isTracking = true;

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
      };
      lastAccuracy = lastKnown.coords.accuracy ?? null;
      lastTimestamp = lastKnown.timestamp;
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
        lastCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        lastAccuracy = position.coords.accuracy ?? null;
        lastTimestamp = position.timestamp;
      }
    );
    console.log('Started location tracking with options:', {
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
 * Stops tracking.
 */
export function stopLocationTracking(): void {
  if (!subscription) return;

  subscription.remove();
  subscription = null;
  isTracking = false;

  console.log('Stopped location tracking');
}

/**
 * Returns:
 * - Cached coordinates instantly if tracking
 * - Otherwise tries last known
 * - Otherwise fetches a new position
 */
export async function getCurrentCoordinates(options?: {
  forceHighAccuracy?: boolean;
}): Promise<Coordinates> {
  await validateLocationPermission();

  // If actively tracking and we have a value, return instantly
  if (subscription && lastCoordinates) {
    return lastCoordinates;
  }

  // Otherwise request new fix
  const accuracy = options?.forceHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced;

  const position = await Location.getCurrentPositionAsync({
    accuracy,
    mayShowUserSettingsDialog: true,
  });

  lastCoordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  lastAccuracy = position.coords.accuracy ?? null;
  lastTimestamp = position.timestamp;

  return lastCoordinates;
}
