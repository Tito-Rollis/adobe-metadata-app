<script>
  import { assets, selectedAssetId, attachMediaFiles } from '$lib/stores/assetStore.js';

  const STATUS = {
    pending: { dot: 'bg-warning', label: 'Not edited' },
    edited:  { dot: 'bg-success', label: 'Edited' }
  };

  let isDragOver = false;
  let fileInput;
  let matchedCount = 0;

  function selectAsset(id) { selectedAssetId.set(id); }

  function truncateName(name) {
    return name.length > 24 ? name.slice(0, 21) + '...' : name;
  }

  /** @param {File[]} files */
  function handleFiles(files) {
    const media = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (media.length === 0) return;
    attachMediaFiles(media);
    matchedCount = media.filter(f => $assets.some(a => a.filename === f.name)).length;
    setTimeout(() => matchedCount = 0, 3000);
  }

  function handleDragOver(e) { e.preventDefault(); isDragOver = true; }
  function handleDragLeave() { isDragOver = false; }
  function handleDrop(e) {
    e.preventDefault(); isDragOver = false;
    handleFiles(Array.from(e.dataTransfer?.files || []));
  }
  function handleFileInput(e) {
    handleFiles(Array.from(e.target.files || []));
    if (fileInput) fileInput.value = '';
  }

  $: editedCount = $assets.filter(a => a.status === 'edited').length;
  $: totalCount = $assets.length;
  $: withPreview = $assets.filter(a => a.previewUrl).length;
</script>

<aside class="w-60 min-w-60 bg-bg-secondary border-r border-border flex flex-col h-full overflow-hidden">

  <!-- Stats bar -->
  <div class="px-3 py-2.5 border-b border-border flex items-center justify-between">
    <div class="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-muted">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
      <span class="text-xs text-text-muted font-medium">{totalCount} assets</span>
    </div>
    <span class="text-xs text-text-subtle">
      <span class="text-success">{editedCount}</span>/{totalCount} edited
    </span>
  </div>

  <!-- Upload media zone -->
  <div
    class="mx-2 mt-2 mb-1 border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-all
           {isDragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-text-subtle'}"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={() => fileInput.click()}
    role="button"
    tabindex="0"
    on:keydown={e => e.key === 'Enter' && fileInput.click()}
    aria-label="Upload media files"
  >
    <div class="flex items-center justify-center gap-2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-subtle shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      {#if matchedCount > 0}
        <p class="text-xs text-success">✓ {matchedCount} matched</p>
      {:else}
        <p class="text-xs text-text-subtle">
          Drop photos/videos for preview
          {#if withPreview > 0}<span class="text-accent">· {withPreview} loaded</span>{/if}
        </p>
      {/if}
    </div>
    <input bind:this={fileInput} type="file" accept="image/*,video/mp4,video/*" multiple class="hidden" on:change={handleFileInput}/>
  </div>

  <!-- Asset list -->
  <div class="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
    {#each $assets as asset (asset.id)}
      {@const isSelected = $selectedAssetId === asset.id}
      {@const status = STATUS[asset.status] || STATUS.pending}
      <button
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all group
               {isSelected
                 ? 'bg-accent/10 border border-accent/30'
                 : 'hover:bg-bg-hover border border-transparent'}"
        on:click={() => selectAsset(asset.id)}
        aria-pressed={isSelected}
      >
        <!-- Thumbnail / File icon -->
        <div class="w-8 h-8 rounded overflow-hidden bg-bg-panel border border-border flex items-center justify-center shrink-0">
          {#if asset.previewUrl}
            {#if asset.isVideo}
              <div class="relative w-full h-full">
                <video src={asset.previewUrl} class="w-full h-full object-cover" muted preload="metadata"/>
                <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
              </div>
            {:else}
              <img src={asset.previewUrl} alt={asset.filename} class="w-full h-full object-cover" loading="lazy"/>
            {/if}
          {:else}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-subtle">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          {/if}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-text-primary truncate leading-tight font-medium">
            {truncateName(asset.filename)}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 {status.dot}"></span>
            <p class="text-xs text-text-muted">
              {#if asset.status === 'edited'}
                <span class="text-success">{status.label}</span>
                · {asset.keywords.length} kw
              {:else}
                <span class="text-warning">{status.label}</span>
              {/if}
            </p>
          </div>
        </div>
      </button>
    {/each}

    {#if $assets.length === 0}
      <div class="flex flex-col items-center justify-center py-10 text-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-text-subtle mb-2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <p class="text-xs text-text-subtle">No assets loaded</p>
        <p class="text-xs text-text-subtle mt-0.5">Import a CSV to get started</p>
      </div>
    {/if}
  </div>
</aside>
