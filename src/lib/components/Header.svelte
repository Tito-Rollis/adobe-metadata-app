<script>
  import { photos, isBulkGenerating, generateAllMetadata, resetAll } from '$lib/stores/photoStore.js';

  function exportCSV() {
    const rows = [];
    rows.push(['Filename', 'Title', 'Keywords', 'Category', 'Release(s)']);

    $photos.forEach(photo => {
      if (photo.status === 'done' || photo.keywords.length > 0) {
        rows.push([
          photo.file.name,
          `"${photo.title.replace(/"/g, '""')}"`,
          `"${photo.keywords.map(k => k.word).join(', ').replace(/"/g, '""')}"`,
          `"${photo.category}"`,
          ''
        ]);
      }
    });

    if (rows.length <= 1) {
      alert('No completed metadata to export. Please generate metadata for at least one photo first.');
      return;
    }

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adobe-stock-metadata.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if ($photos.length === 0) return;
    if (confirm(`Reset everything? This will remove all ${$photos.length} photo(s) and their metadata.`)) {
      resetAll();
    }
  }

  $: doneCount = $photos.filter(p => p.status === 'done' || p.keywords.length > 0).length;
  $: pendingCount = $photos.filter(p => p.status === 'pending' || p.status === 'error').length;
  $: generatingCount = $photos.filter(p => p.status === 'generating').length;
</script>

<header class="flex items-center justify-between px-6 py-4 bg-bg-secondary border-b border-border">
  <div class="flex items-center gap-3">
    <!-- Logo -->
    <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
    <div>
      <h1 class="text-white font-semibold text-lg leading-none">Adobe Stock Metadata</h1>
      <p class="text-text-muted text-xs mt-0.5">Auto-generate metadata for Adobe Stock</p>
    </div>
  </div>

  <div class="flex items-center gap-3">
    <!-- Status info -->
    {#if $isBulkGenerating}
      <span class="text-yellow-400 text-sm flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
          <path d="M21 12a9 9 0 00-9-9"/>
        </svg>
        Generating {generatingCount > 0 ? `(${doneCount}/${$photos.length})` : '...'}
      </span>
    {:else if doneCount > 0}
      <span class="text-text-muted text-sm">{doneCount}/{$photos.length} ready</span>
    {/if}

    <!-- Generate All button -->
    {#if pendingCount > 0 || $isBulkGenerating}
      <button
        on:click={generateAllMetadata}
        disabled={$isBulkGenerating || pendingCount === 0}
        class="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border hover:border-accent
               disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium
               rounded-lg transition-colors"
      >
        {#if $isBulkGenerating}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
          Generating...
        {:else}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          Generate All ({pendingCount})
        {/if}
      </button>
    {/if}

    <!-- Reset All button -->
    {#if $photos.length > 0 && !$isBulkGenerating}
      <button
        on:click={handleReset}
        title="Reset everything — remove all photos and metadata"
        class="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border
               hover:border-red-400 hover:text-red-400 text-text-muted text-sm font-medium
               rounded-lg transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
        Reset All
      </button>
    {/if}

    <!-- Export CSV button -->
    <button
      on:click={exportCSV}
      disabled={doneCount === 0}
      class="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
      </svg>
      Export CSV
    </button>
  </div>
</header>
