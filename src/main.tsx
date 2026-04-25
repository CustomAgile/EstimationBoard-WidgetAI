/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import { createRoot } from 'react-dom/client';
import React from 'react';
import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import App from './App';
import { mockProvider, mockContext } from './mock-data';
import { createRallyProvider } from './data-provider';

// Required: tell TypeScript about compile-time and runtime globals.
declare const __USE_MOCK__: boolean | undefined;
declare const $RallyContext: RallyContext | undefined;

const useMock = typeof __USE_MOCK__ !== 'undefined' ? __USE_MOCK__ : true;

// Live branch: use $RallyContext injected by the Rally Custom HTML Widget iframe.
// Mock branch: use synthetic mockContext for local dev.
// App NEVER imports mock-data or data-provider directly — only main.tsx does.
const rallyContext: RallyContext = (!useMock && typeof $RallyContext !== 'undefined')
  ? $RallyContext
  : useMock ? mockContext : DEFAULT_RALLY_CONTEXT;

const data = useMock ? mockProvider : createRallyProvider(rallyContext);

createRoot(document.getElementById('root')!).render(
  <App rallyContext={rallyContext} data={data} />,
);
