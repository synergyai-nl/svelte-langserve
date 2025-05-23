<script lang="ts">
  import { availableEndpoints, endpointHealth, testEndpoint, getEndpointSchemas } from '@svelte-langserve/core';

  let selectedEndpoints: string[] = [];
  let showEndpointDetails = false;

  function getEndpointStatus(endpointId: string) {
    const health = $endpointHealth.get(endpointId);
    return health === undefined ? 'unknown' : health ? 'healthy' : 'unhealthy';
  }

  function toggleEndpoint(endpointId: string, checked: boolean) {
    if (checked) {
      selectedEndpoints = [...selectedEndpoints, endpointId];
    } else {
      selectedEndpoints = selectedEndpoints.filter(id => id !== endpointId);
    }
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

  {#if $availableEndpoints.length === 0}
    <div class="text-gray-500 text-sm py-2">No endpoints available</div>
  {:else}
    <div class="space-y-3">
      {#each $availableEndpoints as endpoint (endpoint.id)}
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
              <div class="text-xs {
                getEndpointStatus(endpoint.id) === 'healthy' ? 'text-green-600' :
                getEndpointStatus(endpoint.id) === 'unhealthy' ? 'text-red-600' : 'text-gray-500'
              }">
                Status: {getEndpointStatus(endpoint.id)}
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
              on:click={() => testEndpoint(endpoint.id)}
              class="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded"
            >
              Test
            </button>
            <button
              on:click={() => getEndpointSchemas(endpoint.id)}
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

<slot selectedEndpoints={selectedEndpoints}></slot>