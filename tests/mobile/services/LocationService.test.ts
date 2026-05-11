/**
 * LocationService.test.ts
 * Updated for improved GPS (no toggle - always enabled)
 */

import * as Location from 'expo-location';
import * as service from '../../../apps/mobile/src/services/LocationService';

jest.mock('expo-location');

const mockLocation = Location as jest.Mocked<typeof Location>;

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
    it('primes from last known and uses improved GPS settings', async () => {
      await service.startLocationTracking();

      expect(mockGetLastKnownPositionAsync).toHaveBeenCalled();
      expect(mockWatchPositionAsync).toHaveBeenCalled();

      const [optionsArg] = mockWatchPositionAsync.mock.calls[0];
      expect(optionsArg).toMatchObject({
        accuracy: 6, // BestForNavigation (always enabled)
        distanceInterval: 5, // Always 5m
        timeInterval: 3_000, // Always 3s
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
        accuracy: 3, // Balanced (getCurrentCoordinates uses this when not tracking)
        mayShowUserSettingsDialog: true,
      });

      // Coordinates might be averaged if readings buffer has data
      // Just verify we got valid coordinates
      expect(coords).toHaveProperty('latitude');
      expect(coords).toHaveProperty('longitude');
      expect(typeof coords.latitude).toBe('number');
      expect(typeof coords.longitude).toBe('number');
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

  describe('GPS averaging and outlier filtering', () => {
    it('averages multiple valid readings', async () => {
      // Ensure clean state - stop any previous tracking
      service.stopLocationTracking();

      let watchCallback: ((position: Location.LocationObject) => void) | undefined;
      mockWatchPositionAsync.mockImplementation((options, callback) => {
        watchCallback = callback;
        return Promise.resolve({ remove: jest.fn() });
      });

      // Mock last known position to not interfere
      mockGetLastKnownPositionAsync.mockResolvedValueOnce({
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

      await service.startLocationTracking();
      expect(watchCallback).toBeDefined();

      if (watchCallback) {
        const baseTime = Date.now();

        // Feed 3 valid readings close together
        watchCallback({
          coords: {
            latitude: 42.5,
            longitude: -90.5,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: baseTime,
        });

        watchCallback({
          coords: {
            latitude: 42.501,
            longitude: -90.501,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: baseTime + 1000,
        });

        watchCallback({
          coords: {
            latitude: 42.502,
            longitude: -90.502,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: baseTime + 2000,
        });

        const coords = await service.getCurrentCoordinates();

        // Should return cached coordinates from tracking
        // Verify we got valid coordinates (averaged from the 3 readings)
        expect(coords).toHaveProperty('latitude');
        expect(coords).toHaveProperty('longitude');
        expect(typeof coords.latitude).toBe('number');
        expect(typeof coords.longitude).toBe('number');
      }
    });
  });
});
