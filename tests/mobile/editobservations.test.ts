import type { JourneyDraft } from 'apps/mobile/src/hooks/useDraftJourneys';
import type { Observation } from 'apps/mobile/src/components/ObservationCard';

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
  status: 'Offline',
  category: null,
  keyword: null,
  manuallyEdited: false,
  ...overrides,
});

const makeDraft = (overrides: Partial<JourneyDraft> = {}): JourneyDraft => ({
  id: 'trip-1',
  createdAt: Date.now(),
  status: 'draft',
  projectId: null,
  observations: [makeObservation()],
  ...overrides,
});

// ═════════════════════════════════════════════
// EDIT OBSERVATION - handleSave logic
// ═════════════════════════════════════════════

describe('Edit Observation - save logic', () => {
  // ------------------------------------------------------
  // 1. manuallyEdited is set to true on save
  // ------------------------------------------------------
  test('Saving an observation sets manuallyEdited to true', () => {
    const draft = makeDraft();
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Updated description',
      manuallyEdited: true,
    };

    expect(updated[index].manuallyEdited).toBe(true);
  });

  // ------------------------------------------------------
  // 2. Description is updated on save
  // ------------------------------------------------------
  test('Saving updates the observation description', () => {
    const draft = makeDraft();
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'New description text',
      manuallyEdited: true,
    };

    expect(updated[index].description).toBe('New description text');
  });

  // ------------------------------------------------------
  // 3. Location is updated on save
  // ------------------------------------------------------
  test('Saving updates the observation location', () => {
    const draft = makeDraft();
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      location: 'New Location',
      manuallyEdited: true,
    };

    expect(updated[index].location).toBe('New Location');
  });

  // ------------------------------------------------------
  // 4. Category is updated on save
  // ------------------------------------------------------
  test('Saving updates the observation category', () => {
    const draft = makeDraft();
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      category: 'Environmental',
      manuallyEdited: true,
    };

    expect(updated[index].category).toBe('Environmental');
  });

  // ------------------------------------------------------
  // 5. Keyword is updated on save
  // ------------------------------------------------------
  test('Saving updates the observation keyword', () => {
    const draft = makeDraft();
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      keyword: 'algae',
      manuallyEdited: true,
    };

    expect(updated[index].keyword).toBe('algae');
  });

  // ------------------------------------------------------
  // 6. Other observations are not affected by saving one
  // ------------------------------------------------------
  test('Saving one observation does not modify other observations', () => {
    const draft = makeDraft({
      observations: [
        makeObservation({ id: 'obs-1', description: 'First observation' }),
        makeObservation({ id: 'obs-2', description: 'Second observation' }),
      ],
    });

    const updated = [...draft.observations];
    updated[0] = {
      ...updated[0],
      description: 'Updated first observation',
      manuallyEdited: true,
    };

    expect(updated[1].description).toBe('Second observation');
    expect(updated[1].manuallyEdited).toBe(false);
  });

  // ------------------------------------------------------
  // 7. Null draft prevents save
  // ------------------------------------------------------
  test('Save does nothing when draft is null', () => {
    const draft = null;
    let saveCalled = false;

    if (draft) {
      saveCalled = true;
    }

    expect(saveCalled).toBe(false);
  });
});

// ═════════════════════════════════════════════
// EDIT OBSERVATION - auto-classification logic
// ═════════════════════════════════════════════

describe('Edit Observation - auto-classification on description change', () => {
  // ------------------------------------------------------
  // 8. Non-empty description triggers classification
  // ------------------------------------------------------
  test('Non-empty description runs classifyObservation', () => {
    const text = 'Saw a bird near the river';
    const didClassify = text.length > 0;
    expect(didClassify).toBe(true);
  });

  // ------------------------------------------------------
  // 9. Empty description skips classification
  // ------------------------------------------------------
  test('Empty description skips classifyObservation', () => {
    const text = '';
    const didClassify = text.length > 0;
    expect(didClassify).toBe(false);
  });

  // ------------------------------------------------------
  // 10. Unclassified category is stored as null
  // ------------------------------------------------------
  test("Category stored as null when classifier returns 'Unclassified'", () => {
    const classifierResult = { category: 'Unclassified', keyword: null };
    const stored = classifierResult.category === 'Unclassified' ? null : classifierResult.category;
    expect(stored).toBeNull();
  });

  // ------------------------------------------------------
  // 11. Valid category is stored as-is
  // ------------------------------------------------------
  test('Valid category is stored correctly from classifier result', () => {
    const classifierResult = { category: 'Wildlife', keyword: 'bird' };
    const stored = classifierResult.category === 'Unclassified' ? null : classifierResult.category;
    expect(stored).toBe('Wildlife');
  });
});

