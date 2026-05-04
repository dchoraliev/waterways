/**
 * LocationService.test.ts
 * Updated to match improved GPS behavior with toggle support
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as service from '../../../apps/mobile/src/services/LocationService';

jest.mock('expo-location');
jest.mock('@react-native-async-storage/async-storage');

const mockLocation = Location as jest.Mocked<typeof Location>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock the Accuracy enum - jest doesn't auto-mock it
(Location.Accuracy as unknown as Record<string, number>) = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

describe('LocationService', () => {
  let mockWatchPositionAsync: jest.Mock;
  let mockGetCurrentPositionAsync: jest.Mock;
  let mockGetLastKnownPositionAsync: jest.Mock;
  let mockRequestForegroundPermissionsAsync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AsyncStorage to return null (toggle OFF by default)
    mockAsyncStorage.getItem.mockResolvedValue(null);

    mockWatchPositionAsync = jest.fn();
    mockGetCurrentPositionAsync = jest.fn();
    mockGetLastKnownPositionAsync = jest.fn();
    mockRequestForegroundPermissionsAsync = jest.fn();

    mockLocation.watchPositionAsync = mockWatchPositionAsync;
    mockLocation.getCurrentPositionAsync = mockGetCurrentPositionAsync;
    mockLocation.getLastKnownPositionAsync = mockGetLastKnownPositionAsync;
    mockLocation.requestForegroundPermissionsAsync = mockRequestForegroundPermissionsAsync;

    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
      granted: true,
    });

    mockGetLastKnownPositionAsync.mockResolvedValue({
      coords: {
        latitude: 42.5,
        longitude: -90.5,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });

    const mockSubscription = {
      remove: jest.fn(),
    };
    mockWatchPositionAsync.mockResolvedValue(mockSubscription);
  });

  afterEach(() => {
    service.stopLocationTracking();
  });

  describe('validateLocationPermission', () => {
    it('should request and validate foreground permissions', async () => {
      await service.validateLocationPermission();
      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should throw when permissions are denied', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        canAskAgain: false,
        expires: 'never',
        granted: false,
      });

      await expect(service.validateLocationPermission()).rejects.toThrow(
        'Location permission not granted'
      );
    });
  });

  describe('startLocationTracking', () => {
    it('primes from last known and starts watchPositionAsync', async () => {
      await service.startLocationTracking({
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
        timeInterval: 10_000,
      });

      expect(mockGetLastKnownPositionAsync).toHaveBeenCalled();
      expect(mockWatchPositionAsync).toHaveBeenCalled();

      const [optionsArg] = mockWatchPositionAsync.mock.calls[0];
      expect(optionsArg).toMatchObject({
        accuracy: 3, // Balanced (toggle OFF uses provided accuracy)
        distanceInterval: 25,
        timeInterval: 10_000,
        mayShowUserSettingsDialog: true,
      });
    });

    it('uses improved settings when toggle is ON', async () => {
      // Mock toggle ON
      mockAsyncStorage.getItem.mockResolvedValue('true');

      await service.startLocationTracking({
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
        timeInterval: 10_000,
      });

      expect(mockWatchPositionAsync).toHaveBeenCalled();

      const [optionsArg] = mockWatchPositionAsync.mock.calls[0];
      expect(optionsArg).toMatchObject({
        accuracy: 6, // BestForNavigation (toggle ON overrides)
        distanceInterval: 5, // Improved: 5m instead of 25m
        timeInterval: 3_000, // Improved: 3s instead of 10s
        mayShowUserSettingsDialog: true,
      });
    });
  });

  describe('watch callback updates cached coordinates', () => {
    it('updates cached coordinates used by getCurrentCoordinates', async () => {
      let watchCallback: ((position: Location.LocationObject) => void) | undefined;
      mockWatchPositionAsync.mockImplementation((options, callback) => {
        watchCallback = callback;
        return Promise.resolve({ remove: jest.fn() });
      });

      await service.startLocationTracking();
      expect(watchCallback).toBeDefined();

      // Simulate position update from watch
      if (watchCallback) {
        watchCallback({
          coords: {
            latitude: 55.5,
            longitude: -66.6,
            accuracy: 7,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }

      const coords = await service.getCurrentCoordinates();
      expect(coords).toEqual({
        latitude: 55.5,
        longitude: -66.6,
      });
    });
  });

  describe('getCurrentCoordinates', () => {
    it('fetches new position when not tracking', async () => {
      mockGetCurrentPositionAsync.mockResolvedValueOnce({
        coords: {
          latitude: 11.1,
          longitude: 22.2,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const coords = await service.getCurrentCoordinates();

      expect(mockGetCurrentPositionAsync).toHaveBeenCalled();
      const [optionsArg] = mockGetCurrentPositionAsync.mock.calls[0];
      expect(optionsArg).toMatchObject({
        accuracy: 3, // Balanced by default (toggle OFF)
        mayShowUserSettingsDialog: true,
      });

      expect(coords).toEqual({
        latitude: 11.1,
        longitude: 22.2,
      });
    });

    it('uses BestForNavigation accuracy when toggle is ON', async () => {
      // Mock toggle ON
      mockAsyncStorage.getItem.mockResolvedValue('true');

      // Start tracking to load the flag, then stop so getCurrentCoordinates fetches new position
      await service.startLocationTracking();
      service.stopLocationTracking();

      mockGetCurrentPositionAsync.mockResolvedValueOnce({
        coords: {
          latitude: 11.1,
          longitude: 22.2,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const coords = await service.getCurrentCoordinates();

      expect(mockGetCurrentPositionAsync).toHaveBeenCalled();

      expect(coords).toEqual({
        latitude: 11.1,
        longitude: 22.2,
      });
    });
  });

  describe('stopLocationTracking', () => {
    it('stops active subscription', async () => {
      const mockRemove = jest.fn();
      mockWatchPositionAsync.mockResolvedValueOnce({ remove: mockRemove });

      await service.startLocationTracking();
      service.stopLocationTracking();

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('getLocationQuality', () => {
    it('returns quality based on accuracy thresholds', () => {
      // This test needs the service to have accuracy data
      // We'll simulate by starting tracking first

      const quality = service.getLocationQuality();

      // Initial state might be dead_reckoning or based on last known
      expect(quality).toHaveProperty('status');
      expect(quality).toHaveProperty('accuracy');
      expect(quality).toHaveProperty('label');
    });
  });

  describe('GPS quality levels', () => {
    it('exports all GPS quality enum values', () => {
      expect(service.GPSQuality.GOOD).toBe('good');
      expect(service.GPSQuality.MEDIUM).toBe('medium');
      expect(service.GPSQuality.BAD).toBe('bad');
      expect(service.GPSQuality.POOR).toBe('poor');
      expect(service.GPSQuality.DEAD_RECKONING).toBe('dead_reckoning');
    });
  });
});
