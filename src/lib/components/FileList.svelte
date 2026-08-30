<script>
  import { photos, selectedPhotoId, addPhotos, removePhoto, includeKeywords } from '$lib/stores/photoStore.js';
  import { MAX_KEYWORDS } from '$lib/constants.js';

  let isDragOver = false;
  let fileInput;
  let includeInput = '';

  const STATUS_ICONS = {
    pending:    { icon: '○', class: 'text-text-muted' },
    generating: { icon: '⟳', class: 'text-yellow-400 animate-spin' },
    done:       { icon: '✓', class: 'text-green-400' },
    error:      { icon: '✗', class: 'text-red-400' }
  };

  /** @param {DragEvent} e */
  function handleDragOver(e) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  /** @param {DragEvent} e */
  function handleDrop(e) {
    e.preventDefault();
    isDragOver = false;
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) addPhotos(files);
  }

  /** @param {Event} e */
  function handleFileInput(e) {
    const files = Array.from(/** @type {HTMLInputElement} */ (e.target).files || []);
    if (files.length > 0) addPhotos(files);
    if (fileInput) fileInput.value = '';
  }

  /** @param {string} id */
  function selectPhoto(id) {
    selectedPhotoId.set(id);
  }

  /**
   * @param {Event} e
   * @param {string} id
   */
  function handleRemove(e, id) {
    e.stopPropagation();
    removePhoto(id);
  }

  /** @param {string} name */
  function truncateName(name) {
    return name.length > 22 ? name.slice(0, 19) + '...' : name;
  }

  /** Add include keywords from input (comma-separated) */
  function addIncludeKeywords() {
    if (!includeInput.trim()) return;

    const words = includeInput
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);

    includeKeywords.update(current => {
      const existing = new Set(current);
      const toAdd = words.filter(w => !existing.has(w));
      return [...current, ...toAdd];
    });

    includeInput = '';
  }

  /** Remove one include keyword */
  function removeIncludeKeyword(word) {
    includeKeywords.update(current => current.filter(w => w !== word));
  }

  /** Clear all include keywords */
  function clearIncludeKeywords() {
    includeKeywords.set([]);
  }

  function handleIncludeKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIncludeKeywords();
    }
  }
</script>

<aside class="w-64 min-w-64 bg-bg-secondary border-r border-border flex flex-col h-full">
  <!-- Upload Zone -->
  <div
    class="m-3 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
           {isDragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-text-muted'}"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={() => fileInput.click()}
    role="button"
    tabindex="0"
    on:keydown={e => e.key === 'Enter' && fileInput.click()}
    aria-label="Upload photos"
  >
    <div class="flex flex-col items-center gap-2">
      <div class="w-10 h-10 rounded-full bg-bg-primary flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
      </div>
      <div>
        <p class="text-sm text-text-primary font-medium">Drop photos here</p>
        <p class="text-xs text-text-muted mt-0.5">or click to browse</p>
      </div>
    </div>
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      on:change={handleFileInput}
    />
  </div>

  <!-- Photo Count -->
  {#if $photos.length > 0}
    <div class="px-4 py-2 flex items-center justify-between">
      <span class="text-xs text-text-muted font-medium uppercase tracking-wider">Photos</span>
      <span class="text-xs bg-bg-primary text-text-muted px-2 py-0.5 rounded-full">{$photos.length}</span>
    </div>
  {/if}

  <!-- Photo List -->
  <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
    {#each $photos as photo (photo.id)}
      {@const isSelected = $selectedPhotoId === photo.id}
      {@const statusInfo = STATUS_ICONS[photo.status]}
      <button
        class="w-full flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all text-left group
               {isSelected ? 'bg-accent/20 border border-accent/40' : 'hover:bg-bg-primary border border-transparent'}"
        on:click={() => selectPhoto(photo.id)}
        aria-label="Select {photo.file.name}"
        aria-pressed={isSelected}
      >
        <!-- Thumbnail -->
        <div class="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-bg-primary">
          <img
            src={photo.previewUrl}
            alt={photo.file.name}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-text-primary truncate leading-tight">
            {truncateName(photo.file.name)}
          </p>
          <p class="text-xs text-text-muted mt-0.5">
            {#if photo.status === 'generating'}
              Generating...
            {:else if photo.status === 'done'}
              {photo.keywords.length} keywords
            {:else if photo.status === 'error'}
              Error
            {:else}
              Pending
            {/if}
          </p>
        </div>

        <!-- Status + Remove -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <span class="text-sm {statusInfo.class}" title={photo.status}>
            {#if photo.status === 'generating'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
                <path d="M21 12a9 9 0 00-9-9"/>
              </svg>
            {:else}
              {statusInfo.icon}
            {/if}
          </span>
          <button
            on:click={e => handleRemove(e, photo.id)}
            class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
            aria-label="Remove {photo.file.name}"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </button>
    {/each}

    <!-- Empty state -->
    {#if $photos.length === 0}
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <p class="text-text-muted text-sm">No photos yet</p>
        <p class="text-text-muted text-xs mt-1">Upload photos to get started</p>
      </div>
    {/if}
  </div>
  <!-- Include Keywords Section -->
  <div class="border-t border-border p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs text-text-muted font-medium uppercase tracking-wider">Include Keywords</span>
      {#if $includeKeywords.length > 0}
        <button
          on:click={clearIncludeKeywords}
          class="text-xs text-text-muted hover:text-red-400 transition-colors"
          title="Clear all include keywords"
        >
          Clear
        </button>
      {/if}
    </div>
    <p class="text-xs text-text-muted leading-relaxed">
      Added to <span class="text-accent">all photos</span> on generate
    </p>

    <!-- Include keyword chips -->
    {#if $includeKeywords.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each $includeKeywords as word}
          <span class="flex items-center gap-1 px-2 py-1 bg-accent/15 border border-accent/30
                       text-white text-xs rounded-full">
            {word}
            <button
              on:click={() => removeIncludeKeyword(word)}
              class="text-text-muted hover:text-red-400 transition-colors"
              aria-label="Remove {word}"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </span>
        {/each}
      </div>
    {/if}

    <!-- Input -->
    <div class="flex gap-1.5">
      <input
        type="text"
        bind:value={includeInput}
        on:keydown={handleIncludeKeydown}
        placeholder="e.g. indonesia, bali"
        class="flex-1 min-w-0 bg-bg-primary border border-border rounded-lg px-3 py-1.5
               text-text-primary placeholder-text-muted text-xs
               focus:outline-none focus:border-accent transition-colors"
      />
      <button
        on:click={addIncludeKeywords}
        disabled={!includeInput.trim()}
        class="px-2.5 py-1.5 bg-bg-primary border border-border hover:border-accent
               disabled:opacity-40 disabled:cursor-not-allowed text-text-muted
               hover:text-text-primary text-xs rounded-lg transition-colors flex-shrink-0"
      >
        Add
      </button>
    </div>
  </div>
</aside>
