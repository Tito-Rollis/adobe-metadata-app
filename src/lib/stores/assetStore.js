import { writable, derived, get } from 'svelte/store';
import { TOP_KEYWORDS_COUNT, MAX_KEYWORDS } from '$lib/constants.js';

/**
 * @typedef {'adobe' | 'shutterstock'} CsvFormat
 *
 * @typedef {Object} Keyword
 * @property {string} id
 * @property {string} word
 *
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} filename
 * @property {string} title
 * @property {Keyword[]} keywords
 * @property {'pending' | 'edited'} status
 */

/** @type {import('svelte/store').Writable<Asset[]>} */
export const assets = writable([]);

/** @type {import('svelte/store').Writable<string|null>} */
export const selectedAssetId = writable(null);

/** @type {import('svelte/store').Writable<CsvFormat>} */
export const csvFormat = writable('adobe');

export const selectedAsset = derived(
  [assets, selectedAssetId],
  ([$assets, $selectedAssetId]) => $assets.find(a => a.id === $selectedAssetId) || null
);

/**
 * Parse CSV text into Asset array based on format
 * @param {string} text
 * @param {CsvFormat} format
 * @returns {Asset[]}
 */
export function parseCSV(text, format) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines
    .map(line => {
      // Parse CSV line respecting quoted fields
      const cols = parseCSVLine(line);
      if (cols.length < 3) return null;

      const filename = cols[0]?.trim() || '';
      if (!filename) return null;

      // Adobe Stock: Filename, Title, Keywords, Category
      // Shutterstock: Filename, Description, Keywords, Categories, ...
      const title = cols[1]?.trim() || '';
      const keywordsRaw = cols[2]?.trim() || '';

      const keywords = keywordsRaw
        .split(',')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0)
        .slice(0, MAX_KEYWORDS)
        .map(word => ({ id: crypto.randomUUID(), word }));

      return {
        id: crypto.randomUUID(),
        filename,
        title,
        keywords,
        status: 'pending'
      };
    })
    .filter(Boolean);
}

/**
 * Parse a single CSV line respecting quoted fields
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Load parsed assets into store
 * @param {Asset[]} newAssets
 */
export function loadAssets(newAssets) {
  assets.set(newAssets);
  selectedAssetId.set(newAssets.length > 0 ? newAssets[0].id : null);
}

/**
 * Update an asset
 * @param {string} id
 * @param {Partial<Asset>} updates
 */
export function updateAsset(id, updates) {
  assets.update(current =>
    current.map(a => a.id === id ? { ...a, ...updates } : a)
  );
}

/**
 * Reorder top 10 keywords by relevance to title
 * @param {string} assetId
 * @param {string} newTitle
 */
export function reorderKeywordsByTitle(assetId, newTitle) {
  assets.update(current =>
    current.map(a => {
      if (a.id !== assetId) return a;
      if (a.keywords.length === 0) return a;

      const titleWords = newTitle.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1);

      const scored = a.keywords.map(kw => {
        const word = kw.word.toLowerCase();
        let score = 0;
        if (titleWords.includes(word)) score += 10;
        titleWords.forEach(tw => {
          if (tw.includes(word) || word.includes(tw)) score += 3;
        });
        return { ...kw, score };
      });

      const top10 = scored.slice(0, TOP_KEYWORDS_COUNT);
      const rest = scored.slice(TOP_KEYWORDS_COUNT);

      top10.sort((a, b) => b.score - a.score);

      const minTopScore = top10.length > 0 ? Math.min(...top10.map(k => k.score)) : 0;
      rest.forEach((kw, i) => {
        if (kw.score > minTopScore && top10.length > 0) {
          const lowestIdx = top10.reduce((minIdx, k, idx, arr) =>
            k.score < arr[minIdx].score ? idx : minIdx, 0);
          const displaced = top10[lowestIdx];
          top10[lowestIdx] = kw;
          rest[i] = displaced;
          top10.sort((a, b) => b.score - a.score);
        }
      });

      const reordered = [...top10, ...rest].map(({ score, ...kw }) => kw);
      return { ...a, keywords: reordered };
    })
  );
}

/**
 * Reset all assets
 */
export function resetAll() {
  assets.set([]);
  selectedAssetId.set(null);
}
