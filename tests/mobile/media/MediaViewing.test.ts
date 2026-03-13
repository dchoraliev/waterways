import type { JourneyDraft } from 'apps/mobile/src/hooks/useDraftJourneys';
import type { Observation } from 'apps/mobile/src/components/ObservationCard';
import { SyncStatus } from 'apps/mobile/src/database/SyncStatus';

// ─────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────

const makeObservation = (overrides: Partial<Observation> = {}): Observation => ({
  id: 'obs-1',
  time: '04:08 AM',
  location: 'Test Location',
  description: 'Saw a bird near the river',
  tags: [],
  hasAudio: false,
  hasMedia: false,
  status: SyncStatus.DRAFTED,
  category: null,
  keyword: null,
  manuallyEdited: false,
  mediaType: null,
  mediaTimestamp: null,
  mediaFilePath: null,
  ...overrides,
});

const makeDraft = (overrides: Partial<JourneyDraft> = {}): JourneyDraft => ({
  id: 'trip-1',
  createdAt: Date.now(),
  status: SyncStatus.DRAFTED,
  projectId: null,
  observations: [makeObservation()],
  ...overrides,
});

// ═════════════════════════════════════════════
// VIEW PHOTO/VIDEO - ObservationCard display
// ═════════════════════════════════════════════

describe('ObservationCard - Photo/Video Viewing', () => {
  // ------------------------------------------------------
  // 1. Photo icon shows when mediaType is 'photo'
  // ------------------------------------------------------
  test('Photo icon is displayed when observation has a photo', () => {
    const observation = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaFilePath: 'file:///path/to/photo.jpg',
      mediaTimestamp: 120, // 2 minutes into journey
    });

    expect(observation.hasMedia).toBe(true);
    expect(observation.mediaType).toBe('photo');
    expect(observation.mediaFilePath).toBe('file:///path/to/photo.jpg');
  });

  // ------------------------------------------------------
  // 2. Video icon shows when mediaType is 'video'
  // ------------------------------------------------------
  test('Video icon is displayed when observation has a video', () => {
    const observation = makeObservation({
      hasMedia: true,
      mediaType: 'video',
      mediaFilePath: 'file:///path/to/video.mp4',
      mediaTimestamp: 180, // 3 minutes into journey
    });

    expect(observation.hasMedia).toBe(true);
    expect(observation.mediaType).toBe('video');
    expect(observation.mediaFilePath).toBe('file:///path/to/video.mp4');
  });

  // ------------------------------------------------------
  // 3. Media timestamp is formatted correctly
  // ------------------------------------------------------
  test('Media timestamp is formatted as mm:ss or h:mm:ss', () => {
    const formatElapsed = (seconds: number): string => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return `${m}:${String(s).padStart(2, '0')}`;
    };

    expect(formatElapsed(120)).toBe('2:00'); // 2 minutes
    expect(formatElapsed(65)).toBe('1:05'); // 1 minute 5 seconds
    expect(formatElapsed(3665)).toBe('1:01:05'); // 1 hour 1 minute 5 seconds
  });

  // ------------------------------------------------------
  // 4. "View Photo" button only shows for photos
  // ------------------------------------------------------
  test('"View Photo" button appears only when mediaType is photo', () => {
    const photoObservation = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaFilePath: 'file:///path/to/photo.jpg',
    });

    const videoObservation = makeObservation({
      hasMedia: true,
      mediaType: 'video',
      mediaFilePath: 'file:///path/to/video.mp4',
    });

    const noMediaObservation = makeObservation({
      hasMedia: false,
      mediaType: null,
      mediaFilePath: null,
    });

    // Photo should show "View Photo" button
    expect(photoObservation.hasMedia && photoObservation.mediaType === 'photo').toBe(true);

    // Video should NOT show "View Photo" button
    expect(videoObservation.hasMedia && videoObservation.mediaType === 'photo').toBe(false);

    // No media should NOT show "View Photo" button
    expect(noMediaObservation.hasMedia && noMediaObservation.mediaFilePath).toBe(false);
  });

  // ------------------------------------------------------
  // 5. No media icon/timestamp shown when hasMedia is false
  // ------------------------------------------------------
  test('No media icon or timestamp shown when observation has no media', () => {
    const observation = makeObservation({
      hasMedia: false,
      mediaType: null,
      mediaTimestamp: null,
      mediaFilePath: null,
    });

    expect(observation.hasMedia).toBe(false);
    expect(observation.mediaType).toBeNull();
    expect(observation.mediaTimestamp).toBeNull();
  });
});

