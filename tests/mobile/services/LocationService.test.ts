// tests/mobile/services/LocationService.test.ts

type LocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
  timestamp: number;
};

type WatchCallback = (position: LocationPosition) => void;

let watchCallback: WatchCallback | undefined;

const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetLastKnownPositionAsync = jest.fn();
const mockWatchPositionAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
    High: 6,
  },
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  getLastKnownPositionAsync: (...args: unknown[]) => mockGetLastKnownPositionAsync(...args),
  watchPositionAsync: (options: unknown, cb: WatchCallback) => {
    watchCallback = cb;
    return mockWatchPositionAsync(options, cb);
  },
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
}));

function loadFreshLocationService() {
  let mod!: typeof import('@waterways/mobile/src/services/LocationService');

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@waterways/mobile/src/services/LocationService');
  });

  return mod;
}

describe('LocationService', () => {
  const NOW = 1700000000000;

  beforeEach(() => {
    jest.clearAllMocks();
    watchCallback = undefined;

    // Use fake timers to control setInterval in dead reckoning
    jest.useFakeTimers();

    jest.spyOn(Date, 'now').mockReturnValue(NOW);

    mockRemove.mockReset();

    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetLastKnownPositionAsync.mockResolvedValue(null);

    mockWatchPositionAsync.mockResolvedValue({
      remove: mockRemove,
    });

    mockGetCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 1, longitude: 2, accuracy: 10 },
      timestamp: NOW,
    } satisfies LocationPosition);
  });

  afterEach(() => {
    (Date.now as unknown as jest.Mock).mockRestore?.();

    // Clean up any running location services to prevent timer leaks
    const service = loadFreshLocationService();
    try {
      service.stopLocationTracking();
    } catch {
      // Ignore errors if service wasn't started
    }

    // Restore real timers
    jest.useRealTimers();
  });

  test('validateLocationPermission throws when permission denied', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const service = loadFreshLocationService();

    await expect(service.validateLocationPermission()).rejects.toThrow(
      'Location permission not granted'
    );
    expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test('validateLocationPermission resolves when permission granted', async () => {
    const service = loadFreshLocationService();

    await expect(service.validateLocationPermission()).resolves.toBeUndefined();
    expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test('startLocationTracking primes from last known and starts watchPositionAsync', async () => {
    mockGetLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 10, longitude: 20, accuracy: 5 },
      timestamp: NOW - 123,
    } satisfies LocationPosition);

    const service = loadFreshLocationService();

    await service.startLocationTracking();

    expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockGetLastKnownPositionAsync).toHaveBeenCalledTimes(1);
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1);

    const [optionsArg] = mockWatchPositionAsync.mock.calls[0];
    expect(optionsArg).toMatchObject({
      accuracy: 3, // Balanced
      distanceInterval: 25,
      timeInterval: 10_000,
      mayShowUserSettingsDialog: true,
    });

    expect(typeof watchCallback).toBe('function');
  });

  test('startLocationTracking uses provided options', async () => {
    const service = loadFreshLocationService();

    await service.startLocationTracking({
      accuracy: 6, // High
      distanceInterval: 5,
      timeInterval: 2000,
    });

    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1);
    const [optionsArg] = mockWatchPositionAsync.mock.calls[0];
    expect(optionsArg).toMatchObject({
      accuracy: 6,
      distanceInterval: 5,
      timeInterval: 2000,
      mayShowUserSettingsDialog: true,
    });
  });

  test('startLocationTracking is idempotent (second call does nothing)', async () => {
    const service = loadFreshLocationService();

    await service.startLocationTracking();
    await service.startLocationTracking();

    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1);
  });

  test('watch callback updates cached coordinates used by getCurrentCoordinates', async () => {
    const service = loadFreshLocationService();

    await service.startLocationTracking();

    const update: LocationPosition = {
      coords: { latitude: 55.5, longitude: -66.6, accuracy: 7 },
      timestamp: NOW + 1,
    };

    if (watchCallback) watchCallback(update);

    const coords = await service.getCurrentCoordinates();
    expect(coords).toEqual({
      latitude: 55.5,
      longitude: -66.6,
      accuracy: 7,
      source: 'gps',
    });
    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
  });

  test('stopLocationTracking removes subscription and is safe to call twice', async () => {
    const service = loadFreshLocationService();

    await service.startLocationTracking();
    service.stopLocationTracking();

    expect(mockRemove).toHaveBeenCalledTimes(1);

    service.stopLocationTracking();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  test('getCurrentCoordinates fetches new position when not tracking', async () => {
    const service = loadFreshLocationService();

    const coords = await service.getCurrentCoordinates();

    expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(1);

    const [optionsArg] = mockGetCurrentPositionAsync.mock.calls[0];
    expect(optionsArg).toMatchObject({
      accuracy: 3, // Balanced by default
      mayShowUserSettingsDialog: true,
    });

    expect(coords).toEqual({
      latitude: 1,
      longitude: 2,
      accuracy: 10,
      source: 'gps',
    });
  });

  test('getCurrentCoordinates uses High accuracy when forceHighAccuracy is true', async () => {
    const service = loadFreshLocationService();

    await service.getCurrentCoordinates({ forceHighAccuracy: true });

    const [optionsArg] = mockGetCurrentPositionAsync.mock.calls[0];
    expect(optionsArg).toMatchObject({
      accuracy: 6, // High
      mayShowUserSettingsDialog: true,
    });
  });

  test('startLocationTracking resets internal tracking on failure and rethrows', async () => {
    mockWatchPositionAsync.mockRejectedValue(new Error('watch failed'));

    const service = loadFreshLocationService();

    await expect(service.startLocationTracking()).rejects.toThrow('watch failed');

    // After failure, a subsequent call should try again
    mockWatchPositionAsync.mockResolvedValueOnce({ remove: mockRemove });
    await expect(service.startLocationTracking()).resolves.toBeUndefined();
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(2);
  });
});
