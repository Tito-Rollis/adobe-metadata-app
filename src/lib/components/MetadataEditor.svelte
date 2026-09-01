<script>
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { selectedPhoto, updatePhoto, reorderKeywordsByTitle, generateMetadataForPhoto } from '$lib/stores/photoStore.js';
  import { ADOBE_STOCK_CATEGORIES, MAX_TITLE_LENGTH, MAX_KEYWORDS, TOP_KEYWORDS_COUNT } from '$lib/constants.js';

  /** Svelte action: focus element on mount */
  function focus(node) {
    node.focus();
    if (node.select) node.select();
  }

  let newKeyword = '';
  let titleReorderTimeout = null;
  let reorderNotice = false;
  let copyNotice = false;
  /** @type {string|null} */
  let editingKeywordId = null;
  let editingKeywordValue = '';

  $: photo = $selectedPhoto;

  async function generateMetadata() {
    if (!photo) return;
    await generateMetadataForPhoto(photo.id);
  }

  function handleTitleInput(e) {
    const newTitle = e.target.value;
    updatePhoto(photo.id, { title: newTitle });
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

  function handleDndConsider(e) { updatePhoto(photo.id, { keywords: e.detail.items }); }
  function handleDndFinalize(e) { updatePhoto(photo.id, { keywords: e.detail.items }); }

  function addKeyword() {
    if (!newKeyword.trim()) return;
    const words = newKeyword.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
    const existing = photo.keywords.map(k => k.word);
    const toAdd = words.filter(w => !existing.includes(w)).slice(0, MAX_KEYWORDS - photo.keywords.length);
    if (toAdd.length === 0) { newKeyword = ''; return; }
    updatePhoto(photo.id, {
      keywords: [...photo.keywords, ...toAdd.map(word => ({ id: crypto.randomUUID(), word }))]
    });
    newKeyword = '';
    if (photo.title.trim()) {
      setTimeout(() => { reorderKeywordsByTitle(photo.id, photo.title); showReorderNotice(); }, 50);
    }
  }

  async function copyKeywords() {
    if (!photo || photo.keywords.length === 0) return;
    await navigator.clipboard.writeText(photo.keywords.map(k => k.word).join(', '));
    copyNotice = true;
    setTimeout(() => copyNotice = false, 2000);
  }

  function clearAllKeywords() {
    if (!photo || photo.keywords.length === 0) return;
    updatePhoto(photo.id, { keywords: [] });
  }

  function startEditKeyword(id, word) {
    editingKeywordId = id;
    editingKeywordValue = word;
  }

  function saveEditKeyword() {
    const newWord = editingKeywordValue.trim().toLowerCase();
    if (!newWord || !editingKeywordId) { editingKeywordId = null; return; }
    const isDuplicate = photo.keywords.some(k => k.id !== editingKeywordId && k.word === newWord);
    if (!isDuplicate) {
      updatePhoto(photo.id, {
        keywords: photo.keywords.map(k => k.id === editingKeywordId ? { ...k, word: newWord } : k)
      });
      if (photo.title.trim()) {
        setTimeout(() => { reorderKeywordsByTitle(photo.id, photo.title); showReorderNotice(); }, 50);
      }
    }
    editingKeywordId = null;
    editingKeywordValue = '';
  }

  function handleEditKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveEditKeyword(); }
    else if (e.key === 'Escape') { editingKeywordId = null; editingKeywordValue = ''; }
  }

  function removeKeyword(id) {
    updatePhoto(photo.id, { keywords: photo.keywords.filter(k => k.id !== id) });
  }

  function handleKeywordKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
  }

  function handleCategoryChange(e) {
    updatePhoto(photo.id, { category: e.target.value });
  }

  $: titleLength = photo?.title?.length || 0;
  $: titleLengthColor = titleLength > MAX_TITLE_LENGTH ? 'text-danger' : titleLength > 55 ? 'text-warning' : 'text-text-subtle';
  $: keywordCount = photo?.keywords?.length || 0;
  $: keywordCountColor = keywordCount > MAX_KEYWORDS ? 'text-danger' : keywordCount >= 15 ? 'text-success' : 'text-warning';
</script>

