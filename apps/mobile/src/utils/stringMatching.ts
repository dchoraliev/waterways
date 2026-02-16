/**
 * String matching utilities for wake word detection
 *
 * Provides fuzzy matching capabilities to improve wake word detection accuracy
 * by accounting for speech recognition errors, accents, and variations.
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used to measure similarity when speech recognition makes minor errors
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Number of single-character edits required to transform str1 into str2
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1.0 = identical, 0.0 = completely different
 */
export function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const distance = levenshteinDistance(str1, str2);

  if (longer.length === 0) {
    return 1.0;
  }

  return (longer.length - distance) / longer.length;
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove punctuation
 * - Trim
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if text contains wake word with fuzzy matching
 *
 * @param text Recognized speech text
 * @param wakeWord Target wake word
 * @param threshold Similarity threshold (0-1), default 0.85
 * @returns Object with match status and confidence
 */
export interface WakeWordMatch {
  isMatch: boolean;
  confidence: number;
  matchedText?: string;
  position?: number;
  pattern?: string;
  stage?: 'prefix' | 'full' | 'variation';
  source?: 'primary' | 'variation' | 'profile';
  segments?: {
    prefix?: WakeWordSegmentMatch;
    suffix?: WakeWordSegmentMatch;
  };
}

export interface WakeWordSegmentMatch {
  confidence: number;
  matchedText?: string;
  position?: number;
  pattern?: string;
}

interface WakePhraseSegmentProfile {
  canonical: string;
  variations?: string[];
  threshold?: number;
}

export interface WakePhraseProfile {
  full: WakePhraseSegmentProfile;
  prefix?: WakePhraseSegmentProfile;
  suffix?: WakePhraseSegmentProfile;
}

export const WAKE_PHRASE_PROFILES: Record<string, WakePhraseProfile> = {
  'hey wade start recording': {
    full: {
      canonical: 'hey wade start recording',
      threshold: 0.9,
      variations: [
        'hey wade start recording',
        'hey wait start recording',
        'hey weight start recording',
        'hey wade start the recording',
        'hey wade start recording now',
        'hey way start recording',
        'hey wade start recording please',
        'hey wade start recording audio',
        'hey wade start recoding',
      ],
    },
    prefix: {
      canonical: 'hey wade',
      threshold: 0.82,
      variations: ['hey wade', 'hey wait', 'hey weight', 'hey way', 'hey wadee', 'hay wade'],
    },
    suffix: {
      canonical: 'start recording',
      threshold: 0.84,
      variations: [
        'start recording',
        'start the recording',
        'start recording now',
        'start recording please',
        'start recording audio',
        'start recording voice',
        'begin recording',
        'start recoding',
      ],
    },
  },
};

export function detectWakeWord(
  text: string,
  wakeWord: string,
  threshold: number = 0.85
): WakeWordMatch {
  const normalizedText = normalizeText(text);
  const normalizedWakeWord = normalizeText(wakeWord);

  // Exact match (highest confidence)
  if (normalizedText.includes(normalizedWakeWord)) {
    const position = normalizedText.indexOf(normalizedWakeWord);
    return {
      isMatch: true,
      confidence: 1.0,
      matchedText: normalizedWakeWord,
      position,
      pattern: normalizedWakeWord,
    };
  }

  // Fuzzy match - check all word windows
  const words = normalizedText.split(' ');
  const wakeWordLength = normalizedWakeWord.split(' ').length;

  let bestMatch: WakeWordMatch = {
    isMatch: false,
    confidence: 0,
    pattern: normalizedWakeWord,
  };

  // Sliding window to check all possible phrase positions
  for (let i = 0; i <= words.length - wakeWordLength; i++) {
    const window = words.slice(i, i + wakeWordLength).join(' ');
    const similarity = similarityScore(window, normalizedWakeWord);

    if (similarity > bestMatch.confidence) {
      bestMatch = {
        isMatch: similarity >= threshold,
        confidence: similarity,
        matchedText: window,
        position: i,
        pattern: normalizedWakeWord,
      };
    }
  }

  // Also check individual words for single-word wake words
  if (wakeWordLength === 1) {
    words.forEach((word, index) => {
      const similarity = similarityScore(word, normalizedWakeWord);
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          isMatch: similarity >= threshold,
          confidence: similarity,
          matchedText: word,
          position: index,
          pattern: normalizedWakeWord,
        };
      }
    });
  }

  return bestMatch;
}

/**
 * Common wake word variations and phonetic similarities
 * Useful for detecting common misrecognitions
 */
export const WAKE_WORD_VARIATIONS: Record<string, string[]> = {
  'hey wade': ['hey wait', 'hey wade', 'a wade', 'hey way', 'hey waid', 'hey weighed'],
  'hey wade start recording': [
    'hey wait start recording',
    'hey weight start recording',
    'hey wade start the recording',
    'hey wade start recording now',
    'hey way start recording',
    'hey wade start recoding',
    'hey wade start recording please',
    'hey wade start recording audio',
  ],
};

