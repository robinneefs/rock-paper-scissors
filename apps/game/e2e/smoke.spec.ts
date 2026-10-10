import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __rps: { scenes: () => string[]; phase: () => string | null };
  }
}

const scenes = (page: Page) => page.evaluate(() => window.__rps.scenes());
const phase = (page: Page) => page.evaluate(() => window.__rps.phase());

test('boots to the logo, the home menu, and plays an exchange against the CPU', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.clock.install();
  await page.goto('http://localhost:5174/');
  await page.clock.runFor(300);
  expect(await scenes(page)).toContain('Logo');

  await page.clock.runFor(3200);
  expect(await scenes(page)).toContain('Home');

  await page.keyboard.press('Enter'); // START GAME (VS CPU)
  await page.clock.runFor(600);
  expect(await scenes(page)).toContain('Fight');
  expect(await phase(page)).toBe('roundIntro');

  await page.clock.runFor(1800);
  expect(await phase(page)).toBe('picking');
  await page.keyboard.press('Digit2'); // Throw
  await page.clock.runFor(5000);
  expect(await phase(page)).toBe('reveal');

  await page.clock.runFor(2000);
  expect(['picking', 'roundOver']).toContain(await phase(page));
  expect(errors).toEqual([]);
});

test('the logo can be skipped with any button', async ({ page }) => {
  await page.clock.install();
  await page.goto('http://localhost:5174/');
  await page.clock.runFor(300);
  await page.keyboard.press('Digit1');
  await page.clock.runFor(400);
  expect(await scenes(page)).toContain('Home');
});
