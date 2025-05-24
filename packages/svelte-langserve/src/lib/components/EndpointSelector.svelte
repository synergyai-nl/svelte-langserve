<script lang="ts">
  import type { LangServeEndpoint } from '../types.js';

  let { 
    endpoints = [],
    selectedEndpoints = [],
    onSelectionChange = () => {},
    onTest = () => {},
    onGetSchemas = () => {}
  }: {
    endpoints?: LangServeEndpoint[];
    selectedEndpoints?: string[];
    onSelectionChange?: (selected: string[]) => void;
    onTest?: (endpointId: string) => void;
    onGetSchemas?: (endpointId: string) => void;
  } = $props();

  let showEndpointDetails = $state(false);

  function toggleEndpoint(endpointId: string, checked: boolean) {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedEndpoints, endpointId];
    } else {
      newSelected = selectedEndpoints.filter(id => id !== endpointId);
    }
    onSelectionChange(newSelected);
  }
</script>

<div class="p-4 border border-gray-200 rounded-lg mb-4">
  <div class="flex justify-between items-center mb-2">
    <h3 class="text-lg font-semibold">Available Endpoints</h3>
    <button 
      on:click={() => showEndpointDetails = !showEndpointDetails}
      class="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
    >
      {showEndpointDetails ? 'Hide' : 'Show'} Details
    </button>
  </div>

  {#if endpoints.length === 0}
    <div class="text-gray-500 text-sm py-2">No endpoints available</div>
  {:else}
    <div class="space-y-3">
      {#each endpoints as endpoint (endpoint.id)}
        <div class="p-2 border border-gray-200 rounded-md">
          <label class="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={selectedEndpoints.includes(endpoint.id)}
              on:change={(e) => toggleEndpoint(endpoint.id, e.currentTarget.checked)}
              class="mt-1 mr-3"
            />
            <div class="flex-1">
              <div class="font-medium">{endpoint.name}</div>
              <div class="text-xs text-gray-500">
                Type: {endpoint.type}
              </div>
              {#if showEndpointDetails}
                <div class="text-xs text-gray-600 mt-1">
                  {#if endpoint.description}<div>{endpoint.description}</div>{/if}
                  <div>URL: {endpoint.url}</div>
                </div>
              {/if}
            </div>
          </label>
          <div class="mt-2 flex space-x-2">
            <button
              on:click={() => onTest(endpoint.id)}
              class="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded"
            >
              Test
            </button>
            <button
              on:click={() => onGetSchemas(endpoint.id)}
              class="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded"
            >
              Schemas
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>