function detectWakeWordWithProfile(
  text: string,
  normalizedWakeWord: string,
  profile: WakePhraseProfile,
  fallbackThreshold: number
): WakeWordMatch {
  const fullCandidates = buildCandidateList(profile.full, normalizedWakeWord);
  const prefixCandidates = buildCandidateList(profile.prefix);
  const suffixCandidates = buildCandidateList(profile.suffix);

  const fullMatch = evaluateCandidates(
    text,
    fullCandidates,
    profile.full.threshold ?? fallbackThreshold
  );
  const prefixMatch = prefixCandidates.length
    ? evaluateCandidates(text, prefixCandidates, profile.prefix?.threshold ?? fallbackThreshold)
    : undefined;
  const suffixMatch = suffixCandidates.length
    ? evaluateCandidates(text, suffixCandidates, profile.suffix?.threshold ?? fallbackThreshold)
    : undefined;

  const segments = buildSegments(prefixMatch, suffixMatch);

  if (fullMatch.isMatch) {
    return {
      ...fullMatch,
      stage: 'full',
      source: 'profile',
      segments,
    };
  }

  if (
    prefixMatch &&
    profile.prefix &&
    prefixMatch.confidence >= (profile.prefix.threshold ?? fallbackThreshold)
  ) {
    return {
      ...prefixMatch,
      stage: 'prefix',
      source: 'profile',
      segments,
    };
  }

  const fallbackMatch = [fullMatch, prefixMatch, suffixMatch].reduce<WakeWordMatch>(
    (best, candidate) => {
      if (!candidate || candidate.confidence <= best.confidence) {
        return best;
      }
      return candidate;
    },
    { isMatch: false, confidence: 0, pattern: normalizedWakeWord }
  );

  return {
    ...fallbackMatch,
    source: 'profile',
    segments,
  };
}

function buildCandidateList(
  segment?: WakePhraseSegmentProfile,
  fallbackCanonical?: string
): string[] {
  if (!segment) {
    return [];
  }

  const values = new Set<string>();
  const canonical = segment.canonical || fallbackCanonical;
  if (canonical) {
    values.add(normalizeText(canonical));
  }

  (segment.variations || []).forEach((variation) => {
    const normalized = normalizeText(variation);
    if (normalized) {
      values.add(normalized);
    }
  });

  return Array.from(values);
}

function evaluateCandidates(text: string, candidates: string[], threshold: number): WakeWordMatch {
  let bestMatch: WakeWordMatch = {
    isMatch: false,
    confidence: 0,
    pattern: candidates[0] ?? '',
  };

  for (const candidate of candidates) {
    const match = detectWakeWord(text, candidate, threshold);

    if (match.confidence > bestMatch.confidence) {
      bestMatch = {
        ...match,
        pattern: candidate,
      };
    }
  }

  return bestMatch;
}

function buildSegments(
  prefixMatch?: WakeWordMatch,
  suffixMatch?: WakeWordMatch
): WakeWordMatch['segments'] | undefined {
  const segments: WakeWordMatch['segments'] = {};

  const prefixSegment = toSegmentMatch(prefixMatch);
  const suffixSegment = toSegmentMatch(suffixMatch);

  if (prefixSegment) {
    segments.prefix = prefixSegment;
  }
  if (suffixSegment) {
    segments.suffix = suffixSegment;
  }

  if (!segments.prefix && !segments.suffix) {
    return undefined;
  }

  return segments;
}

function toSegmentMatch(match?: WakeWordMatch): WakeWordSegmentMatch | undefined {
  if (!match || match.confidence <= 0) {
    return undefined;
  }

  return {
    confidence: match.confidence,
    matchedText: match.matchedText,
    position: match.position,
    pattern: match.pattern,
  };
}

/**
 * Check if text matches any known variation of the wake word
 */
export function detectWakeWordWithVariations(
  text: string,
  wakeWord: string,
  threshold: number = 0.85
): WakeWordMatch {
  const normalizedWakeWord = normalizeText(wakeWord);
  const profile = WAKE_PHRASE_PROFILES[normalizedWakeWord];

  if (profile) {
    return detectWakeWordWithProfile(text, normalizedWakeWord, profile, threshold);
  }

  const primaryMatch = detectWakeWord(text, wakeWord, threshold);
  if (primaryMatch.isMatch) {
    return { ...primaryMatch, source: 'primary' };
  }

  const variations = WAKE_WORD_VARIATIONS[normalizedWakeWord] || [];
  let bestVariation: WakeWordMatch | null = null;

  for (const variation of variations) {
    const variationMatch = detectWakeWord(text, variation, threshold);

    if (!bestVariation || variationMatch.confidence > bestVariation.confidence) {
      bestVariation = variationMatch;
    }

    if (variationMatch.isMatch) {
      return {
        ...variationMatch,
        confidence: variationMatch.confidence * 0.95,
        stage: 'variation',
        source: 'variation',
      };
    }
  }

  if (bestVariation) {
    return {
      ...bestVariation,
      confidence: bestVariation.confidence * 0.95,
      source: 'variation',
    };
  }

  return { ...primaryMatch, source: 'primary' };
}
