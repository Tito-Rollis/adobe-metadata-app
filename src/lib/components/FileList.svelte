<script>
  import { assets, selectedAssetId, resetAll } from '$lib/stores/assetStore.js';

  const STATUS = {
    pending: { dot: 'bg-warning', label: 'Not edited' },
    edited:  { dot: 'bg-success', label: 'Edited' }
  };

  function selectAsset(id) { selectedAssetId.set(id); }

  function truncateName(name) {
    return name.length > 24 ? name.slice(0, 21) + '...' : name;
  }

  $: editedCount = $assets.filter(a => a.status === 'edited').length;
  $: totalCount = $assets.length;
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
        <!-- File icon -->
        <div class="w-7 h-7 rounded bg-bg-panel border border-border flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-subtle">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
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
