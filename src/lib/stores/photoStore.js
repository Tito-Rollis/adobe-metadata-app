import { writable, derived, get } from 'svelte/store';
import { ADOBE_STOCK_CATEGORIES, MAX_KEYWORDS } from '$lib/constants.js';

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

/**
 * Resize and compress image in browser before sending to API
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_DIM = 1600;
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Generate metadata for a single photo via Gemini API
 * @param {string} photoId
 * @returns {Promise<void>}
 */
export async function generateMetadataForPhoto(photoId) {
  const photo = get(photos).find(p => p.id === photoId);
  if (!photo || photo.status === 'generating') return;

  updatePhoto(photoId, { status: 'generating', errorMessage: null });

  try {
    const compressed = await compressImage(photo.file);
    const formData = new FormData();
    formData.append('image', compressed, 'image.jpg');

    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to generate');
    }

    const metadata = await response.json();

    const keywords = metadata.keywords.map(word => ({
      id: crypto.randomUUID(),
      word
    }));

    updatePhoto(photoId, {
      status: 'done',
      title: metadata.title,
      keywords,
      category: metadata.category
    });

  } catch (err) {
    console.error('Gemini API error:', err);
    updatePhoto(photoId, {
      status: 'error',
      errorMessage: err.message || 'Something went wrong'
    });
  }
}

/** @type {import('svelte/store').Writable<boolean>} */
export const isBulkGenerating = writable(false);

/**
 * Generate metadata for all pending/error photos sequentially
 * Sequential to avoid Gemini free tier rate limit (15 req/min)
 */
export async function generateAllMetadata() {
  const allPhotos = get(photos);
  const targets = allPhotos.filter(p => p.status === 'pending' || p.status === 'error');

  if (targets.length === 0) return;

  isBulkGenerating.set(true);

  for (const photo of targets) {
    await generateMetadataForPhoto(photo.id);
    // Small delay between requests to respect rate limit
    if (targets.indexOf(photo) < targets.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  isBulkGenerating.set(false);
}
