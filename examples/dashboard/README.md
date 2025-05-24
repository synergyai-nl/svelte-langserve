# LangServe Frontend with Flowbite Theme

A SvelteKit-based dashboard for interacting with LangServe endpoints via Socket.IO, featuring beautiful Flowbite UI components and real-time chat interface for AI assistants.

## Features

- 🤖 **Real-time AI Chat** - Socket.IO integration with streaming responses
- 🎨 **Flowbite UI** - Beautiful, accessible components with dark mode support
- 🌍 **Internationalization** - Built-in i18n support with Paraglide
- ⚡ **Modern Stack** - SvelteKit + Tailwind CSS v4 + TypeScript
- 📱 **Responsive Design** - Works seamlessly across all devices

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Generate internationalization files
pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide

# Start development server
pnpm dev
```

Visit:
- `http://localhost:5173` - Main dashboard
- `http://localhost:5173/flowbite` - Flowbite theme demo

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run all tests (unit + e2e)
- `pnpm test:unit` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm check` - TypeScript type checking
- `pnpm lint` - Code linting
- `pnpm format` - Code formatting

### Tech Stack

- **Framework**: SvelteKit 2.x
- **UI Library**: Flowbite Svelte
- **Styling**: Tailwind CSS v4
- **Icons**: Flowbite Svelte Icons
- **Real-time**: Socket.IO
- **i18n**: Inlang Paraglide
- **Testing**: Vitest + Playwright
- **Type Safety**: TypeScript

### Flowbite Integration

This project includes a complete Flowbite theme integration:

1. **Components**: Access to all Flowbite Svelte components
2. **Configuration**: Tailwind CSS v4 with Flowbite plugin
3. **Dark Mode**: Automatic dark/light theme switching
4. **Icons**: Full Flowbite icon library
5. **Theme System**: Seamless integration with LangServe theming

Example usage:
```svelte
<script>
  import { Button, Card, Alert } from 'flowbite-svelte';
  import { CheckCircleSolid } from 'flowbite-svelte-icons';
</script>

<Alert>
  {#snippet icon()}<CheckCircleSolid class="h-4 w-4" />{/snippet}
  Success message with icon
</Alert>

<Card>
  <h3>Card Title</h3>
  <p>Card content with Flowbite styling</p>
  <Button color="blue">Action Button</Button>
</Card>
```

### Backend Integration

This frontend connects to a LangServe backend for AI capabilities. Ensure the backend is running:

```bash
cd ../langserve-backend
uv run serve
```

## Architecture

```
Browser ←→ SvelteKit Frontend ←→ Socket.IO ←→ LangServe Backend ←→ AI Models
                ↓
         Flowbite Components
                ↓
        Tailwind CSS Styling
```

## Contributing

1. Follow the existing code style
2. Run `pnpm check` and `pnpm lint` before committing
3. Write tests for new features
4. Update documentation as needed

## License

See the project root for license information.