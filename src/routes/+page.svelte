<script>
  import Header from '$lib/components/Header.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import MetadataEditor from '$lib/components/MetadataEditor.svelte';
</script>

<svelte:head>
  <title>Stock Metadata Editor</title>
  <meta name="description" content="Metadata editor for Adobe Stock & Shutterstock" />
</svelte:head>

<div class="flex flex-col h-screen overflow-hidden bg-bg-primary">
  <Header />
  <div class="flex flex-1 overflow-hidden">
    <FileList />
    <MetadataEditor />
  </div>
</div>
