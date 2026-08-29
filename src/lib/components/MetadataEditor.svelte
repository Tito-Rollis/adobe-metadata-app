<script>
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { selectedPhoto, updatePhoto, reorderKeywordsByTitle } from '$lib/stores/photoStore.js';
  import {
    ADOBE_STOCK_CATEGORIES,
    MAX_TITLE_LENGTH,
    MAX_KEYWORDS,
    TOP_KEYWORDS_COUNT
  } from '$lib/constants.js';

  let newKeyword = '';
  let titleReorderTimeout = null;
  let reorderNotice = false;

  // Local copies bound to the selected photo
  $: photo = $selectedPhoto;

  /** Generate metadata via Gemini API */
  async function generateMetadata() {
    if (!photo || photo.status === 'generating') return;

    updatePhoto(photo.id, { status: 'generating', errorMessage: null });

    try {
      const formData = new FormData();
      formData.append('image', photo.file);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to generate');
      }

      const metadata = await response.json();

      // Convert keywords to objects with IDs for dnd
      const keywords = metadata.keywords.map(word => ({
        id: crypto.randomUUID(),
        word
      }));

      updatePhoto(photo.id, {
        status: 'done',
        title: metadata.title,
        keywords,
        category: metadata.category
      });

    } catch (err) {
      console.error(err);
      updatePhoto(photo.id, {
        status: 'error',
        errorMessage: err.message || 'Something went wrong'
      });
    }
  }

  /** Handle title input change */
  function handleTitleInput(e) {
    const newTitle = e.target.value;
    updatePhoto(photo.id, { title: newTitle });

    // Debounce keyword reorder
    clearTimeout(titleReorderTimeout);
    if (newTitle.trim() && photo.keywords.length > 0) {
      titleReorderTimeout = setTimeout(() => {
        reorderKeywordsByTitle(photo.id, newTitle);
        showReorderNotice();
      }, 600);
    }
  }

  function showReorderNotice() {
    reorderNotice = true;
    setTimeout(() => reorderNotice = false, 2500);
  }

  /** Handle keyword drag & drop */
  function handleDndConsider(e) {
    updatePhoto(photo.id, { keywords: e.detail.items });
  }

  function handleDndFinalize(e) {
    updatePhoto(photo.id, { keywords: e.detail.items });
  }

  /** Add a new keyword */
  function addKeyword() {
    const word = newKeyword.trim().toLowerCase();
    if (!word) return;
    if (photo.keywords.length >= MAX_KEYWORDS) return;
    if (photo.keywords.some(k => k.word === word)) {
      newKeyword = '';
      return;
    }

    updatePhoto(photo.id, {
      keywords: [...photo.keywords, { id: crypto.randomUUID(), word }]
    });
    newKeyword = '';
  }

  /** Remove a keyword by id */
  function removeKeyword(id) {
    updatePhoto(photo.id, {
      keywords: photo.keywords.filter(k => k.id !== id)
    });
  }

  /** Handle Enter key on keyword input */
  function handleKeywordKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  }

  /** Handle category change */
  function handleCategoryChange(e) {
    updatePhoto(photo.id, { category: e.target.value });
  }

  $: titleLength = photo?.title?.length || 0;
  $: titleLengthClass = titleLength > MAX_TITLE_LENGTH
    ? 'text-red-400'
    : titleLength > 55
    ? 'text-yellow-400'
    : 'text-text-muted';
  $: keywordCount = photo?.keywords?.length || 0;
  $: keywordCountClass = keywordCount > MAX_KEYWORDS
    ? 'text-red-400'
    : keywordCount >= 15
    ? 'text-green-400'
    : 'text-yellow-400';
</script>

