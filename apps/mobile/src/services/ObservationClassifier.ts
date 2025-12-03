// ==============================================
// Category Definitions
// ==============================================
const CATEGORIES: Record<string, string[]> = {
  Infrastructure: [
    'bridge',
    'power line',
    'boat launch',
    'dam',
    'water withdrawal',
    'pipe',
    'inlet',
    'shoreline',
    'old infrastructure',
  ],
  Environmental: [
    'erosion',
    'algae',
    'aquatic invasive',
    'terrestrial invasive',
    'water quality',
    'foam',
    'bottom',
    'odor',
    'trash',
    'junk',
  ],
  Wildlife: ['bird', 'bird call', 'sound', 'fish', 'mammal', 'wetland'],
  Hazards: ['obstruction'],
  General: ['time', 'comment'],
};

// Flatten keywords → category lookup map
const KEYWORD_TO_CATEGORY: Record<string, string> = Object.entries(CATEGORIES)
  .map(([cat, kws]) => kws.map((kw) => [kw, cat]))
  .flat()
  .reduce(
    (acc, [kw, cat]) => {
      acc[kw as string] = cat as string;
      return acc;
    },
    {} as Record<string, string>
  );

// ==============================================
// String Similarity Helpers
// ==============================================
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// ==============================================
// Types
// ==============================================
export interface ClassificationResult {
  observation: string;
  category: string;
  keyword: string | null;
  originalWord: string | null;
  exact: boolean;
}

// ==============================================
// Core Classification Logic
// ==============================================
export function classifyObservation(obsText: string) {
  const obsLower = obsText.toLowerCase();

  // Exact keyword match
  for (const [keyword, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (obsLower.includes(keyword)) {
      return { category, keyword, originalWord: null, exact: true };
    }
  }

  // Fuzzy matching by comparing per-word
  const words = obsLower.replace(/[.,]/g, '').split(/\s+/);

  let bestMatch: string | null = null;
  let bestWord: string | null = null;
  let bestRatio = 0;

  for (const word of words) {
    for (const keyword of Object.keys(KEYWORD_TO_CATEGORY)) {
      const ratio = similarity(word, keyword);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestMatch = keyword;
        bestWord = word;
      }
    }
  }

  if (bestMatch && bestRatio > 0.6) {
    return {
      category: KEYWORD_TO_CATEGORY[bestMatch],
      keyword: bestMatch,
      originalWord: bestWord,
      exact: false,
    };
  }

  return {
    category: 'Unclassified',
    keyword: null,
    originalWord: null,
    exact: false,
  };
}

// ==============================================
// App-Friendly Helpers
// ==============================================

/**
 * classifyObservationList
 * Takes an array of observations and classifies each one.
 */
export function classifyObservationList(observations: string[]): ClassificationResult[] {
  return observations.map((obs) => ({
    observation: obs,
    ...classifyObservation(obs),
  }));
}

/**
 * classifyFromString
 * Takes a single string that may contain multiple lines (speech-to-text output)
 */
export function classifyFromString(input: string): ClassificationResult[] {
  const observations = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return classifyObservationList(observations);
}
