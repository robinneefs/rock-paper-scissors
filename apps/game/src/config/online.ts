/**
 * Where the online match server (apps/server, a Cloudflare Worker) lives.
 * - VITE_SERVER_URL overrides it (e.g. `VITE_SERVER_URL=wss://... npm run dev`).
 * - `npm run dev` uses a local server started with `npm run dev -w @rps/server`.
 * - Release builds use the deployed Worker; null hides online play (the menu shows SOON).
 */
const DEPLOYED_URL: string | null = null; // set once the Worker's workers.dev address is known

export const SERVER_URL: string | null =
  import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'ws://localhost:8787' : DEPLOYED_URL);
