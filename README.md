# Estimation Board

A CustomAgile Rally widget built with React, TypeScript, and widget-ai.

---

## Quick Start

```bash
npm install        # install dependencies
npm run dev        # start dev server on http://localhost:5173
```

Open http://localhost:5173 in your browser. The widget runs in mock mode by default — no Rally connection needed to start developing.

Edit `src/App.tsx` to build your widget. Changes hot-reload instantly.

---

## Prerequisites

### Node.js

Node.js 18+ is required. Download from [nodejs.org](https://nodejs.org/).

### GitHub Packages Authentication

The `@customagile/widget-ai` package is hosted on GitHub Packages. You need a one-time setup to authenticate.

**Step 1 — Create a GitHub Personal Access Token:**

1. Go to https://github.com/settings/tokens/new
2. Give it a name (e.g. "widget-ai")
3. Select the `read:packages` scope
4. Generate and copy the token

**Step 2 — Add it to your global `.npmrc`:**

| OS | File location |
|----|---------------|
| macOS | `/Users/<username>/.npmrc` |
| Windows | `C:\Users\<username>\.npmrc` |

Create the file if it doesn't exist. Add these two lines:

```
@customagile:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_your_token_here
```

Alternatively, use an environment variable to keep the token out of the file:

```
@customagile:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

Then set `NPM_TOKEN` in your shell profile:

- **macOS:** Add `export NPM_TOKEN=ghp_your_token` to `~/.zshrc` (or `~/.bashrc`), then `source ~/.zshrc`
- **Windows:** Run `setx NPM_TOKEN ghp_your_token` in Command Prompt, then restart your terminal

Once configured, `npm install` will work for all `@customagile/*` packages.

---

## Creating a New Widget

```bash
npx @customagile/widget-ai init my-widget
cd my-widget
npm run dev
```

That's it. You get a working widget project with everything configured.

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload. Mock data by default. Add `?live=true` to URL for Rally data. |
| `npm run build` | Production build → `dist/app.js`. IIFE format ready for Rally Custom Views. |
| `npm run build:mock` | Production build with mock data baked in (no Rally connection needed at runtime). |
| `npm run typecheck` | TypeScript type checking without emitting files. |
| `npm run storybook` | Browse all widget-ai components interactively on http://localhost:6006. |
| `npx widget-ai deploy` | Build and deploy to Rally as a Custom View. Requires `auth.json`. |

---

## VS Code Integration

This project includes VS Code configuration out of the box.

### Tasks (Terminal > Run Task)

| Task | Shortcut | Description |
|------|----------|-------------|
| **Dev Server** | — | Starts the dev server with hot reload |
| **Build** | `Ctrl+Shift+B` | Production build (default build task) |
| **Build (Mock)** | — | Production build with mock data |
| **Type Check** | — | Run TypeScript checks |

### Debug (Run & Debug sidebar)

**Debug Widget** — starts the dev server and opens Chrome with DevTools attached. Set breakpoints in your `.tsx` files and they work.

### Recommended Extensions

When you open this project, VS Code will prompt you to install recommended extensions:

| Extension | What it does |
|-----------|-------------|
| ESLint | Catches bugs and enforces code style |
| Prettier | Auto-formats code on save |
| CSS Variable Autocomplete | Autocompletes `--ca-*` design tokens |
| Error Lens | Shows errors inline in the editor |
| Vite | Status bar indicator and server controls |

---

## Connecting to Rally (Live Data)

To use live Rally data during development:

1. Create `auth.json` in this directory:

```json
{
  "server": "https://rally1.rallydev.com",
  "apiKey": "your-rally-api-key"
}
```

2. Start the dev server: `npm run dev`
3. Visit http://localhost:5173?live=true

The dev server proxies `/slm/*` requests to your Rally server using the API key. The `auth.json` file is gitignored — your credentials stay local.

**Getting a Rally API key:** In Rally, go to your profile (top-right avatar) > API Keys > Create. Copy the full key string.

---

## Project Structure

```
estimation-board/
├── .vscode/               ← VS Code tasks, debug config, extension recommendations
├── src/
│   ├── App.tsx            ← your widget component (start here)
│   └── main.tsx           ← entry point (mounts App, handles Rally context)
├── dist/                  ← build output (gitignored)
├── auth.json              ← Rally credentials (gitignored, you create this)
├── .npmrc                 ← GitHub Packages registry config
├── rally.config.json      ← widget name, version, build settings
├── vite.config.js         ← build and dev server configuration
├── index.html             ← HTML shell
├── package.json
├── tsconfig.json
└── README.md              ← you are here
```

---

## Deploying to Rally

After building, deploy `dist/app.js` as a Rally Custom View:

1. Run `npm run build`
2. Copy the contents of `dist/app.js`
3. In Rally, create a Custom HTML page and paste the built code

For more details, see the [CustomAgile deployment guide](https://github.com/CustomAgile/RallyAppUpdateTemplate).

---

## widget-ai Reference

The `@customagile/widget-ai` package gives you everything you need to build Rally widgets:

### Components

Ready-to-use React components styled with the CustomAgile design system:

- **Grid** — sortable data table with column chooser, Excel/CSV export
- **CardBoard** — kanban board with drag-and-drop, swim lanes, inline editing
- **ComboBox** — dropdown with search, auto-populates from Rally AllowedValues
- **Button** — primary, secondary, and minimal variants
- **Checkbox**, **TextInput** — form inputs
- **Toast** — notification system
- **EditModePanel** — widget settings UI
- **AppFooter** — version display bar

### Data Layer

Functions for querying and modifying Rally data:

```tsx
import { wsapiQuery, wsapiCreate, wsapiUpdate, wsapiDelete } from '@customagile/widget-ai/data/wsapi';
import { queryLookback } from '@customagile/widget-ai/data/lookback';

// Query stories in the current iteration
const stories = await wsapiQuery('hierarchicalrequirement', {
  query: '(Iteration.Name = "Sprint 1")',
  fetch: 'FormattedID,Name,ScheduleState,PlanEstimate',
  order: 'Rank',
});
```

### Types

Full TypeScript definitions for all Rally artifacts:

```tsx
import type { HierarchicalRequirement } from '@customagile/widget-ai/types/rally-artifacts';
import type { Feature, Epic } from '@customagile/widget-ai/types/rally-artifacts';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
```

### Styles

Design tokens for consistent theming:

```tsx
import '@customagile/widget-ai/styles/tokens.css';    // base tokens (spacing, typography, density)
import '@customagile/widget-ai/styles/grid.css';       // grid component styles
```

Use `--ca-*` CSS custom properties in your styles:

```css
.my-component {
  font-family: var(--ca-font-family);
  color: var(--ca-text-primary);
  padding: var(--ca-spacing-md);
  border-radius: var(--ca-radius-md);
}
```

Dark mode and density (compact/comfortable) are handled automatically through the token system.

---

## Getting Help

- **widget-ai source:** [GitHub](https://github.com/CustomAgile/RallyAppUpdateTemplate/tree/master/packages/widget-sdk)
- **Rally WSAPI docs:** [Broadcom TechDocs](https://techdocs.broadcom.com/us/en/ca-enterprise-software/valueops/rally/rally-help/reference/rally-web-services-api.html)
- **Questions:** Contact your CustomAgile representative