<main class="flex-1 overflow-y-auto bg-bg-primary p-6">
  {#if !photo}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center h-full text-center">
      <div class="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
      <h2 class="text-text-primary text-lg font-medium">No photo selected</h2>
      <p class="text-text-muted text-sm mt-2">Upload photos and select one to edit metadata</p>
    </div>
  {:else}
    <div class="max-w-3xl mx-auto space-y-6">

      <!-- Preview + Generate -->
      <div class="flex gap-5 items-start">
        <!-- Image Preview -->
        <div class="w-48 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-bg-secondary border border-border">
          <img
            src={photo.previewUrl}
            alt={photo.file.name}
            class="w-full h-full object-cover"
          />
        </div>

        <!-- File info + Generate button -->
        <div class="flex-1 flex flex-col justify-between h-36">
          <div>
            <h2 class="text-text-primary font-semibold text-base leading-tight break-all">
              {photo.file.name}
            </h2>
            <p class="text-text-muted text-sm mt-1">
              {(photo.file.size / 1024 / 1024).toFixed(1)} MB ·
              {photo.file.type.split('/')[1].toUpperCase()}
            </p>

            {#if photo.status === 'error'}
              <p class="text-red-400 text-xs mt-2 bg-red-400/10 px-3 py-1.5 rounded-lg">
                ⚠ {photo.errorMessage}
              </p>
            {/if}
          </div>

          <button
            on:click={generateMetadata}
            disabled={photo.status === 'generating'}
            class="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover
                   disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium
                   rounded-lg transition-colors w-full"
          >
            {#if photo.status === 'generating'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <path d="M21 12a9 9 0 00-9-9" />
              </svg>
              Generating...
            {:else if photo.status === 'done'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Regenerate
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Generate Metadata
            {/if}
          </button>
        </div>
      </div>

      <!-- Title Field -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-text-primary" for="title-input">Title</label>
          <span class="text-xs {titleLengthClass}">
            {titleLength}/{MAX_TITLE_LENGTH}
          </span>
        </div>
        <input
          id="title-input"
          type="text"
          value={photo.title}
          on:input={handleTitleInput}
          placeholder="Descriptive title for your photo..."
          maxlength="200"
          class="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5
                 text-text-primary placeholder-text-muted text-sm
                 focus:outline-none focus:border-accent transition-colors"
        />
        {#if titleLength > MAX_TITLE_LENGTH}
          <p class="text-red-400 text-xs">Title exceeds 70 characters. Consider shortening it.</p>
        {/if}
      </div>

      <!-- Category Field -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-text-primary" for="category-select">Category</label>
        <select
          id="category-select"
          value={photo.category}
          on:change={handleCategoryChange}
          class="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5
                 text-text-primary text-sm focus:outline-none focus:border-accent
                 transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled>Select a category...</option>
          {#each ADOBE_STOCK_CATEGORIES as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>

      <!-- Keywords Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-text-primary" for="keyword-input">
            Keywords
            <span class="text-xs font-normal text-text-muted ml-1">(drag to reorder)</span>
          </label>
          <div class="flex items-center gap-2">
            {#if reorderNotice}
              <span class="text-xs text-accent animate-pulse">↕ Keywords reordered</span>
            {/if}
            <span class="text-xs {keywordCountClass}">
              {keywordCount}/{MAX_KEYWORDS}
            </span>
          </div>
        </div>

        <!-- Top 10 indicator -->
        {#if keywordCount > 0}
          <p class="text-xs text-text-muted">
            <span class="text-accent font-medium">First {Math.min(keywordCount, TOP_KEYWORDS_COUNT)}</span>
            keywords have the highest search impact on Adobe Stock
          </p>
        {/if}

        <!-- Keywords drag-and-drop zone -->
        {#if photo.keywords.length > 0}
          <div
            use:dndzone={{ items: photo.keywords, flipDurationMs: 200 }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            class="flex flex-wrap gap-2 min-h-12 p-3 bg-bg-secondary rounded-xl border border-border"
            aria-label="Keywords list, drag to reorder"
          >
            {#each photo.keywords as keyword, index (keyword.id)}
              <div
                animate:flip={{ duration: 200 }}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-grab active:cursor-grabbing select-none transition-all
                       {index < TOP_KEYWORDS_COUNT
                         ? 'bg-accent/20 border border-accent/50 text-white'
                         : 'bg-bg-primary border border-border text-text-primary hover:border-text-muted'}"
              >
                <!-- Rank badge for top 10 -->
                {#if index < TOP_KEYWORDS_COUNT}
                  <span class="text-xs text-accent font-bold w-4 text-center">{index + 1}</span>
                {/if}
                <span>{keyword.word}</span>
                <button
                  on:click={() => removeKeyword(keyword.id)}
                  class="ml-0.5 text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
                  aria-label="Remove keyword {keyword.word}"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Add keyword input -->
        <div class="flex gap-2">
          <input
            id="keyword-input"
            type="text"
            bind:value={newKeyword}
            on:keydown={handleKeywordKeydown}
            placeholder="Add keyword..."
            disabled={keywordCount >= MAX_KEYWORDS}
            class="flex-1 bg-bg-secondary border border-border rounded-lg px-4 py-2
                   text-text-primary placeholder-text-muted text-sm
                   focus:outline-none focus:border-accent transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            on:click={addKeyword}
            disabled={!newKeyword.trim() || keywordCount >= MAX_KEYWORDS}
            class="px-4 py-2 bg-bg-secondary border border-border hover:border-accent
                   disabled:opacity-40 disabled:cursor-not-allowed text-text-primary
                   text-sm rounded-lg transition-colors"
          >
            Add
          </button>
        </div>

        <!-- Keyword count hint -->
        {#if keywordCount < 15}
          <p class="text-yellow-400 text-xs">
            ⚠ Adobe Stock recommends at least 15 keywords (you have {keywordCount})
          </p>
        {:else if keywordCount >= 15 && keywordCount <= 35}
          <p class="text-green-400 text-xs">
            ✓ Good keyword count ({keywordCount} keywords)
          </p>
        {:else if keywordCount > 35}
          <p class="text-text-muted text-xs">
            {keywordCount} keywords — within limit but 15–35 is optimal
          </p>
        {/if}
      </div>

    </div>
  {/if}
</main>
