<script>
  import Header from '$lib/components/Header.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import MetadataEditor from '$lib/components/MetadataEditor.svelte';
</script>

<svelte:head>
  <title>Stock Metadata Generator</title>
  <meta name="description" content="AI-powered Adobe Stock metadata generator" />
</svelte:head>

<div class="flex flex-col h-screen overflow-hidden bg-bg-primary">
  <Header />
  <div class="flex flex-1 overflow-hidden">
    <FileList />
    <MetadataEditor />
  </div>
</div>
