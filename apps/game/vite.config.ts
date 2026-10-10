import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // relative paths so the build also works from a sub-folder (GitHub Pages later)
  base: './',
  // the build's version, from this package's package.json (the one place it is set)
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 1600 },
});
