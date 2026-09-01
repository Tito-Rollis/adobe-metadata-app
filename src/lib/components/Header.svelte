<script>
  import { photos, isBulkGenerating, generateAllMetadata, resetAll } from '$lib/stores/photoStore.js';
  import { mapToShutterstockCategory } from '$lib/constants.js';

  let showExportMenu = false;

  function exportAdobeCSV() {
    showExportMenu = false;
    const rows = [['Filename', 'Title', 'Keywords', 'Category', 'Release(s)']];

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

    if (rows.length <= 1) { alert('No completed metadata to export.'); return; }
    downloadCSV(rows, 'adobe-stock-metadata.csv');
  }

  function exportShutterstockCSV() {
    showExportMenu = false;
    const rows = [['Filename', 'Description', 'Keywords', 'Categories', 'Illustration', 'Mature Content', 'Editorial']];

    $photos.forEach(photo => {
      if (photo.status === 'done' || photo.keywords.length > 0) {
        const ssCategory = mapToShutterstockCategory(photo.category);
        rows.push([
          photo.file.name,
          `"${photo.title.replace(/"/g, '""')}"`,
          `"${photo.keywords.map(k => k.word).join(', ').replace(/"/g, '""')}"`,
          `"${ssCategory}"`,
          'No',
          'No',
          'No'
        ]);
      }
    });

    if (rows.length <= 1) { alert('No completed metadata to export.'); return; }
    downloadCSV(rows, 'shutterstock-metadata.csv');
  }

  /** @param {string[][]} rows @param {string} filename */
  function downloadCSV(rows, filename) {
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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

<header class="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border shrink-0">
  <!-- Logo -->
  <div class="flex items-center gap-2.5">
    <div class="w-7 h-7 bg-accent rounded-md flex items-center justify-center shrink-0">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="white"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
    <div>
      <h1 class="text-text-primary font-semibold text-sm leading-none">Stock Metadata</h1>
      <p class="text-text-subtle text-xs mt-0.5">Adobe Stock AI Generator</p>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2">
    {#if $isBulkGenerating}
      <span class="flex items-center gap-1.5 text-xs text-warning">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
          <path d="M21 12a9 9 0 00-9-9"/>
        </svg>
        {doneCount}/{$photos.length} done
      </span>
    {:else if doneCount > 0 && $photos.length > 0}
      <span class="text-xs text-text-muted">{doneCount}/{$photos.length} ready</span>
    {/if}

    <!-- Generate All -->
    {#if (pendingCount > 0 || $isBulkGenerating) && $photos.length > 0}
      <button
        on:click={generateAllMetadata}
        disabled={$isBulkGenerating || pendingCount === 0}
        class="btn-secondary text-xs"
      >
        {#if $isBulkGenerating}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
          Generating...
        {:else}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          Generate All ({pendingCount})
        {/if}
      </button>
    {/if}

    <!-- Reset All -->
    {#if $photos.length > 0 && !$isBulkGenerating}
      <button on:click={handleReset} class="btn-danger text-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
        Reset
      </button>
    {/if}

    <!-- Export CSV dropdown -->
    <div class="relative">
      <button
        on:click={() => showExportMenu = !showExportMenu}
        disabled={doneCount === 0}
        class="btn-primary text-xs"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Export CSV
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {#if showExportMenu}
        <!-- Backdrop -->
        <button
          class="fixed inset-0 z-10"
          on:click={() => showExportMenu = false}
          aria-label="Close menu"
        />
        <!-- Dropdown -->
        <div class="absolute right-0 top-full mt-1 z-20 bg-bg-panel border border-border rounded-lg shadow-xl overflow-hidden min-w-44">
          <button
            on:click={exportAdobeCSV}
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-bg-hover transition-colors text-left"
          >
            <div class="w-5 h-5 rounded bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <span class="text-red-400 font-bold text-xs leading-none">A</span>
            </div>
            <div>
              <p class="font-medium">Adobe Stock</p>
              <p class="text-text-subtle text-xs">Filename, Title, Keywords, Category</p>
            </div>
          </button>
          <div class="border-t border-border"/>
          <button
            on:click={exportShutterstockCSV}
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-bg-hover transition-colors text-left"
          >
            <div class="w-5 h-5 rounded bg-red-800/20 border border-red-700/30 flex items-center justify-center shrink-0">
              <span class="text-red-300 font-bold text-xs leading-none">S</span>
            </div>
            <div>
              <p class="font-medium">Shutterstock</p>
              <p class="text-text-subtle text-xs">Filename, Description, Keywords, Category</p>
            </div>
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>
