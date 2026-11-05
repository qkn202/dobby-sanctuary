// Built-in client-side datasets for "Xin Quẻ":
// 1. "Hôm nay ăn gì" (FOOD_ORACLES - 100 unique sassy fortunes)
// 2. "Hôm nay đi đâu" (PLACE_ORACLES - 100 unique sassy fortunes)

import { FOOD_ORACLES_LOW } from './foodOraclesLow.js';
import { FOOD_ORACLES_MID } from './foodOraclesMid.js';
import { FOOD_ORACLES_HIGH } from './foodOraclesHigh.js';
import { PLACE_ORACLES_LOW } from './placeOraclesLow.js';
import { PLACE_ORACLES_MID } from './placeOraclesMid.js';
import { PLACE_ORACLES_HIGH } from './placeOraclesHigh.js';

export const BUDGET_OPTIONS = [
  { value: 'low', label: '🍃 Mỏng ví (<60k)', shortLabel: 'Dưới 60k' },
  { value: 'mid', label: '⚖️ Vừa túi (60–180k)', shortLabel: '60k–180k' },
  { value: 'high', label: '💎 Xả láng (200k+)', shortLabel: 'Trên 200k' },
];

export const COMPANY_OPTIONS = [
  { value: 'solo', label: '🧘 Đi 1 mình', shortLabel: 'Đi 1 mình' },
  { value: 'couple', label: '🕯️ Đi 2 người', shortLabel: 'Đi 2 người' },
  { value: 'group', label: '🍻 Tụ tập đông', shortLabel: 'Đi hội nhóm' },
];

export const FOOD_ORACLES = [
  ...FOOD_ORACLES_LOW,
  ...FOOD_ORACLES_MID,
  ...FOOD_ORACLES_HIGH,
];

export const PLACE_ORACLES = [
  ...PLACE_ORACLES_LOW,
  ...PLACE_ORACLES_MID,
  ...PLACE_ORACLES_HIGH,
];

// In-memory fallback history when sessionStorage is unavailable (e.g. Node serverless runtime)
const memoryHistoryByBucket = new Map();
const STORAGE_KEY = 'dobby_oracle_seen_v2';

function loadBucketHistory(bucketKey) {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return Array.isArray(parsed[bucketKey]) ? parsed[bucketKey] : [];
    } catch {
      // fall through to memory map
    }
  }
  return memoryHistoryByBucket.get(bucketKey) || [];
}

function saveBucketHistory(bucketKey, seenIds) {
  memoryHistoryByBucket.set(bucketKey, seenIds);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[bucketKey] = seenIds;
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // ignore quota / private mode errors
    }
  }
}

/**
 * Pick an oracle item matching (mode, budget, company) with deck-style non-repeating cycle:
 * - Excludes any explicit `excludeIdOrIds` (string or string[]) AND previously drawn items in the
 *   current `(mode, budget, company)` bucket until every matching fortune has been shown once.
 * - When the full matching deck has been exhausted, resets the cycle while still excluding the
 *   most recently drawn item so back-to-back draws never repeat.
 */
export function pickOracleItem(mode, budget, company, excludeIdOrIds = null, options = {}) {
  const normalizedMode = mode === 'place' ? 'place' : 'food';
  const pool = normalizedMode === 'place' ? PLACE_ORACLES : FOOD_ORACLES;

  let matches = pool.filter(
    (item) => item.budgets.includes(budget) && item.companies.includes(company),
  );
  if (matches.length === 0) {
    matches = pool.filter((item) => item.budgets.includes(budget));
  }
  if (matches.length === 0) {
    matches = pool;
  }

  const explicitExcludes = new Set();
  if (Array.isArray(excludeIdOrIds)) {
    for (const id of excludeIdOrIds) {
      if (id) explicitExcludes.add(String(id));
    }
  } else if (excludeIdOrIds) {
    explicitExcludes.add(String(excludeIdOrIds));
  }

  const bucketKey = `${options.scopeKey ? `${options.scopeKey}:` : ''}${normalizedMode}:${budget}:${company}`;
  const seenHistory = options.disableAutoHistory ? [] : loadBucketHistory(bucketKey);
  const lastSeenId =
    seenHistory.length > 0
      ? seenHistory[seenHistory.length - 1]
      : Array.from(explicitExcludes).pop() || null;

  const combinedExcludes = new Set([...seenHistory, ...explicitExcludes]);
  let candidates = matches.filter((item) => !combinedExcludes.has(item.id));

  let nextHistory = [...seenHistory];
  if (candidates.length === 0) {
    // Deck exhausted -> reshuffle full bucket, still avoiding immediate repeat of the last item
    candidates =
      matches.length > 1 && lastSeenId
        ? matches.filter((item) => item.id !== lastSeenId)
        : matches;
    nextHistory = [];
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  if (!options.disableAutoHistory && picked) {
    nextHistory.push(picked.id);
    saveBucketHistory(bucketKey, nextHistory);
  }

  return picked;
}
