<script lang="ts">
  import type { ChatTheme, ThemeConfig, ThemeOverride } from '../themes/types.js';
  import { createThemeContext, createSafeTheme, validateTheme } from '../themes/utils.js';
  import { defaultTheme, defaultThemeConfig } from '../themes/default.js';

  let { 
    theme = defaultTheme,
    config = defaultThemeConfig,
    variant = undefined,
    override = undefined,
    children
  }: {
    theme?: ChatTheme;
    config?: ThemeConfig;
    variant?: 'primary' | 'dark' | 'compact' | 'mobile';
    override?: ThemeOverride;
    children: import('svelte').Snippet;
  } = $props();
  
  // Create and update theme context reactively
  $effect(() => {
    // Validate and create safe theme
    let safeTheme: ChatTheme;
    if (!validateTheme(theme)) {
      console.warn('Invalid theme provided, falling back to default theme with overrides');
      safeTheme = createSafeTheme(theme);
    } else {
      safeTheme = theme;
    }
    
    // Apply overrides if provided
    const finalTheme = override ? { ...safeTheme, ...override } : safeTheme;
    createThemeContext(finalTheme, config, variant, override);
  });
</script>

{@render children()}