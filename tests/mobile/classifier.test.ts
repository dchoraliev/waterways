import {
  classifyObservation,
  classifyFromString,
  classifyObservationList,
  prepareCategoryKeywordMapping,
} from 'apps/mobile/src/services/ObservationClassifier';

// ------------------------------------------------------
// Mock the category loader used by ObservationClassifier
// ------------------------------------------------------
const mockedCategories = [
  {
    name: 'ENVIRONMENTAL',
    color: '#4A90E2',
    is_fallback: false,
    keywords: 'algae,erosion,water quality,foam,odor,trash',
  },
  {
    name: 'WILDLIFE',
    color: '#50E3C2',
    is_fallback: false,
    keywords: 'bird,bird call,fish,mammal,wetland',
  },
  {
    name: 'INFRASTRUCTURE',
    color: '#9013FE',
    is_fallback: false,
    keywords: 'bridge,power line,dam,pipe,inlet,shoreline',
  },
  {
    name: 'OTHERS',
    color: '#B8E986',
    is_fallback: true,
    keywords: '',
  },
];

// In case ObservationClassifier imports CategoryManager using an absolute path
jest.mock('apps/mobile/src/database/CategoryManager', () => ({
  getAllCategories: jest.fn(async () => mockedCategories),
}));

describe('Mobile Observation Classifier', () => {
  beforeAll(async () => {
    // Build the keyword→category mapping from the mocked categories
    await prepareCategoryKeywordMapping();
  });

  // ------------------------------------------------------
  // 1. Exact match
  // ------------------------------------------------------
  test("Exact match: 'saw algae near the shore'", () => {
    const result = classifyObservation('saw algae near the shore');
    expect(result.category).toBe('ENVIRONMENTAL');
    expect(result.keyword).toBe('algae');
    expect(result.exact).toBe(true);
  });

  // ------------------------------------------------------
  // 2. Unclassified / no match
  // ------------------------------------------------------
  test("Unclassified: 'I saw a unicorn in the sky'", () => {
    const result = classifyObservation('I saw a unicorn in the sky');
    expect(result.category).toBe('OTHERS');
    expect(result.keyword).toBeNull();
    expect(result.exact).toBe(false);
  });

  // ------------------------------------------------------
  // 3. Fuzzy match (misheard)
  // ------------------------------------------------------
  test("Fuzzy match: 'saw algie near the water'", () => {
    const result = classifyObservation('saw algie near the water');

    // Should map fuzzy 'algie' → 'algae'
    expect(result.category).toBe('ENVIRONMENTAL');
    expect(result.keyword).toBe('algae');
    expect(result.originalWord).toBe('algie');
    expect(result.exact).toBe(false);
  });

  // ------------------------------------------------------
  // 4. Multiple observations
  // ------------------------------------------------------
  test('Multiple observations', () => {
    const results = classifyObservationList([
      'saw algae',
      'heard a brd call',
      'random nonsense line',
    ]);

    expect(results.length).toBe(3);

    // Line 1 exact match
    expect(results[0].category).toBe('ENVIRONMENTAL');

    // Line 2 fuzzy match
    expect(results[1].category).toBe('WILDLIFE');
    expect(results[1].keyword).toBe('bird');
    expect(results[1].exact).toBe(false);

    // Line 3 unclassified
    expect(results[2].category).toBe('OTHERS');
  });

  // ------------------------------------------------------
  // 5. Multi-line string test
  // ------------------------------------------------------
  test('classifyFromString handles multi-line input', () => {
    const input = `
      saw algae by the shore
      heard a brd call
      meaningless text
    `;

    const results = classifyFromString(input);

    expect(results.length).toBe(3);

    // 1 exact
    expect(results[0].category).toBe('ENVIRONMENTAL');

    // 2 fuzzy
    expect(results[1].keyword).toBe('bird');

    // 3 unclassified
    expect(results[2].category).toBe('OTHERS');
  });

  // ------------------------------------------------------
  // 6. Edge case: empty input
  // ------------------------------------------------------
  test('Empty or whitespace-only string returns empty array', () => {
    const result = classifyFromString('   \n  ');
    expect(result).toEqual([]);
  });
});
