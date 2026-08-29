import { writable, derived } from 'svelte/store';

/**
 * @typedef {Object} Keyword
 * @property {string} id
 * @property {string} word
 */

/**
 * @typedef {Object} PhotoItem
 * @property {string} id
 * @property {File} file
 * @property {string} previewUrl
 * @property {'pending' | 'generating' | 'done' | 'error'} status
 * @property {string} title
 * @property {Keyword[]} keywords
 * @property {string} category
 * @property {string|null} errorMessage
 */

/** @type {import('svelte/store').Writable<PhotoItem[]>} */
export const photos = writable([]);

/** @type {import('svelte/store').Writable<string|null>} */
export const selectedPhotoId = writable(null);

export const selectedPhoto = derived(
  [photos, selectedPhotoId],
  ([$photos, $selectedPhotoId]) => $photos.find(p => p.id === $selectedPhotoId) || null
);

/**
 * Add photos to the store
 * @param {File[]} files
 */
export function addPhotos(files) {
  const newPhotos = files.map(file => ({
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'pending',
    title: '',
    keywords: [],
    category: '',
    errorMessage: null
  }));

  photos.update(current => [...current, ...newPhotos]);

  // Auto-select first photo if none selected
  selectedPhotoId.update(current => {
    if (!current && newPhotos.length > 0) return newPhotos[0].id;
    return current;
  });
}

/**
 * Update a photo's metadata
 * @param {string} id
 * @param {Partial<PhotoItem>} updates
 */
export function updatePhoto(id, updates) {
  photos.update(current =>
    current.map(p => p.id === id ? { ...p, ...updates } : p)
  );
}

/**
 * Remove a photo from the store
 * @param {string} id
 */
export function removePhoto(id) {
  photos.update(current => {
    const filtered = current.filter(p => p.id !== id);
    return filtered;
  });

  selectedPhotoId.update(current => {
    if (current === id) {
      // Select previous or next photo
      let remaining;
      photos.subscribe(p => remaining = p)();
      return remaining.length > 0 ? remaining[0].id : null;
    }
    return current;
  });
}

/**
 * Reorder top 10 keywords based on title relevance
 * Keywords are NOT added or removed, only reordered
 * @param {string} photoId
 * @param {string} newTitle
 */
export function reorderKeywordsByTitle(photoId, newTitle) {
  photos.update(current =>
    current.map(p => {
      if (p.id !== photoId) return p;

      const keywords = [...p.keywords];
      if (keywords.length === 0) return p;

      const titleWords = newTitle.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1);

      // Score each keyword by relevance to title
      const scored = keywords.map(kw => {
        const word = kw.word.toLowerCase();
        let score = 0;

        // Exact match with title word — highest score
        if (titleWords.includes(word)) score += 10;

        // Partial match (title word contains keyword or vice versa)
        titleWords.forEach(tw => {
          if (tw.includes(word) || word.includes(tw)) score += 3;
        });

        return { ...kw, score };
      });

      // Separate into top 10 and rest
      const top10 = scored.slice(0, 10);
      const rest = scored.slice(10);

      // Sort top 10 by score descending, stable sort for equal scores
      top10.sort((a, b) => b.score - a.score);

      // If any keyword in rest has higher score than lowest in top 10, swap it in
      const minTopScore = Math.min(...top10.map(k => k.score));
      rest.forEach((kw, i) => {
        if (kw.score > minTopScore) {
          // Find lowest scorer in top 10 to swap
          const lowestIdx = top10.reduce((minIdx, k, idx, arr) =>
            k.score < arr[minIdx].score ? idx : minIdx, 0);
          const displaced = top10[lowestIdx];
          top10[lowestIdx] = kw;
          rest[i] = displaced;
          top10.sort((a, b) => b.score - a.score);
        }
      });

      const reordered = [...top10, ...rest].map(({ score, ...kw }) => kw);

      return { ...p, keywords: reordered };
    })
  );
}
