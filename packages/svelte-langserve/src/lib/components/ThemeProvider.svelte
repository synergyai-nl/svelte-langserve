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
    children: unknown;
  } = $props();
  
  // Validate and create safe theme
  let safeTheme = $derived(() => {
    if (!validateTheme(theme)) {
      console.warn('Invalid theme provided, falling back to default theme with overrides');
      return createSafeTheme(theme);
    }
    return theme;
  });
  
  // Apply overrides if provided
  let finalTheme = $derived(() => {
    if (override) {
      return { ...safeTheme, ...override };
    }
    return safeTheme;
  });
  
  // Create and set theme context
  let _themeContext = $derived(() => 
    createThemeContext(finalTheme, config, variant, override)
  );
</script>

{@render children()}