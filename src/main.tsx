/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import { createRoot } from 'react-dom/client';
import React, { useMemo } from 'react';
import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { DevHarness } from '@customagile/widget-ai/components/DevHarness';
import App from './App';
import { createRallyProvider } from './data-provider';

declare const $RallyContext: RallyContext | undefined;

// In Rally, $RallyContext is injected by the Custom HTML Widget iframe.
// In local dev, fall back to DEFAULT_RALLY_CONTEXT and let DevHarness
// pick the active project against the live Rally server (via the
// Vite dev-server proxy + auth.json).
const initialContext: RallyContext =
  typeof $RallyContext !== 'undefined' ? $RallyContext : DEFAULT_RALLY_CONTEXT;

function AppHost({ ctx }: { ctx: RallyContext }) {
  // Rebuild the provider whenever the harness changes the context so
  // live data reflects the new project scope.
  const data = useMemo(() => createRallyProvider(ctx), [ctx]);
  return <App rallyContext={ctx} data={data} />;
}

createRoot(document.getElementById('root')!).render(
  <DevHarness initialContext={initialContext}>
    {(ctx) => <AppHost ctx={ctx} />}
  </DevHarness>,
);