<main class="flex-1 overflow-y-auto bg-bg-primary p-5">
  {#if !photo}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center h-full text-center gap-3">
      <div class="w-16 h-16 rounded-xl bg-bg-secondary border border-border flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-subtle">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
      <div>
        <p class="text-sm text-text-muted font-medium">No photo selected</p>
        <p class="text-xs text-text-subtle mt-1">Upload photos and select one to edit metadata</p>
      </div>
    </div>

  {:else}
    <div class="max-w-2xl mx-auto space-y-5">

      <!-- Preview + Generate -->
      <div class="flex gap-4 items-start p-4 bg-bg-secondary rounded-lg border border-border">
        <div class="w-40 h-28 rounded-md overflow-hidden shrink-0 bg-bg-panel border border-border">
          <img src={photo.previewUrl} alt={photo.file.name} class="w-full h-full object-cover"/>
        </div>
        <div class="flex-1 flex flex-col justify-between h-28 min-w-0">
          <div>
            <p class="text-sm text-text-primary font-medium truncate">{photo.file.name}</p>
            <p class="text-xs text-text-muted mt-0.5">
              {(photo.file.size / 1024 / 1024).toFixed(1)} MB · {photo.file.type.split('/')[1]?.toUpperCase()}
            </p>
            {#if photo.status === 'error'}
              <p class="text-danger text-xs mt-2 bg-danger-muted px-2 py-1.5 rounded-md border border-danger/20">
                ⚠ {photo.errorMessage}
              </p>
            {/if}
          </div>
          <button
            on:click={generateMetadata}
            disabled={photo.status === 'generating'}
            class="btn-primary w-full justify-center"
          >
            {#if photo.status === 'generating'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <path d="M21 12a9 9 0 00-9-9"/>
              </svg>
              Generating...
            {:else if photo.status === 'done'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Regenerate
            {:else}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Generate Metadata
            {/if}
          </button>
        </div>
      </div>

      <!-- Title -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-text-muted uppercase tracking-wider" for="title-input">Title</label>
          <span class="text-xs {titleLengthColor}">{titleLength}/{MAX_TITLE_LENGTH}</span>
        </div>
        <input
          id="title-input"
          type="text"
          value={photo.title}
          on:input={handleTitleInput}
          placeholder="Descriptive title for your photo..."
          maxlength="200"
          class="w-full"
        />
        {#if titleLength > MAX_TITLE_LENGTH}
          <p class="text-danger text-xs">Title exceeds 70 characters — consider shortening it.</p>
        {/if}
      </div>

      <!-- Category -->
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-text-muted uppercase tracking-wider" for="category-select">Category</label>
        <select id="category-select" value={photo.category} on:change={handleCategoryChange} class="w-full cursor-pointer">
          <option value="" disabled>Select a category...</option>
          {#each ADOBE_STOCK_CATEGORIES as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>

      <!-- Keywords -->
      <div class="space-y-2">
        <!-- Header row -->
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-text-muted uppercase tracking-wider" for="keyword-input">
            Keywords
            <span class="text-text-subtle normal-case font-normal ml-1">(drag · double-click to edit)</span>
          </label>
          <div class="flex items-center gap-1.5">
            {#if reorderNotice}
              <span class="text-xs text-accent">↕ reordered</span>
            {/if}
            {#if copyNotice}
              <span class="text-xs text-success">✓ copied</span>
            {/if}
            <!-- Copy -->
            <button on:click={copyKeywords} disabled={keywordCount === 0} class="btn-secondary text-xs px-2 py-1" title="Copy all keywords">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            </button>
            <!-- Clear -->
            <button on:click={clearAllKeywords} disabled={keywordCount === 0} class="btn-danger text-xs px-2 py-1" title="Clear all keywords">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Clear
            </button>
            <span class="text-xs {keywordCountColor} tabular-nums">{keywordCount}/{MAX_KEYWORDS}</span>
          </div>
        </div>

        <!-- Top 10 hint -->
        {#if keywordCount > 0}
          <p class="text-xs text-text-subtle">
            <span class="text-accent">First {Math.min(keywordCount, TOP_KEYWORDS_COUNT)}</span> keywords have the highest search impact
          </p>
        {/if}

        <!-- Drag & drop zone -->
        {#if photo.keywords.length > 0}
          <div
            use:dndzone={{ items: photo.keywords, flipDurationMs: 150 }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            class="flex flex-wrap gap-1.5 min-h-10 p-3 bg-bg-secondary rounded-lg border border-border"
            aria-label="Keywords, drag to reorder"
          >
            {#each photo.keywords as keyword, index (keyword.id)}
              <div
                animate:flip={{ duration: 150 }}
                class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs select-none transition-all
                       {editingKeywordId === keyword.id
                         ? 'bg-bg-panel border border-accent cursor-text'
                         : index < TOP_KEYWORDS_COUNT
                         ? 'badge-top10 cursor-grab active:cursor-grabbing'
                         : 'badge-normal cursor-grab active:cursor-grabbing'}"
                on:dblclick={() => startEditKeyword(keyword.id, keyword.word)}
                role="button"
                tabindex="0"
                on:keydown={e => e.key === 'Enter' && startEditKeyword(keyword.id, keyword.word)}
                title="Double-click to edit"
              >
                {#if index < TOP_KEYWORDS_COUNT && editingKeywordId !== keyword.id}
                  <span class="text-accent font-bold tabular-nums w-3.5 text-center text-xs">{index + 1}</span>
                {/if}

                {#if editingKeywordId === keyword.id}
                  <input
                    type="text"
                    bind:value={editingKeywordValue}
                    on:keydown={handleEditKeydown}
                    on:blur={saveEditKeyword}
                    class="bg-transparent text-text-primary text-xs outline-none border-none w-20 min-w-0 p-0 focus:ring-0"
                    use:focus
                    aria-label="Edit keyword"
                  />
                {:else}
                  <span>{keyword.word}</span>
                  <button
                    on:click={() => removeKeyword(keyword.id)}
                    class="text-text-subtle hover:text-danger transition-colors shrink-0 ml-0.5"
                    aria-label="Remove {keyword.word}"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                {/if}
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
            placeholder="Add keyword... (separate multiple with commas)"
            disabled={keywordCount >= MAX_KEYWORDS}
            class="flex-1"
          />
          <button
            on:click={addKeyword}
            disabled={!newKeyword.trim() || keywordCount >= MAX_KEYWORDS}
            class="btn-secondary text-xs"
          >
            Add
          </button>
        </div>

        <!-- Keyword count hint -->
        {#if keywordCount < 15}
          <p class="text-warning text-xs">⚠ Recommend at least 15 keywords (you have {keywordCount})</p>
        {:else if keywordCount <= 35}
          <p class="text-success text-xs">✓ Good keyword count ({keywordCount})</p>
        {:else}
          <p class="text-text-subtle text-xs">{keywordCount} keywords — within limit, 15–35 is optimal</p>
        {/if}
      </div>

    </div>
  {/if}
</main>
