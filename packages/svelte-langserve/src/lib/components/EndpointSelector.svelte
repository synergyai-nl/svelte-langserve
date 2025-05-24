<script lang="ts">
  import type { LangServeEndpoint } from '../types.js';
  import { useTheme } from '../themes/utils.js';

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

  const theme = useTheme();
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

<div class={theme.endpointSelector}>
  <div class="flex justify-between items-center mb-2">
    <h3 class={theme.endpointSelectorLabel}>Available Endpoints</h3>
    <button 
      on:click={() => showEndpointDetails = !showEndpointDetails}
      class={theme.configButton}
    >
      {showEndpointDetails ? 'Hide' : 'Show'} Details
    </button>
  </div>

  {#if endpoints.length === 0}
    <div class={theme.emptyStateDescription}>No endpoints available</div>
  {:else}
    <div class="space-y-3">
      {#each endpoints as endpoint (endpoint.id)}
        <div class={selectedEndpoints.includes(endpoint.id) ? theme.endpointOptionSelected : theme.endpointOption}>
          <label class="flex items-start cursor-pointer w-full">
            <input
              type="checkbox"
              checked={selectedEndpoints.includes(endpoint.id)}
              on:change={(e) => toggleEndpoint(endpoint.id, e.currentTarget.checked)}
              class="mt-1 mr-3"
            />
            <div class="flex-1">
              <div class="font-medium">{endpoint.name}</div>
              <div class="text-xs opacity-70">
                Type: {endpoint.type}
              </div>
              {#if showEndpointDetails}
                <div class="text-xs opacity-60 mt-1">
                  {#if endpoint.description}<div>{endpoint.description}</div>{/if}
                  <div>URL: {endpoint.url}</div>
                </div>
              {/if}
            </div>
            <div class={theme.endpointHealth + ' ' + theme.endpointHealthy}></div>
          </label>
          <div class="mt-2 flex space-x-2">
            <button
              on:click={() => onTest(endpoint.id)}
              class={theme.testEndpointButton}
            >
              Test
            </button>
            <button
              on:click={() => onGetSchemas(endpoint.id)}
              class={theme.getSchemasButton}
            >
              Schemas
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>