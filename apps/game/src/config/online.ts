/**
 * Where the online match server (apps/server, a Cloudflare Worker) lives.
 * - VITE_SERVER_URL sets it at build time. The publish workflow (.github/workflows/pages.yml) passes
 *   the live server for production and the staging server for staging, once the repository variable
 *   CLOUDFLARE_WORKERS_SUBDOMAIN is set.
 * - The Android app (`npm run android`, built in Vite's `android` mode) plays against the live server.
 * - `npm run dev` uses a local server started with `npm run dev:server`.
 * - null hides online play (the menu shows SOON).
 */
export const SERVER_URL: string | null =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.MODE === 'android'
    ? 'wss://rps-rivals-server.ggenie.workers.dev'
    : import.meta.env.DEV
      ? 'ws://localhost:8787'
      : null);
