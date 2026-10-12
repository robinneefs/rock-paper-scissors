// Lint rules, including the layer import rules from docs/architecture/ARCHITECTURE.md (section 12):
// a wrong import between layers fails the build instead of eroding quietly.
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

const game = 'apps/game/src';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.wrangler/**',
      // the Android native project (Capacitor copies the built game into it)
      'apps/android/android/**',
      '**/node_modules/**',
      'docs/**',
      'sources/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: { import: importPlugin },
    settings: { 'import/resolver': { node: { extensions: ['.ts', '.js'] } } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Core: nothing outside itself
            { target: 'packages/core/src', from: 'apps', message: 'Core must not import from the game.' },
            // Session: core and util only
            {
              target: `${game}/session`,
              from: [
                `${game}/scenes`,
                `${game}/views`,
                `${game}/fight`,
                `${game}/fx`,
                `${game}/input`,
                `${game}/platform`,
              ],
              message: 'The session layer must not import presentation code.',
            },
            // Views and effects: no sessions
            {
              target: [`${game}/views`, `${game}/fx`],
              from: [`${game}/session`, `${game}/scenes`, `${game}/fight`],
              message: 'Views are dumb: no sessions, scenes or directors.',
            },
            // Director: never the referee directly
            {
              target: `${game}/fight`,
              from: [`${game}/scenes`],
              message: 'The director must not depend on scenes.',
            },
            // The dev tuning panel is loaded only by main.ts (dev builds); the game never depends on it
            {
              target: `${game}/!(dev)/**/*`,
              from: `${game}/dev`,
              message: 'Only main.ts loads the dev tuning panel.',
            },
            // Audio: plays sounds it is told to; knows nothing about matches or screens
            {
              target: `${game}/audio`,
              from: [`${game}/session`, `${game}/scenes`, `${game}/views`, `${game}/fight`],
              message: 'The audio service plays what it is told; no game logic.',
            },
            // Platform: no game logic
            {
              target: `${game}/platform`,
              from: [`${game}/session`, `${game}/scenes`, `${game}/views`, `${game}/fight`],
              message: 'Platform adapters hold no game logic.',
            },
          ],
        },
      ],
    },
  },
  {
    // Core and session must stay engine-free: no Phaser, no DOM-bound game code.
    files: ['packages/core/src/**/*.ts', `${game}/session/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'phaser', message: 'Core and session code must not use Phaser.' }] },
      ],
    },
  },
  {
    // The director talks to the session interface, never to the referee.
    files: [`${game}/fight/**/*.ts`, `${game}/scenes/**/*.ts`, `${game}/views/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@rps/core',
              importNames: ['Referee'],
              message: 'Talk to a MatchSession, not the Referee.',
            },
          ],
        },
      ],
    },
  },
);