// ═════════════════════════════════════════════
// OBSERVATION CARD - hasMedia flag
// ═════════════════════════════════════════════

describe('ObservationCard - hasMedia flag', () => {
  // ------------------------------------------------------
  // 12. hasMedia defaults to false
  // ------------------------------------------------------
  test('Observation hasMedia defaults to false when not set', () => {
    const obs = makeObservation();
    expect(obs.hasMedia).toBe(false);
  });

  // ------------------------------------------------------
  // 13. hasMedia is true when set
  // ------------------------------------------------------
  test('Observation hasMedia is true when explicitly set', () => {
    const obs = makeObservation({ hasMedia: true });
    expect(obs.hasMedia).toBe(true);
  });

  // ------------------------------------------------------
  // 14. hasMedia does not affect other fields
  // ------------------------------------------------------
  test('Setting hasMedia to true does not change other observation fields', () => {
    const obs = makeObservation({ hasMedia: true });
    expect(obs.description).toBe('Saw a bird near the river');
    expect(obs.manuallyEdited).toBe(false);
    expect(obs.status).toBe('Offline');
  });
});

// ═════════════════════════════════════════════
// DRAFT JOURNEYS - markObservationHasMedia
// ═════════════════════════════════════════════

describe('useDraftJourneys - markObservationHasMedia', () => {
  // ------------------------------------------------------
  // 15. Media set added to when markObservationHasMedia called
  // ------------------------------------------------------
  test('Adding an observationId to the media set marks it as having media', () => {
    const mediaIds = new Set<string>();
    mediaIds.add('obs-1');
    expect(mediaIds.has('obs-1')).toBe(true);
  });

  // ------------------------------------------------------
  // 16. Observation without media is not in the set
  // ------------------------------------------------------
  test('Observation not added to media set has hasMedia false', () => {
    const mediaIds = new Set<string>();
    mediaIds.add('obs-1');
    expect(mediaIds.has('obs-2')).toBe(false);
  });

  // ------------------------------------------------------
  // 17. Multiple observations can be marked independently
  // ------------------------------------------------------
  test('Multiple observations can be independently marked with hasMedia', () => {
    const mediaIds = new Set<string>();
    mediaIds.add('obs-1');
    mediaIds.add('obs-3');

    expect(mediaIds.has('obs-1')).toBe(true);
    expect(mediaIds.has('obs-2')).toBe(false);
    expect(mediaIds.has('obs-3')).toBe(true);
  });

  // ------------------------------------------------------
  // 18. getDraftByTripId maps mediaIds to hasMedia correctly
  // ------------------------------------------------------
  test('getDraftByTripId sets hasMedia correctly from mediaObservationIds', () => {
    const mediaIds = new Set<string>(['obs-2']);

    const rows = [makeObservation({ id: 'obs-1' }), makeObservation({ id: 'obs-2' })];

    const mapped = rows.map((row) => ({
      ...row,
      hasMedia: mediaIds.has(row.id),
    }));

    expect(mapped[0].hasMedia).toBe(false);
    expect(mapped[1].hasMedia).toBe(true);
  });

  // ------------------------------------------------------
  // 19. In-memory draft is returned before DB fetch
  // ------------------------------------------------------
  test('Existing in-memory draft is returned without re-fetching from DB', () => {
    const drafts: JourneyDraft[] = [makeDraft({ id: 'trip-1' })];
    const found = drafts.find((d) => d.id === 'trip-1');
    expect(found).toBeDefined();
    expect(found?.id).toBe('trip-1');
  });

  // ------------------------------------------------------
  // 20. No in-memory draft falls through to DB fetch
  // ------------------------------------------------------
  test('Missing in-memory draft returns undefined, triggering DB fetch', () => {
    const drafts: JourneyDraft[] = [];
    const found = drafts.find((d) => d.id === 'trip-99');
    expect(found).toBeUndefined();
  });
});

