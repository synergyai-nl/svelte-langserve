# Internationalization (i18n) Guide

This guide covers how to manage translations and internationalization in the Svelte-LangGraph project using [Inlang Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

## Overview

The project uses Inlang Paraglide for internationalization, which provides:
- Type-safe translations with full TypeScript support
- Automatic code generation from translation files
- Server-side rendering (SSR) support
- URL-based locale routing
- Runtime locale switching

## Project Structure

```
examples/dashboard/
├── project.inlang/
│   └── settings.json              # Inlang configuration
├── messages/                      # Translation source files
│   ├── en.json                   # English (base locale)
│   └── nl.json                   # Dutch translations
└── src/lib/paraglide/            # Generated files (gitignored)
    ├── runtime.js                # Runtime functions
    ├── server.js                 # Server middleware
    ├── messages.js               # Compiled messages
    └── messages/                 # Individual message modules
        ├── _index.js
        └── hello_world.js
```

## Configuration

### Inlang Settings

The internationalization is configured in `examples/dashboard/project.inlang/settings.json`:

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
  ],
  "plugin.inlang.messageFormat": {
    "pathPattern": "./messages/{locale}.json"
  },
  "baseLocale": "en",
  "locales": ["en", "nl"]
}
```

### Nx Integration

The dashboard project includes automated Paraglide compilation via Nx:

```json
{
  "targets": {
    "paraglide:compile": {
      "executor": "nx:run-commands", 
      "options": {
        "command": "paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide",
        "cwd": "examples/dashboard"
      }
    },
    "check": {
      "dependsOn": ["paraglide:compile", "svelte-langgraph:build"]
    },
    "build": {
      "dependsOn": ["paraglide:compile", "svelte-langgraph:build"] 
    },
    "lint": {
      "dependsOn": ["paraglide:compile"]
    }
  }
}
```

This ensures translations are compiled before TypeScript checking, building, and linting.

## Managing Translations

### Adding New Messages

1. **Add to English (base locale)** - `messages/en.json`:
```json
{
  "hello_world": "Hello {name}!",
  "welcome_message": "Welcome to our application",
  "button_save": "Save",
  "error_required_field": "This field is required"
}
```

2. **Add to other locales** - `messages/nl.json`:
```json
{
  "hello_world": "Hallo {name}!",
  "welcome_message": "Welkom bij onze applicatie", 
  "button_save": "Opslaan",
  "error_required_field": "Dit veld is verplicht"
}
```

3. **Compile translations**:
```bash
# Using nx (recommended)
nx run dashboard:paraglide:compile

# Or directly
cd examples/dashboard
pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide
```

### Using Translations in Components

```svelte
<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import { setLocale, getLocale } from '$lib/paraglide/runtime';
  
  let userName = 'Alice';
</script>

<!-- Use translations with parameters -->
<h1>{m.hello_world({ name: userName })}</h1>
<p>{m.welcome_message()}</p>

<!-- Locale switching -->
<div>
  <button onclick={() => setLocale('en')}>English</button>
  <button onclick={() => setLocale('nl')}>Nederlands</button>
</div>

<!-- Show current locale -->
<p>Current locale: {getLocale()}</p>
```

### Server-Side Integration

The project includes server-side middleware for locale handling:

```typescript
// In hooks.server.ts
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;
    
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
    });
  });
```

## Adding New Languages

1. **Update Inlang configuration**:
```json
{
  "baseLocale": "en",
  "locales": ["en", "nl", "fr", "de"]
}
```

2. **Create translation files**:
```bash
# Create new message files
touch messages/fr.json
touch messages/de.json
```

3. **Add translations**:
```json
// messages/fr.json
{
  "hello_world": "Bonjour {name}!",
  "welcome_message": "Bienvenue dans notre application"
}
```

4. **Recompile**:
```bash
nx run dashboard:paraglide:compile
```

5. **Update UI** to include new language options in locale switchers.

## URL-Based Routing

Paraglide supports URL-based locale routing:

- `example.com/` → English (base locale)
- `example.com/nl/` → Dutch
- `example.com/fr/` → French

The middleware automatically:
- Detects locale from URL
- Redirects to localized URLs when needed
- De-localizes URLs for internal routing

## Development Workflow

### Adding Translations During Development

1. **Edit message files** directly in `messages/*.json`
2. **Run compilation** (automatic via Nx dependencies)
3. **Use in components** with full TypeScript support
4. **Test locale switching** in browser

### TypeScript Integration

Paraglide generates TypeScript definitions automatically:

```typescript
// Auto-generated types ensure type safety
import { m } from '$lib/paraglide/messages.js';

// ✅ Correct - required parameter
m.hello_world({ name: 'User' })

// ❌ TypeScript error - missing parameter  
m.hello_world()

// ✅ Correct - no parameters needed
m.welcome_message()
```

### CI/CD Integration

The Nx setup ensures translations are compiled in CI:

```bash
# CI will automatically run:
nx run dashboard:paraglide:compile  # First
nx run dashboard:check              # Then type checking
nx run dashboard:build              # Then build
```

## Best Practices

### Message Organization

- **Use descriptive keys**: `button_save` instead of `btn1`
- **Group related messages**: `error_required_field`, `error_invalid_email`
- **Include context**: `nav_home`, `footer_home` for different "Home" buttons

### Parameter Usage

```json
{
  "user_profile": "Profile for {userName}",
  "items_count": "{count} {count, plural, one {item} other {items}}",
  "date_format": "Last updated: {date}"
}
```

### Performance Considerations

- **Generated files are gitignored** - only source files in `messages/` are tracked
- **Compilation is fast** - only runs when needed via Nx dependencies
- **Tree shaking works** - unused translations are removed in production builds

## Troubleshooting

### Common Issues

**TypeScript errors about missing modules:**
- Ensure `nx run dashboard:paraglide:compile` has been run
- Check that generated files exist in `src/lib/paraglide/`

**Locale not switching:**
- Verify locale is included in `project.inlang/settings.json`
- Check browser cookies/localStorage for stored locale
- Ensure server middleware is properly configured

**Build errors:**
- Run Paraglide compilation before building
- Check that all locales have the same message keys
- Verify JSON syntax in message files

### Debug Commands

```bash
# Check if Paraglide files exist
ls examples/dashboard/src/lib/paraglide/

# Manually compile translations
nx run dashboard:paraglide:compile

# Check TypeScript compilation
nx run dashboard:check

# View current locale in browser
# Open DevTools Console:
import('$lib/paraglide/runtime').then(r => console.log(r.getLocale()))
```

## Resources

- [Inlang Paraglide Documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- [SvelteKit Integration Guide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit)
- [Paraglide Runtime API](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/runtime)

For questions or issues, check the troubleshooting section above or refer to the main [troubleshooting guide](../advanced/troubleshooting.md).