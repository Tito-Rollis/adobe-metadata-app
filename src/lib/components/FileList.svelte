<script>
  import { photos, selectedPhotoId, addPhotos, removePhoto, includeKeywords } from '$lib/stores/photoStore.js';
  import { MAX_KEYWORDS } from '$lib/constants.js';
  import ApiKeyInput from '$lib/components/ApiKeyInput.svelte';

  let isDragOver = false;
  let fileInput;
  let includeInput = '';

  const STATUS = {
    pending:    { dot: 'bg-warning', label: 'Not edited' },
    generating: { dot: 'bg-warning animate-pulse', label: 'Generating...' },
    done:       { dot: 'bg-success', label: 'Edited' },
    error:      { dot: 'bg-danger', label: 'Error' }
  };

  function handleDragOver(e) { e.preventDefault(); isDragOver = true; }
  function handleDragLeave() { isDragOver = false; }

  function handleDrop(e) {
    e.preventDefault();
    isDragOver = false;
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) addPhotos(files);
  }

  function handleFileInput(e) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addPhotos(files);
    if (fileInput) fileInput.value = '';
  }

  function selectPhoto(id) { selectedPhotoId.set(id); }

  function handleRemove(e, id) {
    e.stopPropagation();
    removePhoto(id);
  }

  function truncateName(name) {
    return name.length > 22 ? name.slice(0, 19) + '...' : name;
  }

  function addIncludeKeywords() {
    if (!includeInput.trim()) return;
    const words = includeInput.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
    includeKeywords.update(current => {
      const existing = new Set(current);
      return [...current, ...words.filter(w => !existing.has(w))];
    });
    includeInput = '';
  }

  function removeIncludeKeyword(word) {
    includeKeywords.update(current => current.filter(w => w !== word));
  }

  function clearIncludeKeywords() { includeKeywords.set([]); }

  function handleIncludeKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addIncludeKeywords(); }
  }
</script>

<aside class="w-60 min-w-60 bg-bg-secondary border-r border-border flex flex-col h-full overflow-hidden">

  <!-- API Key -->
  <ApiKeyInput />

  <!-- Upload Zone -->
  <div
    class="m-2 border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all
           {isDragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-text-subtle'}"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={() => fileInput.click()}
    role="button"
    tabindex="0"
    on:keydown={e => e.key === 'Enter' && fileInput.click()}
    aria-label="Upload photos"
  >
    <div class="flex flex-col items-center gap-1.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-subtle">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      <div>
        <p class="text-xs text-text-muted font-medium">Drop photos here</p>
        <p class="text-xs text-text-subtle mt-0.5">or click to browse</p>
      </div>
    </div>
    <input bind:this={fileInput} type="file" accept="image/*" multiple class="hidden" on:change={handleFileInput}/>
  </div>

  <!-- Photo Count -->
  {#if $photos.length > 0}
    <div class="px-3 pb-1 flex items-center justify-between">
      <span class="text-xs text-text-subtle font-medium uppercase tracking-wider">Photos</span>
      <span class="text-xs text-text-subtle bg-bg-panel px-1.5 py-0.5 rounded">{$photos.length}</span>
    </div>
  {/if}

  <!-- Photo List -->
  <div class="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
    {#each $photos as photo (photo.id)}
      {@const isSelected = $selectedPhotoId === photo.id}
      {@const status = STATUS[photo.status]}
      <button
        class="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-all group
               {isSelected ? 'bg-accent/10 border border-accent/30' : 'hover:bg-bg-hover border border-transparent'}"
        on:click={() => selectPhoto(photo.id)}
        aria-pressed={isSelected}
      >
        <!-- Thumbnail -->
        <div class="w-9 h-9 rounded overflow-hidden shrink-0 bg-bg-panel border border-border">
          <img src={photo.previewUrl} alt={photo.file.name} class="w-full h-full object-cover" loading="lazy"/>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-text-primary truncate leading-tight font-medium">
            {truncateName(photo.file.name)}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 {status.dot}"></span>
            <p class="text-xs text-text-muted truncate">
              {#if photo.status === 'done'}
                {photo.keywords.length} keywords
              {:else if photo.status === 'error'}
                <span class="text-danger">Error</span>
              {:else}
                {status.label}
              {/if}
            </p>
          </div>
        </div>

        <!-- Remove -->
        <button
          on:click={e => handleRemove(e, photo.id)}
          class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded
                 text-text-subtle hover:text-danger hover:bg-danger-muted transition-all shrink-0"
          aria-label="Remove {photo.file.name}"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </button>
    {/each}

    {#if $photos.length === 0}
      <div class="flex flex-col items-center justify-center py-6 text-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-text-subtle mb-2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <p class="text-xs text-text-subtle">No photos yet</p>
      </div>
    {/if}
  </div>

  <!-- Include Keywords -->
  <div class="border-t border-border p-2.5 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs text-text-subtle font-medium uppercase tracking-wider">Include Keywords</span>
      {#if $includeKeywords.length > 0}
        <button on:click={clearIncludeKeywords} class="text-xs text-text-subtle hover:text-danger transition-colors">
          Clear
        </button>
      {/if}
    </div>

    <p class="text-xs text-text-subtle">Added to <span class="text-accent">all photos</span> on generate</p>

    {#if $includeKeywords.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each $includeKeywords as word}
          <span class="flex items-center gap-1 px-2 py-0.5 bg-bg-panel border border-border text-text-muted text-xs rounded-full">
            {word}
            <button on:click={() => removeIncludeKeyword(word)} class="text-text-subtle hover:text-danger transition-colors" aria-label="Remove {word}">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </span>
        {/each}
      </div>
    {/if}

    <div class="flex gap-1.5">
      <input
        type="text"
        bind:value={includeInput}
        on:keydown={handleIncludeKeydown}
        placeholder="e.g. indonesia, bali"
        class="flex-1 min-w-0 text-xs py-1 px-2"
      />
      <button
        on:click={addIncludeKeywords}
        disabled={!includeInput.trim()}
        class="btn-primary text-xs px-2.5 py-1 shrink-0"
      >
        Add
      </button>
    </div>
  </div>
</aside>
