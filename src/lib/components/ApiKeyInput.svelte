<script>
  import { apiKey, hasApiKey } from '$lib/stores/apiKeyStore.js';

  let inputValue = $apiKey;
  let showKey = false;
  let saved = false;

  function saveKey() {
    apiKey.set(inputValue.trim());
    saved = true;
    setTimeout(() => saved = false, 2000);
  }

  function clearKey() {
    apiKey.set('');
    inputValue = '';
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') saveKey();
  }
</script>

<div class="px-3 py-3 border-b border-border space-y-2">
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Gemini API Key</span>
    {#if $hasApiKey}
      <span class="flex items-center gap-1 text-xs text-success">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        Active
      </span>
    {:else}
      <span class="flex items-center gap-1 text-xs text-warning">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        Not set
      </span>
    {/if}
  </div>

  <div class="flex gap-1.5">
    <div class="relative flex-1 min-w-0">
      {#if showKey}
        <input
          type="text"
          bind:value={inputValue}
          on:keydown={handleKeydown}
          placeholder="Paste API key here..."
          class="w-full pr-8 font-mono text-xs"
          autocomplete="off"
          spellcheck="false"
        />
      {:else}
        <input
          type="password"
          bind:value={inputValue}
          on:keydown={handleKeydown}
          placeholder="Paste API key here..."
          class="w-full pr-8 font-mono text-xs"
          autocomplete="off"
          spellcheck="false"
        />
      {/if}
      <!-- Show/hide toggle -->
      <button
        on:click={() => showKey = !showKey}
        class="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-muted transition-colors"
        title={showKey ? 'Hide key' : 'Show key'}
      >
        {#if showKey}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        {/if}
      </button>
    </div>

    <!-- Save button -->
    <button
      on:click={saveKey}
      disabled={!inputValue.trim() || inputValue.trim() === $apiKey}
      class="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
    >
      {#if saved}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        Saved
      {:else}
        Save
      {/if}
    </button>
  </div>

  {#if $hasApiKey}
    <button
      on:click={clearKey}
      class="text-xs text-text-subtle hover:text-danger transition-colors"
    >
      Clear key
    </button>
  {:else}
    <p class="text-xs text-text-subtle">
      Get a free key at
      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent hover:underline"
      >aistudio.google.com</a>
    </p>
  {/if}
</div>
