<script>
  import Header from '$lib/components/Header.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import MetadataEditor from '$lib/components/MetadataEditor.svelte';
  import CsvImport from '$lib/components/CsvImport.svelte';
  import { assets } from '$lib/stores/assetStore.js';
</script>

<svelte:head>
  <title>Stock Metadata Editor</title>
  <meta name="description" content="CSV metadata editor for Adobe Stock & Shutterstock" />
</svelte:head>

<div class="flex flex-col h-screen overflow-hidden bg-bg-primary">
  <Header />
  <div class="flex flex-1 overflow-hidden">
    {#if $assets.length > 0}
      <FileList />
      <MetadataEditor />
    {:else}
      <CsvImport />
    {/if}
  </div>
</div>
