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
 * @property {File} file
 * @property {string} filename
 * @property {string} previewUrl
 * @property {boolean} isVideo
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
 * Add media files to the store
 * @param {File[]} files
 */
export function addMediaFiles(files) {
  const newAssets = files
    .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    .map(file => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      title: '',
      keywords: [],
      status: 'pending'
    }));

  if (newAssets.length === 0) return;

  assets.update(current => {
    // Skip duplicates by filename
    const existing = new Set(current.map(a => a.filename));
    const toAdd = newAssets.filter(a => !existing.has(a.filename));
    return [...current, ...toAdd];
  });

  selectedAssetId.update(current => {
    if (!current && newAssets.length > 0) return newAssets[0].id;
    return current;
  });
}

/**
 * Parse CSV and apply metadata to matching assets
 * @param {string} text
 * @param {CsvFormat} format
 * @returns {number} number of assets matched
 */
export function applyCSVMetadata(text, format) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return 0;

  const dataLines = lines.slice(1);
  let matched = 0;

  /** @type {Map<string, {title: string, keywords: string}>} */
  const csvMap = new Map();

  dataLines.forEach(line => {
    const cols = parseCSVLine(line);
    if (cols.length < 3) return;

    const filename = cols[0]?.trim();
    if (!filename) return;

    const title = cols[1]?.trim() || '';
    const keywordsRaw = cols[2]?.trim() || '';
    csvMap.set(filename, { title, keywordsRaw });
  });

  assets.update(current =>
    current.map(asset => {
      const data = csvMap.get(asset.filename);
      if (!data) return asset;

      matched++;
      const keywords = data.keywordsRaw
        .split(',')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0)
        .slice(0, MAX_KEYWORDS)
        .map(word => ({ id: crypto.randomUUID(), word }));

      return { ...asset, title: data.title, keywords, status: 'edited' };
    })
  );

  return matched;
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
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
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
 * Remove an asset
 * @param {string} id
 */
export function removeAsset(id) {
  assets.update(current => {
    const found = current.find(a => a.id === id);
    if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
    return current.filter(a => a.id !== id);
  });
  selectedAssetId.update(current => {
    if (current !== id) return current;
    let remaining;
    assets.subscribe(a => remaining = a)();
    return remaining.length > 0 ? remaining[0].id : null;
  });
}

/**
 * Reorder top 10 keywords by relevance to title
 * @param {string} assetId
 * @param {string} newTitle
 */
export function reorderKeywordsByTitle(assetId, newTitle) {
  assets.update(current =>
    current.map(a => {
      if (a.id !== assetId || a.keywords.length === 0) return a;

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
          const lowestIdx = top10.reduce((mi, k, idx, arr) => k.score < arr[mi].score ? idx : mi, 0);
          const displaced = top10[lowestIdx];
          top10[lowestIdx] = kw;
          rest[i] = displaced;
          top10.sort((a, b) => b.score - a.score);
        }
      });

      return { ...a, keywords: [...top10, ...rest].map(({ score, ...kw }) => kw) };
    })
  );
}

/**
 * Reset all
 */
export function resetAll() {
  get(assets).forEach(a => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
  assets.set([]);
  selectedAssetId.set(null);
}
