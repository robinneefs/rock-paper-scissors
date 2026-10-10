declare const __APP_VERSION__: string | undefined;

/** This build's version, from apps/game/package.json (injected by Vite). Bump it with every build. */
export const VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
