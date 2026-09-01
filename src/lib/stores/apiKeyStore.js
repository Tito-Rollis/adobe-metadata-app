import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'gemini_api_key';

/**
 * Load API key from localStorage (client-side only)
 * @returns {string}
 */
function loadKey() {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

/** @type {import('svelte/store').Writable<string>} */
export const apiKey = writable(loadKey());

// Persist to localStorage on change
apiKey.subscribe(key => {
  if (typeof localStorage === 'undefined') return;
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
});

/** Whether a valid-looking API key is set */
export const hasApiKey = derived(apiKey, $key => $key.trim().length > 10);
