<script>
  import { photos } from '$lib/stores/photoStore.js';

  /** @param {import('svelte/store').Readable<import('$lib/stores/photoStore.js').PhotoItem[]>} photosStore */
  function exportCSV() {
    const rows = [];
    // CSV header — Adobe Stock bulk upload format
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

  $: doneCount = $photos.filter(p => p.status === 'done' || p.keywords.length > 0).length;
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
    {#if doneCount > 0}
      <span class="text-text-muted text-sm">{doneCount} photo{doneCount > 1 ? 's' : ''} ready</span>
    {/if}

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
