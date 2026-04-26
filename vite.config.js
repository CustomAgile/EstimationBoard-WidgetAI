/**
 * Vite configuration for Estimation Board.
 *
 * Dev server: npm run dev
 *   - Proxies /slm/* (WSAPI) and /analytics/* (LBAPI) to Rally
 *     (requires auth.json in project root)
 *   - Always runs against live Rally data — no mock branch
 *
 * Production build: npm run build
 *   - Outputs IIFE bundle to dist/app.js
 *   - React loaded from CDN (not bundled)
 */

import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';

/**
 * Inlines all CSS into the JS bundle as a <style> injection script.
 * Required for Rally Custom View deploy — the deploy script only reads dist/app.js,
 * so CSS must be embedded in the bundle rather than emitted as a separate file.
 */
function cssInlinePlugin() {
  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      const cssChunks = [];
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css')) {
          cssChunks.push(chunk.source);
          delete bundle[fileName];
        }
      }
      if (cssChunks.length === 0) return;
      const css = cssChunks.join('\n').replace(/`/g, '\\`').replace(/\\/g, '\\\\');
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = `(function(){var s=document.createElement('style');s.textContent=\`${css}\`;document.head.appendChild(s)})();\n` + chunk.code;
        }
      }
    },
  };
}

const rallyConfig = JSON.parse(readFileSync('./rally.config.json', 'utf-8'));
const appVersion = (rallyConfig.version || '0.0.0') + '-' + (rallyConfig.build || 0);

/**
 * Load auth.json for dev server proxy.
 * Create auth.json in this directory with:
 *   { "server": "https://rally1.rallydev.com", "apiKey": "your-api-key" }
 */
function getAuth() {
  try {
    if (existsSync('./auth.json')) {
      return JSON.parse(readFileSync('./auth.json', 'utf-8'));
    }
  } catch { /* ignore */ }
  return { server: '', apiKey: '' };
}

const auth = getAuth();
const bundleReact = !!rallyConfig.bundleReact;

export default defineConfig({
  plugins: [cssInlinePlugin()],

  // Ensure react-dom CommonJS modules are pre-bundled by esbuild.
  // Without this, Vite's dev server fails to resolve named exports like
  // createPortal from SDK components that import from react-dom transitively.
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },

  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: './src/main.tsx',
      ...(bundleReact ? {} : {
        external: ['react', 'react-dom', 'react-dom/client'],
      }),
      output: {
        format: 'iife',
        entryFileNames: 'app.js',
        ...(bundleReact ? {} : {
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
            'react-dom/client': 'ReactDOM',
          },
        }),
      },
    },
  },

  server: {
    open: false,
    port: 5173,
    proxy: auth.server ? (() => {
      const proxyEntry = {
        target: auth.server,
        changeOrigin: true,
        headers: {
          'ZSESSIONID': auth.apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };
      // /slm/*       — WSAPI + Rally chrome (avatars, profile images)
      // /analytics/* — LBAPI (Lookback / snapshot store)
      return { '/slm': proxyEntry, '/analytics': proxyEntry };
    })() : undefined,
  },
});
