<script>
  import { assets, selectedAssetId, addMediaFiles, applyCSVMetadata, removeAsset, csvFormat } from '$lib/stores/assetStore.js';

  const STATUS = {
    pending: { dot: 'bg-warning', label: 'Not edited' },
    edited:  { dot: 'bg-success', label: 'Edited' }
  };

  let isDragOverMedia = false;
  let isDragOverCSV = false;
  let mediaInput;
  let csvInput;
  let csvMatchMsg = '';
  let csvFormat_val = 'adobe';

  function selectAsset(id) { selectedAssetId.set(id); }

  function truncateName(name) {
    return name.length > 22 ? name.slice(0, 19) + '...' : name;
  }

  // Media upload handlers
  function handleMediaDragOver(e) { e.preventDefault(); isDragOverMedia = true; }
  function handleMediaDragLeave() { isDragOverMedia = false; }
  function handleMediaDrop(e) {
    e.preventDefault(); isDragOverMedia = false;
    addMediaFiles(Array.from(e.dataTransfer?.files || []));
  }
  function handleMediaInput(e) {
    addMediaFiles(Array.from(e.target.files || []));
    if (mediaInput) mediaInput.value = '';
  }

  // CSV upload handlers
  function handleCSVDragOver(e) { e.preventDefault(); isDragOverCSV = true; }
  function handleCSVDragLeave() { isDragOverCSV = false; }
  function handleCSVDrop(e) {
    e.preventDefault(); isDragOverCSV = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) processCSV(file);
  }
  function handleCSVInput(e) {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
    if (csvInput) csvInput.value = '';
  }

  async function processCSV(file) {
    if (!file.name.endsWith('.csv')) {
      csvMatchMsg = '⚠ Please upload a .csv file';
      setTimeout(() => csvMatchMsg = '', 3000);
      return;
    }
    csvFormat.set(csvFormat_val);
    const text = await file.text();
    const matched = applyCSVMetadata(text, csvFormat_val);
    csvMatchMsg = matched > 0
      ? `✓ ${matched} asset${matched > 1 ? 's' : ''} updated`
      : '⚠ No matching filenames found';
    setTimeout(() => csvMatchMsg = '', 3000);
  }

  $: editedCount = $assets.filter(a => a.status === 'edited').length;
  $: totalCount = $assets.length;
</script>

<aside class="w-60 min-w-60 bg-bg-secondary border-r border-border flex flex-col h-full overflow-hidden">

  <!-- Media Upload Zone -->
  <div
    class="m-2 border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all
           {isDragOverMedia ? 'border-accent bg-accent/5' : 'border-border hover:border-text-subtle'}"
    on:dragover={handleMediaDragOver}
    on:dragleave={handleMediaDragLeave}
    on:drop={handleMediaDrop}
    on:click={() => mediaInput.click()}
    role="button"
    tabindex="0"
    on:keydown={e => e.key === 'Enter' && mediaInput.click()}
    aria-label="Upload photos or videos"
  >
    <div class="flex flex-col items-center gap-1.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-subtle">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      <div>
        <p class="text-xs text-text-muted font-medium">Drop photos or videos</p>
        <p class="text-xs text-text-subtle mt-0.5">JPG, PNG, MP4 · click to browse</p>
      </div>
    </div>
    <input bind:this={mediaInput} type="file" accept="image/*,video/mp4,video/*" multiple class="hidden" on:change={handleMediaInput}/>
  </div>

  <!-- CSV Import Zone -->
  <div class="mx-2 mb-2 space-y-1.5">
    <!-- Format selector -->
    <div class="flex gap-1.5">
      <button
        on:click={() => csvFormat_val = 'adobe'}
        class="flex-1 text-xs py-1 rounded border transition-all
               {csvFormat_val === 'adobe' ? 'bg-red-600/20 border-red-500/50 text-red-400' : 'bg-bg-panel border-border text-text-subtle hover:border-text-subtle'}"
      >
        Adobe
      </button>
      <button
        on:click={() => csvFormat_val = 'shutterstock'}
        class="flex-1 text-xs py-1 rounded border transition-all
               {csvFormat_val === 'shutterstock' ? 'bg-orange-600/20 border-orange-500/50 text-orange-400' : 'bg-bg-panel border-border text-text-subtle hover:border-text-subtle'}"
      >
        Shutterstock
      </button>
    </div>

    <!-- CSV drop zone -->
    <div
      class="border border-dashed rounded-lg px-3 py-2 text-center cursor-pointer transition-all
             {isDragOverCSV ? 'border-accent bg-accent/5' : 'border-border hover:border-text-subtle'}"
      on:dragover={handleCSVDragOver}
      on:dragleave={handleCSVDragLeave}
      on:drop={handleCSVDrop}
      on:click={() => csvInput.click()}
      role="button"
      tabindex="0"
      on:keydown={e => e.key === 'Enter' && csvInput.click()}
      aria-label="Import CSV metadata"
    >
      {#if csvMatchMsg}
        <p class="text-xs {csvMatchMsg.startsWith('✓') ? 'text-success' : 'text-warning'}">{csvMatchMsg}</p>
      {:else}
        <div class="flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-subtle">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
          </svg>
          <p class="text-xs text-text-subtle">Import CSV metadata</p>
        </div>
      {/if}
      <input bind:this={csvInput} type="file" accept=".csv" class="hidden" on:change={handleCSVInput}/>
    </div>
  </div>

  <!-- Stats bar -->
  {#if totalCount > 0}
    <div class="px-3 py-1.5 border-t border-b border-border flex items-center justify-between">
      <span class="text-xs text-text-muted">{totalCount} files</span>
      <span class="text-xs text-text-subtle">
        <span class="text-success">{editedCount}</span>/{totalCount} edited
      </span>
    </div>
  {/if}

  <!-- Asset list -->
  <div class="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
    {#each $assets as asset (asset.id)}
      {@const isSelected = $selectedAssetId === asset.id}
      {@const status = STATUS[asset.status] || STATUS.pending}
      <button
        class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all group
               {isSelected ? 'bg-accent/10 border border-accent/30' : 'hover:bg-bg-hover border border-transparent'}"
        on:click={() => selectAsset(asset.id)}
        aria-pressed={isSelected}
      >
        <!-- Thumbnail -->
        <div class="w-9 h-9 rounded overflow-hidden shrink-0 bg-bg-panel border border-border relative">
          {#if asset.isVideo}
            <video src={asset.previewUrl} class="w-full h-full object-cover" muted preload="metadata"/>
            <div class="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          {:else}
            <img src={asset.previewUrl} alt={asset.filename} class="w-full h-full object-cover" loading="lazy"/>
          {/if}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-text-primary truncate leading-tight font-medium">
            {truncateName(asset.filename)}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 {status.dot}"></span>
            <p class="text-xs text-text-muted truncate">
              {#if asset.status === 'edited'}
                <span class="text-success">Edited</span> · {asset.keywords.length} kw
              {:else}
                <span class="text-warning">Not edited</span>
              {/if}
            </p>
          </div>
        </div>

        <!-- Remove -->
        <button
          on:click|stopPropagation={() => removeAsset(asset.id)}
          class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded
                 text-text-subtle hover:text-danger hover:bg-danger-muted transition-all shrink-0"
          aria-label="Remove {asset.filename}"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </button>
    {/each}

    {#if $assets.length === 0}
      <div class="flex flex-col items-center justify-center py-6 text-center">
        <p class="text-xs text-text-subtle">No files uploaded yet</p>
      </div>
    {/if}
  </div>
</aside>
