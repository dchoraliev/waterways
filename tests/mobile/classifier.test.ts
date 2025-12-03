import {
  classifyObservation,
  classifyFromString,
  classifyObservationList,
} from 'apps/mobile/src/services/ObservationClassifier';

describe('Mobile Observation Classifier', () => {
  // ------------------------------------------------------
  // 1. Exact match
  // ------------------------------------------------------
  test("Exact match: 'saw algae near the shore'", () => {
    const result = classifyObservation('saw algae near the shore');
    expect(result.category).toBe('Environmental');
    expect(result.keyword).toBe('algae');
    expect(result.exact).toBe(true);
  });

  // ------------------------------------------------------
  // 2. Unclassified / no match
  // ------------------------------------------------------
  test("Unclassified: 'I saw a unicorn in the sky'", () => {
    const result = classifyObservation('I saw a unicorn in the sky');
    expect(result.category).toBe('Unclassified');
    expect(result.keyword).toBeNull();
    expect(result.exact).toBe(false);
  });

  // ------------------------------------------------------
  // 3. Fuzzy match (misheard)
  // ------------------------------------------------------
  test("Fuzzy match: 'saw algie near the water'", () => {
    const result = classifyObservation('saw algie near the water');

    // Should map fuzzy 'algie' → 'algae'
    expect(result.category).toBe('Environmental');
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
    expect(results[0].category).toBe('Environmental');

    // Line 2 fuzzy match
    expect(results[1].category).toBe('Wildlife');
    expect(results[1].keyword).toBe('bird');
    expect(results[1].exact).toBe(false);

    // Line 3 unclassified
    expect(results[2].category).toBe('Unclassified');
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
    expect(results[0].category).toBe('Environmental');

    // 2 fuzzy
    expect(results[1].keyword).toBe('bird');

    // 3 unclassified
    expect(results[2].category).toBe('Unclassified');
  });

  // ------------------------------------------------------
  // 6. Edge case: empty input
  // ------------------------------------------------------
  test('Empty or whitespace-only string returns empty array', () => {
    const result = classifyFromString('   \n  ');
    expect(result).toEqual([]);
  });
});
