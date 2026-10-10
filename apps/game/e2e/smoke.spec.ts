import { expect, test, type Page } from '@playwright/test';
import pkg from '../package.json' with { type: 'json' };

declare global {
  interface Window {
    __rps: { scenes: () => string[]; phase: () => string | null; scale: () => number; version: string };
  }
}

const scenes = (page: Page) => page.evaluate(() => window.__rps.scenes());
const phase = (page: Page) => page.evaluate(() => window.__rps.phase());
const scale = (page: Page) => page.evaluate(() => window.__rps.scale());

/**
 * Advances the fake clock in small steps. One big runFor() lets the browser run the game's frames
 * with large gaps, and Phaser clamps big frame deltas, so game time falls behind the clock.
 */
async function run(page: Page, ms: number): Promise<void> {
  for (let left = ms; left > 0; left -= 50) await page.clock.runFor(Math.min(50, left));
}

/** Runs the clock until a screen is showing and its wipe has finished (input is ignored mid-wipe). */
async function untilScene(page: Page, key: string, maxMs = 5000): Promise<void> {
  for (let t = 0; t < maxMs && !(await scenes(page)).includes(key); t += 50) await run(page, 50);
  expect(await scenes(page)).toContain(key);
  await run(page, 300);
}

/**
 * Advances the fake clock in small steps. One big runFor() lets the browser run the game's frames
 * with large gaps, and Phaser clamps big frame deltas, so game time falls behind the clock.
 */
async function run(page: Page, ms: number): Promise<void> {
  for (let left = ms; left > 0; left -= 50) await page.clock.runFor(Math.min(50, left));
}

test('boots to the logo, the home menu, and plays an exchange against the CPU', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.clock.install();
  await page.goto('http://localhost:5174/');
  await run(page, 300);
  expect(await scenes(page)).toContain('Logo');

  await run(page, 3200); // the logo leaves on its own (about 2.7s)
  expect(await scenes(page)).toContain('Home');

  await page.keyboard.press('Enter'); // START GAME (VS CPU)
  await run(page, 600);
  expect(await scenes(page)).toContain('Fight');
  expect(await phase(page)).toBe('roundIntro');

  await run(page, 1800);
  expect(await phase(page)).toBe('picking');
  await page.keyboard.press('Digit2'); // Throw
  await run(page, 5000);
  expect(await phase(page)).toBe('reveal');

  await run(page, 2000);
  expect(['picking', 'roundOver']).toContain(await phase(page));
  expect(errors).toEqual([]);
});

test('the build shows the version from package.json', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  expect(await page.evaluate(() => window.__rps.version)).toBe(pkg.version);
});

test('the logo can be skipped with any button', async ({ page }) => {
  await page.clock.install();
  await page.goto('http://localhost:5174/');
  await run(page, 300);
  await page.keyboard.press('Digit1');
  await run(page, 400);
  expect(await scenes(page)).toContain('Home');
});

test('options switches scaling to fill height and remembers it after a reload', async ({ page }) => {
  await page.clock.install();
  await page.goto('http://localhost:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1'); // skip the logo
  await untilScene(page, 'Home');
  expect(await scale(page)).toBe(2); // 600 x 1000 window: whole-number 2x

  await page.keyboard.press('ArrowDown'); // ONLINE is greyed out, so the cursor lands on OPTIONS
  await page.keyboard.press('Enter');
  await untilScene(page, 'Options');

  await page.keyboard.press('Enter'); // SCALING: PIXEL PERFECT -> FILL HEIGHT
  await run(page, 100);
  expect(await scale(page)).toBeCloseTo(1000 / 472, 3);

  await page.reload();
  await untilScene(page, 'Logo');
  expect(await scale(page)).toBeCloseTo(1000 / 472, 3);

  await page.keyboard.press('Digit1');
  await untilScene(page, 'Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await untilScene(page, 'Options');
  await page.keyboard.press('ArrowRight'); // flips back to PIXEL PERFECT
  await run(page, 100);
  expect(await scale(page)).toBe(2);
  await page.keyboard.press('Escape');
  await untilScene(page, 'Home');
});