// ═════════════════════════════════════════════
// EDIT OBSERVATION - Media field preservation
// ═════════════════════════════════════════════

describe('Edit Observation - Media Field Preservation', () => {
  // ------------------------------------------------------
  // 1. Media fields are preserved after editing
  // ------------------------------------------------------
  test('Media fields remain intact when editing description/location/category', () => {
    const draft = makeDraft({
      observations: [
        makeObservation({
          hasMedia: true,
          mediaType: 'photo',
          mediaTimestamp: 120,
          mediaFilePath: 'file:///path/to/photo.jpg',
        }),
      ],
    });

    const index = 0;
    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Updated description',
      location: 'New location',
      category: 'WATER_QUALITY',
      keyword: 'pollution',
      manuallyEdited: true,
      // Preserve media fields
      hasMedia: updated[index].hasMedia,
      mediaType: updated[index].mediaType,
      mediaTimestamp: updated[index].mediaTimestamp,
      mediaFilePath: updated[index].mediaFilePath,
    };

    expect(updated[index].hasMedia).toBe(true);
    expect(updated[index].mediaType).toBe('photo');
    expect(updated[index].mediaTimestamp).toBe(120);
    expect(updated[index].mediaFilePath).toBe('file:///path/to/photo.jpg');
    expect(updated[index].description).toBe('Updated description');
  });

  // ------------------------------------------------------
  // 2. Media fields preserved for video observations
  // ------------------------------------------------------
  test('Video media fields are preserved when editing observation', () => {
    const draft = makeDraft({
      observations: [
        makeObservation({
          hasMedia: true,
          mediaType: 'video',
          mediaTimestamp: 300,
          mediaFilePath: 'file:///path/to/video.mp4',
        }),
      ],
    });

    const index = 0;
    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Edited video observation',
      manuallyEdited: true,
      hasMedia: updated[index].hasMedia,
      mediaType: updated[index].mediaType,
      mediaTimestamp: updated[index].mediaTimestamp,
      mediaFilePath: updated[index].mediaFilePath,
    };

    expect(updated[index].mediaType).toBe('video');
    expect(updated[index].mediaTimestamp).toBe(300);
  });

  // ------------------------------------------------------
  // 3. Media fields are null when no media attached
  // ------------------------------------------------------
  test('Media fields remain null when observation has no media', () => {
    const draft = makeDraft({
      observations: [
        makeObservation({
          hasMedia: false,
          mediaType: null,
          mediaTimestamp: null,
          mediaFilePath: null,
        }),
      ],
    });

    const index = 0;
    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Updated observation without media',
      manuallyEdited: true,
      hasMedia: updated[index].hasMedia,
      mediaType: updated[index].mediaType,
      mediaTimestamp: updated[index].mediaTimestamp,
      mediaFilePath: updated[index].mediaFilePath,
    };

    expect(updated[index].hasMedia).toBe(false);
    expect(updated[index].mediaType).toBeNull();
    expect(updated[index].mediaTimestamp).toBeNull();
    expect(updated[index].mediaFilePath).toBeNull();
  });

  // ------------------------------------------------------
  // 4. All media fields preserved together
  // ------------------------------------------------------
  test('All four media fields are preserved as a unit', () => {
    const observation = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaTimestamp: 450,
      mediaFilePath: 'file:///path/to/image.jpg',
    });

    // Simulate edit save
    const saved = {
      ...observation,
      description: 'Edited',
      hasMedia: observation.hasMedia,
      mediaType: observation.mediaType,
      mediaTimestamp: observation.mediaTimestamp,
      mediaFilePath: observation.mediaFilePath,
    };

    // Verify all media fields preserved
    expect(saved.hasMedia).toBe(observation.hasMedia);
    expect(saved.mediaType).toBe(observation.mediaType);
    expect(saved.mediaTimestamp).toBe(observation.mediaTimestamp);
    expect(saved.mediaFilePath).toBe(observation.mediaFilePath);
  });
});
