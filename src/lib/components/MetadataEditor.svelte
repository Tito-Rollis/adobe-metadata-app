<script>
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { selectedAsset, updateAsset, reorderKeywordsByTitle } from '$lib/stores/assetStore.js';
  import { MAX_TITLE_LENGTH, MAX_KEYWORDS, TOP_KEYWORDS_COUNT } from '$lib/constants.js';

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

  $: asset = $selectedAsset;

  /** Mark asset as edited */
  function markEdited(id) {
    updateAsset(id, { status: 'edited' });
  }

  function handleTitleInput(e) {
    const newTitle = e.target.value;
    updateAsset(asset.id, { title: newTitle, status: 'edited' });
    clearTimeout(titleReorderTimeout);
    if (newTitle.trim() && asset.keywords.length > 0) {
      titleReorderTimeout = setTimeout(() => {
        reorderKeywordsByTitle(asset.id, newTitle);
        showReorderNotice();
      }, 600);
    }
  }

  function showReorderNotice() {
    reorderNotice = true;
    setTimeout(() => reorderNotice = false, 2500);
  }

  function handleDndConsider(e) {
    updateAsset(asset.id, { keywords: e.detail.items });
  }

  function handleDndFinalize(e) {
    updateAsset(asset.id, { keywords: e.detail.items, status: 'edited' });
  }

  function addKeyword() {
    if (!newKeyword.trim()) return;
    const words = newKeyword.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
    const existing = asset.keywords.map(k => k.word);
    const toAdd = words.filter(w => !existing.includes(w)).slice(0, MAX_KEYWORDS - asset.keywords.length);
    if (toAdd.length === 0) { newKeyword = ''; return; }

    updateAsset(asset.id, {
      keywords: [...asset.keywords, ...toAdd.map(word => ({ id: crypto.randomUUID(), word }))],
      status: 'edited'
    });
    newKeyword = '';

    if (asset.title.trim()) {
      setTimeout(() => { reorderKeywordsByTitle(asset.id, asset.title); showReorderNotice(); }, 50);
    }
  }

  async function copyKeywords() {
    if (!asset || asset.keywords.length === 0) return;
    await navigator.clipboard.writeText(asset.keywords.map(k => k.word).join(', '));
    copyNotice = true;
    setTimeout(() => copyNotice = false, 2000);
  }

  function clearAllKeywords() {
    if (!asset || asset.keywords.length === 0) return;
    updateAsset(asset.id, { keywords: [], status: 'edited' });
  }

  function startEditKeyword(id, word) {
    editingKeywordId = id;
    editingKeywordValue = word;
  }

  function saveEditKeyword() {
    const newWord = editingKeywordValue.trim().toLowerCase();
    if (!newWord || !editingKeywordId) { editingKeywordId = null; return; }
    const isDuplicate = asset.keywords.some(k => k.id !== editingKeywordId && k.word === newWord);
    if (!isDuplicate) {
      updateAsset(asset.id, {
        keywords: asset.keywords.map(k => k.id === editingKeywordId ? { ...k, word: newWord } : k),
        status: 'edited'
      });
      if (asset.title.trim()) {
        setTimeout(() => { reorderKeywordsByTitle(asset.id, asset.title); showReorderNotice(); }, 50);
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
    updateAsset(asset.id, {
      keywords: asset.keywords.filter(k => k.id !== id),
      status: 'edited'
    });
  }

  function handleKeywordKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
  }

  $: titleLength = asset?.title?.length || 0;
  $: titleLengthColor = titleLength > MAX_TITLE_LENGTH ? 'text-danger' : titleLength > 55 ? 'text-warning' : 'text-text-subtle';
  $: keywordCount = asset?.keywords?.length || 0;
  $: keywordCountColor = keywordCount > MAX_KEYWORDS ? 'text-danger' : keywordCount >= 15 ? 'text-success' : 'text-warning';
</script>

<main class="flex-1 overflow-y-auto bg-bg-primary p-5">
  {#if !asset}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center h-full text-center gap-3">
      <div class="w-16 h-16 rounded-xl bg-bg-secondary border border-border flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-subtle">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <div>
        <p class="text-sm text-text-muted font-medium">No asset selected</p>
        <p class="text-xs text-text-subtle mt-1">Import a CSV and select an asset to edit</p>
      </div>
    </div>

  {:else}
    <div class="max-w-2xl mx-auto space-y-5">

      <!-- Asset info bar -->
      <div class="flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-lg border border-border">
        <div class="w-8 h-8 rounded bg-bg-panel border border-border flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-subtle">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-text-primary font-medium truncate">{asset.filename}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full {asset.status === 'edited' ? 'bg-success' : 'bg-warning'}"></span>
            <p class="text-xs text-text-muted">
              {asset.status === 'edited' ? 'Edited' : 'Not edited'}
              · {keywordCount} keywords
            </p>
          </div>
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
          value={asset.title}
          on:input={handleTitleInput}
          placeholder="Descriptive title for your asset..."
          maxlength="200"
          class="w-full"
        />
        {#if titleLength > MAX_TITLE_LENGTH}
          <p class="text-danger text-xs">Title exceeds 70 characters — consider shortening it.</p>
        {/if}
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
            <button on:click={copyKeywords} disabled={keywordCount === 0} class="btn-secondary text-xs px-2 py-1" title="Copy all keywords">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            </button>
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
        {#if asset.keywords.length > 0}
          <div
            use:dndzone={{ items: asset.keywords, flipDurationMs: 150 }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            class="flex flex-wrap gap-1.5 min-h-10 p-3 bg-bg-secondary rounded-lg border border-border"
            aria-label="Keywords, drag to reorder"
          >
            {#each asset.keywords as keyword, index (keyword.id)}
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
