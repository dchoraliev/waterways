/**
 * CameraMediaService Tests
 *
 * Tests the functionality of attaching ONE photo or video to an observation.
 * Each observation can have only ONE media item attached (within 10-second camera window).
 */

// Mock expo-sqlite BEFORE any imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-sqlite', () => require('../__mocks__/db'));

// Mock expo-location
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 43.5988,
      longitude: -89.7906,
      altitude: 100,
      accuracy: 10,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
  }),
  Accuracy: {
    High: 4,
  },
}));

import { attachLocalMediaToObservation } from '../../../apps/mobile/src/services/CameraMediaService';
import { execAsyncMock, getAllAsyncMock, runAsyncMock } from '../__mocks__/db';

describe('CameraMediaService - Media Attachment', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock database responses - CRITICAL: return empty array, not undefined
    execAsyncMock.mockResolvedValue(undefined);
    getAllAsyncMock.mockResolvedValue([]);
    runAsyncMock.mockResolvedValue(undefined);
  });

  describe('attachLocalMediaToObservation', () => {
    it('should create a media record for a photo', async () => {
      const result = await attachLocalMediaToObservation({
        observationId: 'test-obs-1',
        localUri: 'file:///test/photo.jpg',
        type: 'photo',
        fileSize: 1024000,
      });

      // Verify the returned media object has correct properties
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.media_type).toBe('image');
      expect(result.local_file_path).toBe('file:///test/photo.jpg');
      expect(result.file_size).toBe(1024000);
      expect(result.observation_id).toBe('test-obs-1');
      expect(result.sync_status).toBe('pending');
      expect(result.last_synced_at).toBe(0);
    });

    it('should create a media record for a video', async () => {
      const result = await attachLocalMediaToObservation({
        observationId: 'test-obs-2',
        localUri: 'file:///test/video.mp4',
        type: 'video',
        fileSize: 5120000,
      });

      expect(result.media_type).toBe('video');
      expect(result.local_file_path).toBe('file:///test/video.mp4');
      expect(result.file_size).toBe(5120000);
    });

    it('should handle null file size', async () => {
      const result = await attachLocalMediaToObservation({
        observationId: 'test-obs-3',
        localUri: 'file:///test/photo_no_size.jpg',
        type: 'photo',
        fileSize: null,
      });

      expect(result.file_size).toBeNull();
    });

    it('should handle file paths with special characters', async () => {
      const specialPath = 'file:///photos/obs_2024-02-09_14:30:45_bridge#1_(close-up).jpg';

      const result = await attachLocalMediaToObservation({
        observationId: 'test-obs-4',
        localUri: specialPath,
        type: 'photo',
        fileSize: 2048000,
      });

      expect(result.local_file_path).toBe(specialPath);
    });

    it('should handle very large file sizes', async () => {
      const result = await attachLocalMediaToObservation({
        observationId: 'test-obs-5',
        localUri: 'file:///videos/large_video.mp4',
        type: 'video',
        fileSize: 104857600, // 100 MB
      });

      expect(result.file_size).toBe(104857600);
    });

    it('should generate unique IDs for each media attachment', async () => {
      const result1 = await attachLocalMediaToObservation({
        observationId: 'test-obs-6',
        localUri: 'file:///test/photo1.jpg',
        type: 'photo',
        fileSize: 1024000,
      });

      const result2 = await attachLocalMediaToObservation({
        observationId: 'test-obs-7',
        localUri: 'file:///test/photo2.jpg',
        type: 'photo',
        fileSize: 1024000,
      });

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should set creation timestamp', async () => {
      const before = Date.now();

      const result = await attachLocalMediaToObservation({
        observationId: 'test-obs-8',
        localUri: 'file:///test/photo.jpg',
        type: 'photo',
        fileSize: 1024000,
      });

      const after = Date.now();

      expect(result.created_at).toBeGreaterThanOrEqual(before);
      expect(result.created_at).toBeLessThanOrEqual(after);
    });
  });
});
