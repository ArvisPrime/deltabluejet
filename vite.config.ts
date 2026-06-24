import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build version hash — unique per build, used for service worker cache busting
const buildVersion = Date.now().toString(36);

/**
 * Custom Vite plugin to inject the build version into the service worker.
 * Files in public/ are copied as-is by Vite, so we post-process the output.
 */
function serviceWorkerVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist', 'service-worker.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        content = content.replace(/__BUILD_TIMESTAMP__/g, buildVersion);
        fs.writeFileSync(swPath, content);
      }
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), serviceWorkerVersionPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Strip console.log and console.debug from production builds.
  // console.warn and console.error are preserved intentionally.
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // NOTE: 'recharts' is intentionally NOT listed here.
          // It was previously modulepreloaded on every page (~393 KB)
          // even though charts are only used on admin dashboards.
          // Vite now naturally code-splits it into lazy-loaded chunks.
        },
      },
    },
  },
});