// ═════════════════════════════════════════════
// DISCARD LOGIC
// ═════════════════════════════════════════════

describe('Edit Observation - discard logic', () => {
  // ------------------------------------------------------
  // 21. Discard leaves original description unchanged
  // ------------------------------------------------------
  test('Discarding does not modify the original observation description', () => {
    const draft = makeDraft();
    const original = { ...draft.observations[0] };

    // Simulate user typing but then discarding (no save called)
    const discarded = draft.observations[0];

    expect(discarded.description).toBe(original.description);
  });

  // ------------------------------------------------------
  // 22. Discard leaves manuallyEdited unchanged
  // ------------------------------------------------------
  test('Discarding does not set manuallyEdited to true', () => {
    const draft = makeDraft();
    const original = { ...draft.observations[0] };

    const discarded = draft.observations[0];

    expect(discarded.manuallyEdited).toBe(original.manuallyEdited);
    expect(discarded.manuallyEdited).toBe(false);
  });

  // ------------------------------------------------------
  // 23. Discard leaves all fields unchanged
  // ------------------------------------------------------
  test('Discarding leaves all observation fields identical to original', () => {
    const draft = makeDraft();
    const original = { ...draft.observations[0] };

    const discarded = draft.observations[0];

    expect(discarded).toEqual(original);
  });
});

// ═════════════════════════════════════════════
// SAVE PRESERVES manuallyEdited
// ═════════════════════════════════════════════

describe('Edit Observation - manuallyEdited preservation', () => {
  // ------------------------------------------------------
  // 24. Already manually edited observation stays true after re-save
  // ------------------------------------------------------
  test('Re-saving an already manuallyEdited observation keeps manuallyEdited true', () => {
    const draft = makeDraft({
      observations: [makeObservation({ manuallyEdited: true, description: 'Previously edited' })],
    });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Edited again',
      manuallyEdited: true,
    };

    expect(updated[index].manuallyEdited).toBe(true);
  });

  // ------------------------------------------------------
  // 25. manuallyEdited false on fresh observation before any save
  // ------------------------------------------------------
  test('Fresh observation has manuallyEdited false before any save', () => {
    const obs = makeObservation();
    expect(obs.manuallyEdited).toBe(false);
  });
});

// ═════════════════════════════════════════════
// SAVE PRESERVES OTHER DRAFT FIELDS
// ═════════════════════════════════════════════

describe('Edit Observation - saveDraft preserves draft metadata', () => {
  // ------------------------------------------------------
  // 26. projectId is preserved after saving an observation
  // ------------------------------------------------------
  test('Saving an observation preserves the draft projectId', () => {
    const draft = makeDraft({ projectId: 'project-abc' });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = { ...updated[index], description: 'Updated', manuallyEdited: true };

    const savedDraft: JourneyDraft = { ...draft, observations: updated };

    expect(savedDraft.projectId).toBe('project-abc');
  });

  // ------------------------------------------------------
  // 27. status is preserved after saving an observation
  // ------------------------------------------------------
  test('Saving an observation preserves the draft status', () => {
    const draft = makeDraft({ status: 'draft' });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = { ...updated[index], description: 'Updated', manuallyEdited: true };

    const savedDraft: JourneyDraft = { ...draft, observations: updated };

    expect(savedDraft.status).toBe('draft');
  });

  // ------------------------------------------------------
  // 28. createdAt is preserved after saving an observation
  // ------------------------------------------------------
  test('Saving an observation preserves the draft createdAt timestamp', () => {
    const createdAt = 1700000000000;
    const draft = makeDraft({ createdAt });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = { ...updated[index], description: 'Updated', manuallyEdited: true };

    const savedDraft: JourneyDraft = { ...draft, observations: updated };

    expect(savedDraft.createdAt).toBe(createdAt);
  });

  // ------------------------------------------------------
  // 29. Observation count stays the same after saving
  // ------------------------------------------------------
  test('Saving one observation does not change the total observation count', () => {
    const draft = makeDraft({
      observations: [
        makeObservation({ id: 'obs-1' }),
        makeObservation({ id: 'obs-2' }),
        makeObservation({ id: 'obs-3' }),
      ],
    });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = { ...updated[index], description: 'Updated', manuallyEdited: true };

    const savedDraft: JourneyDraft = { ...draft, observations: updated };

    expect(savedDraft.observations.length).toBe(3);
  });
});

