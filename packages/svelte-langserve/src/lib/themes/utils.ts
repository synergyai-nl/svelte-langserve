import { getContext, setContext } from 'svelte';
import type { ChatTheme, ThemeContext, ThemeConfig, ThemeOverride } from './types.js';
import { defaultTheme, defaultThemeConfig } from './default.js';

/**
 * Theme context key for Svelte context
 */
const THEME_CONTEXT_KEY = 'svelte-langserve-theme';

/**
 * Get the current theme from Svelte context
 * Falls back to default theme if no context is found
 */
export function useTheme(): ChatTheme {
  const context = getContext<ThemeContext>(THEME_CONTEXT_KEY);
  
  if (!context) {
    // Return default theme if no context found
    return defaultTheme;
  }
  
  // Apply overrides if provided
  if (context.override) {
    return {
      ...context.theme,
      ...context.override,
    };
  }
  
  return context.theme;
}

/**
 * Get the full theme context (includes config and variant info)
 */
export function useThemeContext(): ThemeContext {
  const context = getContext<ThemeContext>(THEME_CONTEXT_KEY);
  
  if (!context) {
    return {
      theme: defaultTheme,
      config: defaultThemeConfig,
    };
  }
  
  return context;
}

/**
 * Create and set theme context in Svelte
 */
export function createThemeContext(
  theme: ChatTheme,
  config: ThemeConfig,
  variant?: 'primary' | 'dark' | 'compact' | 'mobile',
  override?: ThemeOverride
): ThemeContext {
  const context: ThemeContext = {
    theme,
    config,
    variant,
    override,
  };
  
  setContext(THEME_CONTEXT_KEY, context);
  return context;
}

/**
 * Merge multiple theme overrides
 */
export function mergeThemeOverrides(...overrides: (ThemeOverride | undefined)[]): ThemeOverride {
  return overrides.reduce((merged, override) => {
    if (override) {
      return { ...merged, ...override };
    }
    return merged;
  }, {});
}

/**
 * Helper to conditionally apply theme classes
 */
export function themeClass(
  theme: ChatTheme,
  key: keyof ChatTheme,
  condition: boolean = true,
  fallback: string = ''
): string {
  if (!condition) {
    return fallback;
  }
  
  return theme[key] || fallback;
}

/**
 * Helper to combine theme classes with additional classes
 */
export function combineClasses(
  themeClass: string,
  additionalClasses: string = '',
  condition: boolean = true
): string {
  if (!condition) {
    return '';
  }
  
  return [themeClass, additionalClasses].filter(Boolean).join(' ');
}

/**
 * Get responsive classes based on breakpoint
 */
export function getResponsiveClasses(
  theme: ChatTheme,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): string {
  switch (breakpoint) {
    case 'mobile':
      return theme.mobile;
    case 'tablet':
      return theme.tablet;
    case 'desktop':
      return theme.desktop;
    default:
      return '';
  }
}

/**
 * Validate theme object has required properties
 */
export function validateTheme(theme: Partial<ChatTheme>): theme is ChatTheme {
  if (!theme || typeof theme !== 'object') {
    return false;
  }
  
  const requiredKeys: (keyof ChatTheme)[] = [
    'container',
    'chatArea',
    'messageContainer',
    'messageUser',
    'messageAssistant',
    'inputContainer',
    'inputField',
    'sendButton',
  ];
  
  return requiredKeys.every(key => key in theme && typeof theme[key] === 'string');
}

/**
 * Create a theme with safe fallbacks
 */
export function createSafeTheme(theme: Partial<ChatTheme>): ChatTheme {
  return {
    ...defaultTheme,
    ...theme,
  };
}