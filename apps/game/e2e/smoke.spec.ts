import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __rps: { scenes: () => string[]; phase: () => string | null };
  }
}

const scenes = (page: Page) => page.evaluate(() => window.__rps.scenes());
const phase = (page: Page) => page.evaluate(() => window.__rps.phase());

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

test('the logo can be skipped with any button', async ({ page }) => {
  await page.clock.install();
  await page.goto('http://localhost:5174/');
  await run(page, 300);
  await page.keyboard.press('Digit1');
  await run(page, 400);
  expect(await scenes(page)).toContain('Home');
});
