<script>
  import { assets, resetAll, csvFormat } from '$lib/stores/assetStore.js';
  import { mapToShutterstockCategory } from '$lib/constants.js';

  let showExportMenu = false;

  function exportAdobeCSV() {
    showExportMenu = false;
    const rows = [['Filename', 'Title', 'Keywords', 'Category', 'Release(s)']];

    $assets.forEach(asset => {
      rows.push([
        asset.filename,
        `"${asset.title.replace(/"/g, '""')}"`,
        `"${asset.keywords.map(k => k.word).join(', ').replace(/"/g, '""')}"`,
        '',
        ''
      ]);
    });

    if (rows.length <= 1) { alert('No assets to export.'); return; }
    downloadCSV(rows, 'adobe-stock-metadata.csv');
  }

  function exportShutterstockCSV() {
    showExportMenu = false;
    const rows = [['Filename', 'Description', 'Keywords', 'Categories', 'Illustration', 'Mature Content', 'Editorial']];

    $assets.forEach(asset => {
      rows.push([
        asset.filename,
        `"${asset.title.replace(/"/g, '""')}"`,
        `"${asset.keywords.map(k => k.word).join(', ').replace(/"/g, '""')}"`,
        '',
        'No',
        'No',
        'No'
      ]);
    });

    if (rows.length <= 1) { alert('No assets to export.'); return; }
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
    if ($assets.length === 0) return;
    if (confirm(`Reset everything? This will remove all ${$assets.length} asset(s).`)) {
      resetAll();
    }
  }

  $: editedCount = $assets.filter(a => a.status === 'edited').length;
  $: totalCount = $assets.length;
</script>

<header class="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border shrink-0">
  <!-- Logo -->
  <div class="flex items-center gap-2.5">
    <div class="w-7 h-7 bg-accent rounded-md flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    </div>
    <div>
      <h1 class="text-text-primary font-semibold text-sm leading-none">Stock Metadata Editor</h1>
      <p class="text-text-subtle text-xs mt-0.5">CSV metadata editor for Adobe Stock & Shutterstock</p>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2">
    <!-- Status -->
    {#if totalCount > 0}
      <span class="text-xs text-text-muted">
        <span class="text-success">{editedCount}</span>/{totalCount} edited
      </span>
    {/if}

    <!-- Reset -->
    {#if totalCount > 0}
      <button on:click={handleReset} class="btn-danger text-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
        Reset
      </button>
    {/if}

    <!-- Export CSV dropdown -->
    <div class="relative">
      <button
        on:click={() => showExportMenu = !showExportMenu}
        disabled={totalCount === 0}
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
        <button class="fixed inset-0 z-10" on:click={() => showExportMenu = false} aria-label="Close menu"/>
        <div class="absolute right-0 top-full mt-1 z-20 bg-bg-panel border border-border rounded-lg shadow-xl overflow-hidden min-w-48">
          <button
            on:click={exportAdobeCSV}
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-bg-hover transition-colors text-left"
          >
            <div class="w-5 h-5 rounded bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <span class="text-red-400 font-bold text-xs">A</span>
            </div>
            <div>
              <p class="font-medium">Adobe Stock</p>
              <p class="text-text-subtle">Filename, Title, Keywords</p>
            </div>
          </button>
          <div class="border-t border-border"/>
          <button
            on:click={exportShutterstockCSV}
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-bg-hover transition-colors text-left"
          >
            <div class="w-5 h-5 rounded bg-orange-600/20 border border-orange-500/30 flex items-center justify-center shrink-0">
              <span class="text-orange-400 font-bold text-xs">S</span>
            </div>
            <div>
              <p class="font-medium">Shutterstock</p>
              <p class="text-text-subtle">Filename, Description, Keywords</p>
            </div>
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>
