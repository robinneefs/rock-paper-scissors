import { defineConfig } from 'vite';

export default defineConfig({
  // relative paths so the build also works from a sub-folder (GitHub Pages later)
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 1600 },
});
