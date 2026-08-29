<script>
  import Header from '$lib/components/Header.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import MetadataEditor from '$lib/components/MetadataEditor.svelte';
</script>

<svelte:head>
  <title>Adobe Stock Metadata Generator</title>
  <meta name="description" content="Auto-generate Adobe Stock metadata for your photos using AI" />
</svelte:head>

<div class="flex flex-col h-screen overflow-hidden">
  <Header />
  <div class="flex flex-1 overflow-hidden">
    <FileList />
    <MetadataEditor />
  </div>
</div>
