/**
 * LocationService TODO stub
 *
 * This file intentionally contains TODO stubs so callers can compile while
 * the location implementation is pending. Replace these with platform-appropriate
 * implementations (expo-location or React Native geolocation) when ready.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number | null;
};

export async function requestLocationPermission(): Promise<boolean> {
  // TODO: implement Location permission request (expo-location / PermissionsAndroid)
  throw new Error('TODO: implement requestLocationPermission in LocationService');
}

export async function getCurrentLocation(_opts?: { timeout?: number }): Promise<Coordinates> {
  // TODO: implement one-shot location retrieval
  throw new Error('TODO: implement getCurrentLocation in LocationService');
}

export async function getCoordsOrNull(
  _timeoutMs = 10000
): Promise<{ latitude: number; longitude: number } | null> {
  // TODO: implement safe coords retrieval that returns null on failure
  throw new Error('TODO: implement getCoordsOrNull in LocationService');
}