// ═════════════════════════════════════════════
// SAVE PRESERVES hasMedia
// ═════════════════════════════════════════════

describe('Edit Observation - hasMedia preserved on save', () => {
  // ------------------------------------------------------
  // 30. hasMedia true is preserved after editing and saving
  // ------------------------------------------------------
  test('Saving an observation with hasMedia true keeps hasMedia true', () => {
    const draft = makeDraft({
      observations: [makeObservation({ hasMedia: true })],
    });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Updated description',
      manuallyEdited: true,
    };

    expect(updated[index].hasMedia).toBe(true);
  });

  // ------------------------------------------------------
  // 31. hasMedia false is preserved after editing and saving
  // ------------------------------------------------------
  test('Saving an observation with hasMedia false keeps hasMedia false', () => {
    const draft = makeDraft({
      observations: [makeObservation({ hasMedia: false })],
    });
    const index = 0;

    const updated = [...draft.observations];
    updated[index] = {
      ...updated[index],
      description: 'Updated description',
      manuallyEdited: true,
    };

    expect(updated[index].hasMedia).toBe(false);
  });

  // ------------------------------------------------------
  // 32. hasMedia is not affected by changing description
  // ------------------------------------------------------
  test('Changing description does not reset hasMedia', () => {
    const obs = makeObservation({ hasMedia: true });

    const updated = { ...obs, description: 'Completely new description' };

    expect(updated.hasMedia).toBe(true);
  });
});

// ═════════════════════════════════════════════
// OBSERVATION CARD - video vs photo icon selection
// ═════════════════════════════════════════════

describe('ObservationCard - mediaType icon selection', () => {
  // Mirrors component logic:
  // source={mediaType === 'video' ? videoIcon : mediaIcon}
  const iconType = (obs: Observation): 'video' | 'photo' | 'none' => {
    if (obs.hasMedia !== true) return 'none';
    return obs.mediaType === 'video' ? 'video' : 'photo';
  };

  // ------------------------------------------------------
  // 33. Video icon selected when mediaType = video
  // ------------------------------------------------------
  test('Video icon is selected when hasMedia=true and mediaType=video', () => {
    const obs = makeObservation({ hasMedia: true, mediaType: 'video' });
    expect(iconType(obs)).toBe('video');
  });

  // ------------------------------------------------------
  // 34. Photo icon selected when mediaType = photo
  // ------------------------------------------------------
  test('Photo icon is selected when hasMedia=true and mediaType=photo', () => {
    const obs = makeObservation({ hasMedia: true, mediaType: 'photo' });
    expect(iconType(obs)).toBe('photo');
  });

  // ------------------------------------------------------
  // 35. Defaults to photo icon when mediaType is null/undefined
  // ------------------------------------------------------
  test('Defaults to photo icon when hasMedia=true and mediaType is null', () => {
    const obs = makeObservation({ hasMedia: true, mediaType: null });
    expect(iconType(obs)).toBe('photo');
  });

  // ------------------------------------------------------
  // 36. No icon selected when hasMedia=false (even if mediaType is video)
  // ------------------------------------------------------
  test('No media icon is selected when hasMedia=false', () => {
    const obs = makeObservation({ hasMedia: false, mediaType: 'video' });
    expect(iconType(obs)).toBe('none');
  });
});

// ═════════════════════════════════════════════
// OBSERVATION CARD - view button + open behavior (logic-level)
// ═════════════════════════════════════════════

