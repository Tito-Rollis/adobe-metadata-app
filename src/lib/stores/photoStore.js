import { writable, derived, get } from 'svelte/store';
import { ADOBE_STOCK_CATEGORIES, MAX_KEYWORDS } from '$lib/constants.js';
import { apiKey } from '$lib/stores/apiKeyStore.js';

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
 * @property {boolean} isVideo
 * @property {number} [duration] - video duration in seconds
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
 * Add photos/videos to the store
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
    errorMessage: null,
    isVideo: file.type === 'video/mp4' || file.type.startsWith('video/'),
    duration: null
  }));

  photos.update(current => [...current, ...newPhotos]);

  // Auto-select first if none selected
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
      const MAX_DIM = 1024;  // Reduced from 1600 — smaller = faster API response
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
        0.75  // Reduced from 0.85 — smaller payload, faster response
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
 * Extract a frame from a video file at a given time
 * Also saves video duration back to store
 * @param {File} videoFile
 * @param {string} photoId
 * @param {number} [seekTime=1] - seconds into video to capture
 * @returns {Promise<Blob>}
 */
export function extractVideoFrame(videoFile, photoId, seekTime = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Save duration to store
      const duration = Math.round(video.duration);
      updatePhoto(photoId, { duration });

      // Seek to middle of video (50%) for best representative frame
      const target = video.duration / 2;
      video.currentTime = target;
    };

    video.onseeked = () => {
      const MAX_DIM = 1024;  // Reduced from 1600 — smaller = faster API response
      let width = video.videoWidth;
      let height = video.videoHeight;

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
      ctx.drawImage(video, 0, 0, width, height);

      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to extract video frame'));
        },
        'image/jpeg',
        0.85
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };

    video.src = url;
  });
}

/**
 * Generate metadata for a single photo via Gemini API
 * Retries once after 5s if Gemini returns a 500 error
 * @param {string} photoId
 * @returns {Promise<void>}
 */
export async function generateMetadataForPhoto(photoId) {
  const photo = get(photos).find(p => p.id === photoId);
  if (!photo || photo.status === 'generating') return;

  updatePhoto(photoId, { status: 'generating', errorMessage: null });

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Extract frame for video, compress for image
      const imageBlob = photo.isVideo
        ? await extractVideoFrame(photo.file, photoId)
        : await compressImage(photo.file);

      const formData = new FormData();
      formData.append('image', imageBlob, 'image.jpg');
      if (photo.isVideo) formData.append('isVideo', 'true');

      // Tell API how many keywords to generate — reserve slots for include keywords
      const included = get(includeKeywords);
      const aiKeywordCount = Math.max(15, MAX_KEYWORDS - included.length);
      formData.append('keywordCount', String(aiKeywordCount));

      // Send client API key if available
      const key = get(apiKey);
      if (key) formData.append('apiKey', key);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const metadata = await response.json();

      // Merge include keywords FIRST (they take priority), then AI keywords fill remaining slots
      const aiWords = metadata.keywords;
      const includedSet = new Set(included.map(w => w.toLowerCase()));

      const filteredAiWords = aiWords
        .filter(w => !includedSet.has(w.toLowerCase()))
        .slice(0, Math.max(0, MAX_KEYWORDS - included.length));

      const allWords = [...included, ...filteredAiWords];

      const keywords = allWords.map(word => ({
        id: crypto.randomUUID(),
        word
      }));

      updatePhoto(photoId, {
        status: 'done',
        title: metadata.title,
        keywords,
        category: metadata.category
      });

      return; // success

    } catch (err) {
      lastError = err;
      console.error(`Gemini API error (attempt ${attempt}/3):`, err);

      if (attempt < 3) {
        // Wait before retry: 5s on first fail, 10s on second fail
        await new Promise(r => setTimeout(r, attempt * 5000));
      }
    }
  }

  // All attempts failed
  updatePhoto(photoId, {
    status: 'error',
    errorMessage: lastError?.message || 'Something went wrong'
  });
}

/** @type {import('svelte/store').Writable<boolean>} */
export const isBulkGenerating = writable(false);

/**
 * Global include keywords — added to ALL photos after generate
 * @type {import('svelte/store').Writable<string[]>}
 */
export const includeKeywords = writable([]);

/**
 * Generate metadata for all pending/error photos sequentially
 * Sequential to avoid Gemini free tier rate limit (15 req/min)
 */
export async function generateAllMetadata() {
  const allPhotos = get(photos);
  const targets = allPhotos.filter(p => p.status === 'pending' || p.status === 'error');

  if (targets.length === 0) return;

  isBulkGenerating.set(true);

  for (let i = 0; i < targets.length; i++) {
    const photo = targets[i];

    // Skip if somehow already done
    const current = get(photos).find(p => p.id === photo.id);
    if (!current || current.status === 'done') continue;

    await generateMetadataForPhoto(photo.id);

    // Delay between requests to respect rate limit (4s = safe for 15 req/min)
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  isBulkGenerating.set(false);
}

/**
 * Reset everything — clear all photos and metadata (include keywords are preserved)
 */
export function resetAll() {
  // Revoke all object URLs to free memory
  get(photos).forEach(p => URL.revokeObjectURL(p.previewUrl));
  photos.set([]);
  selectedPhotoId.set(null);
  isBulkGenerating.set(false);
}
