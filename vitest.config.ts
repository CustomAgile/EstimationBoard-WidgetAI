/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    setupFiles: ['../../vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@customagile/widget-ai': resolve(__dirname, '../../packages/create-widget'),
    },
  },
});