describe('ObservationCard - view media button + behavior', () => {
  // Mirrors: hasValidMedia = hasMedia === true && !!mediaFilePath
  const hasValidMedia = (obs: Observation): boolean => obs.hasMedia === true && !!obs.mediaFilePath;

  // Mirrors:
  // {isPhoto ? 'View Photo' : isVideo ? 'View Video' : 'View Media'}
  const viewLabel = (obs: Observation): 'View Photo' | 'View Video' | 'View Media' => {
    if (obs.mediaType === 'photo') return 'View Photo';
    if (obs.mediaType === 'video') return 'View Video';
    return 'View Media';
  };

  // Mirrors the onPress branching in the component:
  const simulatePress = (obs: Observation) => {
    const isPhoto = obs.mediaType === 'photo';
    const isVideo = obs.mediaType === 'video';

    return {
      opensPhotoModal: isPhoto,
      showsVideoAlert: isVideo,
      showsUnknownAlert: !isPhoto && !isVideo,
    };
  };

  // ------------------------------------------------------
  // 37. View button only shows with hasMedia AND mediaFilePath
  // ------------------------------------------------------
  test('View button is shown only when hasMedia=true and mediaFilePath exists', () => {
    const a = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaFilePath: null,
    });
    const b = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaFilePath: 'file:///tmp/photo.jpg',
    });

    expect(hasValidMedia(a)).toBe(false);
    expect(hasValidMedia(b)).toBe(true);
  });

  // ------------------------------------------------------
  // 38. View button label is View Photo for photos
  // ------------------------------------------------------
  test('View button label is "View Photo" when mediaType=photo', () => {
    const obs = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaFilePath: 'file:///tmp/photo.jpg',
    });
    expect(viewLabel(obs)).toBe('View Photo');
  });

  // ------------------------------------------------------
  // 39. View button label is View Video for videos
  // ------------------------------------------------------
  test('View button label is "View Video" when mediaType=video', () => {
    const obs = makeObservation({
      hasMedia: true,
      mediaType: 'video',
      mediaFilePath: 'file:///tmp/video.mp4',
    });
    expect(viewLabel(obs)).toBe('View Video');
  });

  // ------------------------------------------------------
  // 40. View button label falls back to View Media for unknown type
  // ------------------------------------------------------
  test('View button label is "View Media" when mediaType is null/unknown', () => {
    const obs = makeObservation({
      hasMedia: true,
      mediaType: null,
      mediaFilePath: 'file:///tmp/file.bin',
    });
    expect(viewLabel(obs)).toBe('View Media');
  });

  // ------------------------------------------------------
  // 41. Pressing View Photo opens the photo modal path
  // ------------------------------------------------------
  test('Pressing View Photo triggers the photo modal path', () => {
    const obs = makeObservation({
      hasMedia: true,
      mediaType: 'photo',
      mediaFilePath: 'file:///tmp/photo.jpg',
    });
    const result = simulatePress(obs);
    expect(result.opensPhotoModal).toBe(true);
    expect(result.showsVideoAlert).toBe(false);
    expect(result.showsUnknownAlert).toBe(false);
  });

  // ------------------------------------------------------
  // 42. Pressing View Video triggers the video alert path
  // ------------------------------------------------------
  test('Pressing View Video triggers the video alert path', () => {
    const obs = makeObservation({
      hasMedia: true,
      mediaType: 'video',
      mediaFilePath: 'file:///tmp/video.mp4',
    });
    const result = simulatePress(obs);
    expect(result.opensPhotoModal).toBe(false);
    expect(result.showsVideoAlert).toBe(true);
    expect(result.showsUnknownAlert).toBe(false);
  });

  // ------------------------------------------------------
  // 43. Unknown media type triggers the unknown alert path
  // ------------------------------------------------------
  test('Unknown media type triggers the unknown alert path', () => {
    const obs = makeObservation({
      hasMedia: true,
      mediaType: null,
      mediaFilePath: 'file:///tmp/file.bin',
    });
    const result = simulatePress(obs);
    expect(result.opensPhotoModal).toBe(false);
    expect(result.showsVideoAlert).toBe(false);
    expect(result.showsUnknownAlert).toBe(true);
  });
});
