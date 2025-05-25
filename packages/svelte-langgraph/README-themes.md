# Theme System Documentation

The svelte-langgraph package now supports a comprehensive theme system that allows you to customize the visual appearance of all components while maintaining full functionality.

## Quick Start

### Basic Usage with Default Theme

```svelte
<script>
  import { LangGraphFrontend } from 'svelte-langgraph';
</script>

<!-- Uses default theme automatically -->
<LangGraphFrontend userId="your-user-id" />
```

### Using Flowbite Theme

```svelte
<script>
  import { LangGraphFrontend, ThemeProvider, flowbiteTheme } from 'svelte-langgraph';
</script>

<svelte:head>
  <!-- Include Flowbite CSS -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css" rel="stylesheet" />
</svelte:head>

<ThemeProvider theme={flowbiteTheme}>
  <LangGraphFrontend userId="your-user-id" />
</ThemeProvider>
```

### Custom Theme Override

```svelte
<script>
  import { LangGraphFrontend, ThemeProvider, defaultTheme } from 'svelte-langgraph';
  
  const customTheme = {
    ...defaultTheme,
    messageUser: "bg-purple-600 text-white p-4 rounded-xl ml-auto max-w-md mb-3",
    sendButton: "bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded"
  };
</script>

<ThemeProvider theme={customTheme}>
  <LangGraphFrontend userId="your-user-id" />
</ThemeProvider>
```

## Available Themes

### 1. Default Theme
- **Framework**: Tailwind CSS
- **Style**: Clean, minimal design
- **Usage**: Automatically applied when no theme is specified

```javascript
import { defaultTheme } from 'svelte-langgraph';
```

### 2. Flowbite Theme
- **Framework**: Flowbite (based on Tailwind)
- **Style**: Professional design system with components
- **Features**: Dark mode support, responsive layout
- **Usage**: Requires Flowbite CSS to be included

```javascript
import { flowbiteTheme } from 'svelte-langgraph';
```

### 3. Flowbite Variants
- **Primary**: Standard Flowbite theme
- **Dark**: Dark mode optimized
- **Compact**: Smaller spacing for dense layouts

```javascript
import { createFlowbiteTheme } from 'svelte-langgraph';

const darkTheme = createFlowbiteTheme('dark');
const compactTheme = createFlowbiteTheme('compact');
```

## Theme Structure

Each theme is an object that defines CSS classes for all UI elements:

```typescript
interface ChatTheme {
  // Main containers
  container: string;
  sidebar: string;
  chatArea: string;
  
  // Messages
  messageContainer: string;
  messageUser: string;
  messageAssistant: string;
  messageSystem: string;
  
  // Input area
  inputContainer: string;
  inputField: string;
  sendButton: string;
  sendButtonDisabled: string;
  
  // Components
  endpointSelector: string;
  configPanel: string;
  conversationList: string;
  
  // States
  loading: string;
  error: string;
  success: string;
  // ... and many more
}
```

## Creating Custom Themes

### Method 1: Extending Existing Themes

```javascript
import { defaultTheme } from 'svelte-langgraph';

const myTheme = {
  ...defaultTheme,
  container: "flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100",
  messageUser: "bg-blue-600 text-white p-4 rounded-lg ml-auto max-w-sm mb-2",
  messageAssistant: "bg-white border border-gray-300 p-4 rounded-lg mr-auto max-w-sm mb-2",
  sendButton: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
};
```

### Method 2: Framework-Specific Themes

#### Bootstrap Theme Example
```javascript
const bootstrapTheme = {
  container: "d-flex vh-100",
  sidebar: "border-end p-3",
  chatArea: "flex-grow-1 d-flex flex-column",
  messageUser: "alert alert-primary text-end",
  messageAssistant: "alert alert-secondary",
  sendButton: "btn btn-primary",
  // ... rest of Bootstrap classes
};
```

#### Material-UI Theme Example
```javascript
const materialTheme = {
  container: "MuiContainer-root MuiContainer-maxWidthLg",
  messageUser: "MuiPaper-root MuiPaper-elevation1 user-message",
  messageAssistant: "MuiPaper-root MuiPaper-elevation1 assistant-message",
  sendButton: "MuiButton-root MuiButton-contained MuiButton-containedPrimary",
  // ... rest of Material-UI classes
};
```

## Advanced Features

### Theme Variants

Use theme variants for different modes:

```svelte
<script>
  import { ThemeProvider, flowbiteThemeVariant } from 'svelte-langgraph';
  
  let isDark = false;
  
  $: currentTheme = isDark 
    ? { ...flowbiteThemeVariant.primary, ...flowbiteThemeVariant.dark }
    : flowbiteThemeVariant.primary;
</script>

<button onclick={() => isDark = !isDark}>Toggle Dark Mode</button>

<ThemeProvider theme={currentTheme}>
  <LangGraphFrontend userId="your-user-id" />
</ThemeProvider>
```

### Runtime Theme Overrides

```svelte
<script>
  import { ThemeProvider, defaultTheme } from 'svelte-langgraph';
  
  let accentColor = 'blue';
  
  $: themeOverride = {
    messageUser: `bg-${accentColor}-600 text-white p-4 rounded-lg ml-auto max-w-sm mb-2`,
    sendButton: `bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white py-2 px-4 rounded`
  };
</script>

<input bind:value={accentColor} placeholder="Accent color" />

<ThemeProvider theme={defaultTheme} override={themeOverride}>
  <LangGraphFrontend userId="your-user-id" />
</ThemeProvider>
```

## Migration Guide

### From Previous Version

If you're using the components without themes, no changes are required:

```svelte
<!-- This continues to work exactly as before -->
<LangGraphFrontend userId="your-user-id" />
```

### Gradual Migration

You can start using themes gradually:

1. **Start with default theme** (no changes needed)
2. **Add minor customizations** using theme overrides
3. **Switch to a different framework theme** when ready
4. **Create fully custom themes** as needed

## Performance Considerations

- Themes are applied at build time - no runtime performance impact
- Theme switching requires component re-render
- Use CSS variables for dynamic theming when possible

## Troubleshooting

### Theme Not Applied
- Ensure `ThemeProvider` wraps your components
- Check that theme object has required properties
- Verify CSS framework is properly loaded

### Styling Conflicts
- Check CSS specificity order
- Ensure framework CSS is loaded before custom styles
- Use browser dev tools to inspect applied classes

### TypeScript Errors
```typescript
// Properly type your custom theme
import type { ChatTheme } from 'svelte-langgraph';

const myTheme: ChatTheme = {
  // TypeScript will help ensure all properties are included
  // ...
};
```

## Examples

See the `/examples/dashboard/src/routes/flowbite/` directory for a complete Flowbite integration example.

## Contributing Themes

We welcome contributions of new themes! Please:
1. Follow the theme interface exactly
2. Test with all component variations
3. Include documentation and examples
4. Support both light and dark modes when applicable