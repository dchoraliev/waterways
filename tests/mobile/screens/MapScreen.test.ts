// ═════════════════════════════════════════════
// MAP SCREEN - Observation Filtering
// ═════════════════════════════════════════════

describe('MapScreen - Observation Filtering', () => {
  interface FilterableObservation {
    id: string;
    time: string;
    projectId: string | null;
    tripId: string | null;
  }

  // ------------------------------------------------------
  // 1. Filter by date range - observations within range shown
  // ------------------------------------------------------
  test('Observations within date range are shown', () => {
    const observations: FilterableObservation[] = [
      { id: '1', time: '2025-01-15T10:00:00Z', projectId: null, tripId: null },
      { id: '2', time: '2025-02-10T10:00:00Z', projectId: null, tripId: null },
      { id: '3', time: '2025-03-05T10:00:00Z', projectId: null, tripId: null },
    ];

    const dateFrom = '2025-02-01';
    const dateTo = '2025-02-28';

    const filtered = observations.filter((o) => {
      const from = new Date(dateFrom);
      const to = new Date(dateTo + 'T23:59:59');
      const obsDate = new Date(o.time);
      return obsDate >= from && obsDate <= to;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('2');
  });

  // ------------------------------------------------------
  // 2. Filter by date range - observations before range excluded
  // ------------------------------------------------------
  test('Observations before date range are excluded', () => {
    const observations: FilterableObservation[] = [
      { id: '1', time: '2025-01-15T10:00:00Z', projectId: null, tripId: null },
      { id: '2', time: '2025-02-10T10:00:00Z', projectId: null, tripId: null },
    ];

    const dateFrom = '2025-02-01';

    const filtered = observations.filter((o) => {
      if (!dateFrom) return true;
      const from = new Date(dateFrom);
      return new Date(o.time) >= from;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('2');
  });

  // ------------------------------------------------------
  // 3. Filter by date range - observations after range excluded
  // ------------------------------------------------------
  test('Observations after date range are excluded', () => {
    const observations: FilterableObservation[] = [
      { id: '1', time: '2025-02-10T10:00:00Z', projectId: null, tripId: null },
      { id: '2', time: '2025-03-15T10:00:00Z', projectId: null, tripId: null },
    ];

    const dateTo = '2025-02-28';

    const filtered = observations.filter((o) => {
      if (!dateTo) return true;
      const to = new Date(dateTo + 'T23:59:59');
      return new Date(o.time) <= to;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  // ------------------------------------------------------
  // 4. Filter by project - only matching project shown
  // ------------------------------------------------------
  test('Only observations matching selected project are shown', () => {
    const observations: FilterableObservation[] = [
      { id: '1', projectId: 'proj-a', tripId: null, time: '' },
      { id: '2', projectId: 'proj-b', tripId: null, time: '' },
      { id: '3', projectId: 'proj-a', tripId: null, time: '' },
    ];

    const selectedProjectIds = new Set(['proj-a']);

    const filtered = observations.filter((o) => {
      if (selectedProjectIds.size === 0) return true;
      return o.projectId && selectedProjectIds.has(o.projectId);
    });

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('1');
    expect(filtered[1].id).toBe('3');
  });

  // ------------------------------------------------------
  // 5. Filter by project - observations without project excluded
  // ------------------------------------------------------
  test('Observations without projectId are excluded when project filter active', () => {
    const observations: FilterableObservation[] = [
      { id: '1', projectId: 'proj-a', tripId: null, time: '' },
      { id: '2', projectId: null, tripId: null, time: '' },
    ];

    const selectedProjectIds = new Set(['proj-a']);

    const filtered = observations.filter((o) => {
      if (selectedProjectIds.size === 0) return true;
      return o.projectId && selectedProjectIds.has(o.projectId);
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  // ------------------------------------------------------
  // 6. Filter by trip - only matching trip shown
  // ------------------------------------------------------
  test('Only observations matching selected trip are shown', () => {
    const observations: FilterableObservation[] = [
      { id: '1', tripId: 'trip-1', projectId: null, time: '' },
      { id: '2', tripId: 'trip-2', projectId: null, time: '' },
      { id: '3', tripId: 'trip-1', projectId: null, time: '' },
    ];

    const selectedTripIds = new Set(['trip-1']);

    const filtered = observations.filter((o) => {
      if (selectedTripIds.size === 0) return true;
      return o.tripId && selectedTripIds.has(o.tripId);
    });

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('1');
    expect(filtered[1].id).toBe('3');
  });

  // ------------------------------------------------------
  // 7. Multiple filters applied together (AND logic)
  // ------------------------------------------------------
  test('Multiple filters are combined with AND logic', () => {
    const observations: FilterableObservation[] = [
      { id: '1', time: '2025-02-10T10:00:00Z', projectId: 'proj-a', tripId: 'trip-1' },
      { id: '2', time: '2025-02-15T10:00:00Z', projectId: 'proj-b', tripId: 'trip-1' },
      { id: '3', time: '2025-02-20T10:00:00Z', projectId: 'proj-a', tripId: 'trip-2' },
    ];

    const dateFrom = '2025-02-01';
    const dateTo = '2025-02-28';
    const selectedProjectIds = new Set(['proj-a']);
    const selectedTripIds = new Set(['trip-1']);

    const filtered = observations.filter((o) => {
      const from = new Date(dateFrom);
      const to = new Date(dateTo + 'T23:59:59');
      const obsDate = new Date(o.time);

      if (obsDate < from || obsDate > to) return false;
      if (!o.projectId || !selectedProjectIds.has(o.projectId)) return false;
      if (!o.tripId || !selectedTripIds.has(o.tripId)) return false;
      return true;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  // ------------------------------------------------------
  // 8. Active filter count - no filters active
  // ------------------------------------------------------
  test('Active filter count is 0 when no filters applied', () => {
    const dateFrom = '';
    const dateTo = '';
    const selectedProjectIds = new Set<string>();
    const selectedTripIds = new Set<string>();

    let count = 0;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (selectedProjectIds.size > 0) count++;
    if (selectedTripIds.size > 0) count++;

    expect(count).toBe(0);
  });

  // ------------------------------------------------------
  // 9. Active filter count - all filters active
  // ------------------------------------------------------
  test('Active filter count is 4 when all filters applied', () => {
    const dateFrom = '2025-01-01';
    const dateTo = '2025-12-31';
    const selectedProjectIds = new Set(['proj-a']);
    const selectedTripIds = new Set(['trip-1']);

    let count = 0;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (selectedProjectIds.size > 0) count++;
    if (selectedTripIds.size > 0) count++;

    expect(count).toBe(4);
  });
});

// ═════════════════════════════════════════════
// MAP SCREEN - Observation Numbering
// ═════════════════════════════════════════════

describe('MapScreen - Observation Numbering', () => {
  interface TestObservation {
    id: string;
    time: string;
    tripId: string | null;
  }

  interface NumberedObservation extends TestObservation {
    obsNumber: number;
    journeyNumber: number | null;
  }

  const assignNumbers = (observations: TestObservation[]): NumberedObservation[] => {
    const sorted = [...observations].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const tripFirstSeen = new Map<string, number>();
    sorted.forEach((o) => {
      if (o.tripId && !tripFirstSeen.has(o.tripId)) {
        tripFirstSeen.set(o.tripId, tripFirstSeen.size + 1);
      }
    });

    const tripObsCounter = new Map<string, number>();

    return sorted.map((o) => {
      let obsNumber: number;
      if (o.tripId) {
        const next = (tripObsCounter.get(o.tripId) ?? 0) + 1;
        tripObsCounter.set(o.tripId, next);
        obsNumber = next;
      } else {
        const next = (tripObsCounter.get('__none__') ?? 0) + 1;
        tripObsCounter.set('__none__', next);
        obsNumber = next;
      }
      return {
        ...o,
        obsNumber,
        journeyNumber: o.tripId ? (tripFirstSeen.get(o.tripId) ?? null) : null,
      };
    });
  };

  // ------------------------------------------------------
  // 10. Observations numbered sequentially within same journey
  // ------------------------------------------------------
  test('Observations are numbered 1, 2, 3 within the same journey', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-01T10:00:00Z', tripId: 'trip-1' },
      { id: '2', time: '2025-01-01T11:00:00Z', tripId: 'trip-1' },
      { id: '3', time: '2025-01-01T12:00:00Z', tripId: 'trip-1' },
    ];

    const numbered = assignNumbers(observations);

    expect(numbered[0].obsNumber).toBe(1);
    expect(numbered[1].obsNumber).toBe(2);
    expect(numbered[2].obsNumber).toBe(3);
  });

  // ------------------------------------------------------
  // 11. Observation numbers reset for each journey
  // ------------------------------------------------------
  test('Observation numbers reset to 1 for each new journey', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-01T10:00:00Z', tripId: 'trip-1' },
      { id: '2', time: '2025-01-01T11:00:00Z', tripId: 'trip-1' },
      { id: '3', time: '2025-01-02T10:00:00Z', tripId: 'trip-2' },
      { id: '4', time: '2025-01-02T11:00:00Z', tripId: 'trip-2' },
    ];

    const numbered = assignNumbers(observations);

    expect(numbered[0].obsNumber).toBe(1);
    expect(numbered[1].obsNumber).toBe(2);
    expect(numbered[2].obsNumber).toBe(1); // Reset for trip-2
    expect(numbered[3].obsNumber).toBe(2);
  });

  // ------------------------------------------------------
  // 12. Journey numbers assigned in order of first appearance
  // ------------------------------------------------------
  test('Journey numbers are assigned in chronological order of first observation', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-03T10:00:00Z', tripId: 'trip-c' },
      { id: '2', time: '2025-01-01T10:00:00Z', tripId: 'trip-a' },
      { id: '3', time: '2025-01-02T10:00:00Z', tripId: 'trip-b' },
    ];

    const numbered = assignNumbers(observations);

    // After sorting by time: trip-a (Jan 1), trip-b (Jan 2), trip-c (Jan 3)
    expect(numbered[0].journeyNumber).toBe(1); // trip-a first
    expect(numbered[1].journeyNumber).toBe(2); // trip-b second
    expect(numbered[2].journeyNumber).toBe(3); // trip-c third
  });

  // ------------------------------------------------------
  // 13. Observations without trip have null journeyNumber
  // ------------------------------------------------------
  test('Observations without tripId have journeyNumber as null', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-01T10:00:00Z', tripId: null },
      { id: '2', time: '2025-01-01T11:00:00Z', tripId: null },
    ];

    const numbered = assignNumbers(observations);

    expect(numbered[0].journeyNumber).toBeNull();
    expect(numbered[1].journeyNumber).toBeNull();
  });

  // ------------------------------------------------------
  // 14. Observations without trip still get obsNumber
  // ------------------------------------------------------
  test('Observations without tripId still get sequential obsNumber', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-01T10:00:00Z', tripId: null },
      { id: '2', time: '2025-01-01T11:00:00Z', tripId: null },
      { id: '3', time: '2025-01-01T12:00:00Z', tripId: null },
    ];

    const numbered = assignNumbers(observations);

    expect(numbered[0].obsNumber).toBe(1);
    expect(numbered[1].obsNumber).toBe(2);
    expect(numbered[2].obsNumber).toBe(3);
  });

  // ------------------------------------------------------
  // 15. Mixed journeys and standalone observations numbered correctly
  // ------------------------------------------------------
  test('Mixed journey and standalone observations are numbered independently', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-01T10:00:00Z', tripId: 'trip-1' },
      { id: '2', time: '2025-01-01T11:00:00Z', tripId: null },
      { id: '3', time: '2025-01-01T12:00:00Z', tripId: 'trip-1' },
      { id: '4', time: '2025-01-01T13:00:00Z', tripId: null },
    ];

    const numbered = assignNumbers(observations);

    expect(numbered[0].journeyNumber).toBe(1);
    expect(numbered[0].obsNumber).toBe(1);

    expect(numbered[1].journeyNumber).toBeNull();
    expect(numbered[1].obsNumber).toBe(1);

    expect(numbered[2].journeyNumber).toBe(1);
    expect(numbered[2].obsNumber).toBe(2);

    expect(numbered[3].journeyNumber).toBeNull();
    expect(numbered[3].obsNumber).toBe(2);
  });

  // ------------------------------------------------------
  // 16. Observations sorted by time before numbering
  // ------------------------------------------------------
  test('Observations are sorted by time before numbering is assigned', () => {
    const observations: TestObservation[] = [
      { id: '1', time: '2025-01-01T12:00:00Z', tripId: 'trip-1' },
      { id: '2', time: '2025-01-01T10:00:00Z', tripId: 'trip-1' },
      { id: '3', time: '2025-01-01T11:00:00Z', tripId: 'trip-1' },
    ];

    const numbered = assignNumbers(observations);

    // After sorting: id 2 (10:00), id 3 (11:00), id 1 (12:00)
    expect(numbered[0].id).toBe('2');
    expect(numbered[0].obsNumber).toBe(1);

    expect(numbered[1].id).toBe('3');
    expect(numbered[1].obsNumber).toBe(2);

    expect(numbered[2].id).toBe('1');
    expect(numbered[2].obsNumber).toBe(3);
  });
});

// ═════════════════════════════════════════════
// MAP SCREEN - Helper Functions
// ═════════════════════════════════════════════

describe('MapScreen - Date Helper Functions', () => {
  const buildIso = (day: string, month: string, year: string): string => {
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const splitIso = (iso: string): { day: string; month: string; year: string } => {
    const [year = '', month = '', day = ''] = iso.split('-');
    return { day, month, year };
  };

  // ------------------------------------------------------
  // 17. buildIso creates valid YYYY-MM-DD format
  // ------------------------------------------------------
  test('buildIso creates YYYY-MM-DD from day, month, year', () => {
    const result = buildIso('15', '3', '2025');
    expect(result).toBe('2025-03-15');
  });

  // ------------------------------------------------------
  // 18. buildIso pads single digit day and month
  // ------------------------------------------------------
  test('buildIso pads single digit day and month with zeros', () => {
    const result = buildIso('5', '1', '2025');
    expect(result).toBe('2025-01-05');
  });

  // ------------------------------------------------------
  // 19. splitIso extracts day, month, year from YYYY-MM-DD
  // ------------------------------------------------------
  test('splitIso extracts day, month, year from YYYY-MM-DD string', () => {
    const result = splitIso('2025-03-15');
    expect(result).toEqual({ day: '15', month: '03', year: '2025' });
  });

  // ------------------------------------------------------
  // 20. splitIso returns empty strings for empty input
  // ------------------------------------------------------
  test('splitIso returns empty strings when given empty string', () => {
    const result = splitIso('');
    expect(result).toEqual({ day: '', month: '', year: '' });
  });
});
