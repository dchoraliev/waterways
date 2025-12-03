import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
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
 * Gets the current coordinates after validating permission.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  // Ensure permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  // Get device location
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
