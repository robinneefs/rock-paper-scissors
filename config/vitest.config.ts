import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // this file lives in config/, so point the test root back at the repo root
    root: fileURLToPath(new URL('..', import.meta.url)),
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
  },
});
