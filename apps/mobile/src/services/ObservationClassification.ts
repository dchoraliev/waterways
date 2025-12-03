import * as fs from "fs";

// Observation categories and their keywords
const CATEGORIES: Record<string, string[]> = {
  Infrastructure: [
    "bridge",
    "power line",
    "boat launch",
    "dam",
    "water withdrawal",
    "pipe",
    "inlet",
    "shoreline",
    "old infrastructure",
  ],
  Environmental: [
    "erosion",
    "algae",
    "aquatic invasive",
    "terrestrial invasive",
    "water quality",
    "foam",
    "bottom",
    "odor",
    "trash",
    "junk",
  ],
  Wildlife: ["bird", "bird call", "sound", "fish", "mammal", "wetland"],
  Hazards: ["obstruction"],
  General: ["time", "comment"],
};

// Flatten all keywords into a lookup dict
const KEYWORD_TO_CATEGORY: Record<string, string> = Object.entries(CATEGORIES)
  .map(([cat, kws]) => kws.map((kw) => [kw, cat]))
  .flat()
  .reduce((acc, [kw, cat]) => {
    acc[kw as string] = cat as string;
    return acc;
  }, {} as Record<string, string>);

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Compute normalized similarity ratio (0–1) from Levenshtein distance.
 */
function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

interface ClassificationResult {
  category: string;
  keyword: string | null;
  originalWord: string | null;
  exact: boolean;
}

function classifyObservation(obsText: string): ClassificationResult {
  const obsLower = obsText.toLowerCase();

  // Exact keyword match
  for (const [keyword, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (obsLower.includes(keyword)) {
      return { category, keyword, originalWord: null, exact: true };
    }
  }

  // Fuzzy match (word-level)
  const words = obsLower.replace(/[.,]/g, "").split(/\s+/);
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
    const category = KEYWORD_TO_CATEGORY[bestMatch];
    return { category, keyword: bestMatch, originalWord: bestWord, exact: false };
  }

  return { category: "Unclassified", keyword: null, originalWord: null, exact: false };
}

function main(): void {
  const inputFile = "observations.txt";
  if (!fs.existsSync(inputFile)) {
    console.log(`Could not find ${inputFile}. Please create it in the same directory.`);
    return;
  }

  const data = fs.readFileSync(inputFile, "utf-8");
  const observations = data.split(/\r?\n/).filter((line) => line.trim() !== "");

  console.log("Classification Results:\n");

  for (const obs of observations) {
    const { category, keyword, originalWord, exact } = classifyObservation(obs);

    if (exact) {
      console.log(`Observation: ${obs}\n → Category: ${category} (keyword: '${keyword}')\n`);
    } else if (category !== "Unclassified") {
      console.log(
        `Observation: ${obs}\n → Possible misheard word '${originalWord}'. Did you mean '${keyword}'? → Category: ${category}\n`
      );
    } else {
      console.log(`Observation: ${obs}\n → Category: ${category}\n`);
    }
  }
}

// Run main if executed directly
if (require.main === module) {
  main();
}