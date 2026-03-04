// ==============================================
// Category Definitions
// Each category maps to an object with a `color` and `keywords` list

import { getAllCategories } from '../database/CategoryManager';

// ==============================================
const FAILSAFE_CATEGORIES: Record<
  string,
  { is_fallback: boolean; color: string; keywords: string[] }
> = {
  Infrastructure: {
    is_fallback: false,
    color: '#007AFF',
    keywords: [
      'bridge',
      'power line',
      'boat launch',
      'dam',
      'water withdrawal',
      'pipe',
      'inlet',
      'shoreline',
      'old infrastructure',
      'landmark',
      'wastewater/stormwater',
      'shoreline development',
    ],
  },
  Environmental: {
    is_fallback: false,
    color: '#34C759',
    keywords: [
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
      'vegetation',
      'habitat',
      'restoration',
      'invasives',
    ],
  },
  Wildlife: {
    is_fallback: false,
    color: '#FF9500',
    keywords: ['bird', 'bird call', 'sound', 'fish', 'mammal', 'wetland', 'animal'],
  },
  Hazards: { is_fallback: false, color: '#FF3B30', keywords: ['obstruction'] },
  General: { is_fallback: false, color: '#8E8E93', keywords: ['time', 'comment'] },
  Others: { is_fallback: true, color: '#5856D6', keywords: [] },
};

// In-memory category data (populated from local DB or falls back to FAILSAFE_CATEGORIES)
export let CATEGORIES: Record<string, { is_fallback: boolean; color: string; keywords: string[] }> =
  {};
// Keyword to category mapping for quick lookup during classification (populated from CATEGORIES)
export let KEYWORD_TO_CATEGORY: Record<string, string> = {};

// Call this during app initialization to load categories from the local DB.
export async function prepareCategoryKeywordMapping(): Promise<void> {
  // Retrieve categories from local database
  const categories = await getAllCategories();

  // Build the category data mapping
  const categoryMap: Record<string, { is_fallback: boolean; color: string; keywords: string[] }> =
    {};
  for (const category of categories) {
    categoryMap[category.name] = {
      is_fallback: category.is_fallback,
      color: category.color ? category.color : '#000000',
      keywords: category.keywords
        ? category.keywords
            .split(',')
            .map((k: string) => k.trim().toLowerCase())
            .filter((k: string) => k.length > 0)
        : [],
    };
  }
  CATEGORIES = categoryMap;

  // If no categories were loaded, fall back to the failsafe
  if (Object.keys(CATEGORIES).length === 0) {
    CATEGORIES = FAILSAFE_CATEGORIES;
  }

  // Rebuild keyword → category map from the (new) CATEGORIES
  KEYWORD_TO_CATEGORY = Object.entries(CATEGORIES)
    .flatMap(([cat, data]) => data.keywords.map((kw) => [kw, cat] as [string, string]))
    .reduce(
      (acc, [kw, cat]) => {
        acc[kw] = cat;
        return acc;
      },
      {} as Record<string, string>
    );
}

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

  // If a category is marked as the fallback (is_fallback === true), use it
  const fallbackKey = Object.entries(CATEGORIES).find(([_k, data]) => !!data?.is_fallback)?.[0];
  if (fallbackKey) {
    return {
      category: fallbackKey,
      keyword: null,
      originalWord: null,
      exact: false,
    };
  }

  return {
    category: 'OTHERS',
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
