<script>
  import { csvFormat, parseCSV, loadAssets, assets } from '$lib/stores/assetStore.js';

  let isDragOver = false;
  let fileInput;
  let error = '';
  let importing = false;

  const FORMAT_OPTIONS = [
    {
      value: 'adobe',
      label: 'Adobe Stock',
      description: 'Filename, Title, Keywords, Category',
      color: 'text-red-400',
      bg: 'bg-red-600/10 border-red-500/20',
      activeBg: 'bg-red-600/20 border-red-500/50',
      letter: 'A'
    },
    {
      value: 'shutterstock',
      label: 'Shutterstock',
      description: 'Filename, Description, Keywords, Categories',
      color: 'text-orange-400',
      bg: 'bg-orange-600/10 border-orange-500/20',
      activeBg: 'bg-orange-600/20 border-orange-500/50',
      letter: 'S'
    }
  ];

  /** @param {File} file */
  async function processFile(file) {
    if (!file.name.endsWith('.csv')) {
      error = 'Please upload a .csv file';
      return;
    }

    importing = true;
    error = '';

    try {
      const text = await file.text();
      const parsed = parseCSV(text, $csvFormat);

      if (parsed.length === 0) {
        error = 'No valid rows found. Check that the CSV format matches the selected format.';
        importing = false;
        return;
      }

      loadAssets(parsed);
    } catch (err) {
      error = 'Failed to parse CSV file. Please check the file format.';
      console.error(err);
    }

    importing = false;
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave() { isDragOver = false; }

  function handleDrop(e) {
    e.preventDefault();
    isDragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="flex flex-col items-center justify-center h-full p-8">
  <div class="w-full max-w-md space-y-6">

    <!-- Title -->
    <div class="text-center">
      <div class="w-12 h-12 bg-bg-secondary border border-border rounded-xl flex items-center justify-center mx-auto mb-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-accent">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </div>
      <h2 class="text-text-primary font-semibold text-base">Import CSV Metadata</h2>
      <p class="text-text-muted text-sm mt-1">Select format then upload your CSV file</p>
    </div>

    <!-- Format selector -->
    <div class="space-y-2">
      <p class="text-xs font-medium text-text-muted uppercase tracking-wider">1. Select CSV Format</p>
      <div class="grid grid-cols-2 gap-2">
        {#each FORMAT_OPTIONS as opt}
          <button
            on:click={() => csvFormat.set(opt.value)}
            class="flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all
                   {$csvFormat === opt.value ? opt.activeBg : opt.bg + ' hover:opacity-80'}"
          >
            <div class="w-7 h-7 rounded-md bg-bg-primary flex items-center justify-center shrink-0">
              <span class="font-bold text-sm {opt.color}">{opt.letter}</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-text-primary">{opt.label}</p>
              <p class="text-xs text-text-subtle truncate">{opt.description}</p>
            </div>
            {#if $csvFormat === opt.value}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="{opt.color} shrink-0 ml-auto">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Upload zone -->
    <div class="space-y-2">
      <p class="text-xs font-medium text-text-muted uppercase tracking-wider">2. Upload CSV File</p>
      <div
        class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
               {isDragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-text-subtle'}"
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        on:click={() => fileInput.click()}
        role="button"
        tabindex="0"
        on:keydown={e => e.key === 'Enter' && fileInput.click()}
        aria-label="Upload CSV file"
      >
        {#if importing}
          <div class="flex flex-col items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin text-accent">
              <path d="M21 12a9 9 0 00-9-9"/>
            </svg>
            <p class="text-sm text-text-muted">Importing...</p>
          </div>
        {:else}
          <div class="flex flex-col items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-subtle">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <div>
              <p class="text-sm text-text-muted font-medium">Drop CSV file here</p>
              <p class="text-xs text-text-subtle mt-0.5">or click to browse</p>
            </div>
          </div>
        {/if}
      </div>
      <input bind:this={fileInput} type="file" accept=".csv" class="hidden" on:change={handleFileInput}/>
    </div>

    <!-- Error -->
    {#if error}
      <p class="text-danger text-xs bg-danger-muted border border-danger/20 px-3 py-2 rounded-lg">
        ⚠ {error}
      </p>
    {/if}

    <!-- Format hint -->
    <div class="bg-bg-secondary border border-border rounded-lg p-3 space-y-1.5">
      <p class="text-xs font-medium text-text-muted">
        Expected columns for <span class="text-text-primary">{$csvFormat === 'adobe' ? 'Adobe Stock' : 'Shutterstock'}</span>:
      </p>
      {#if $csvFormat === 'adobe'}
        <code class="text-xs text-accent">Filename, Title, Keywords, Category</code>
      {:else}
        <code class="text-xs text-orange-400">Filename, Description, Keywords, Categories, ...</code>
      {/if}
    </div>

  </div>
</div>
