// Captures screenshots of the running game for the docs (docs/screenshots/).
// Usage, from the repository root: node sources/screenshots/capture.mjs [seed]
// Starts the Vite dev server, drives a match with a fake clock and a seeded Math.random
// (so the CPU's picks, and the shots, come out the same every run), and saves each screen
// at a desktop browser size and a phone size.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(root, 'docs/screenshots');
const seed = Number(process.argv[2] ?? 7);
const port = 5175;
mkdirSync(out, { recursive: true });

const devices = {
  browser: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: resolve(root, 'apps/game'), stdio: 'pipe' });
await new Promise((ok) => server.stdout.on('data', (d) => String(d).includes('Local') && ok()));

const browser = await chromium.launch();
try {
  for (const [name, device] of Object.entries(devices)) {
    const page = await browser.newPage(device);
    await page.addInitScript((s) => {
      let a = s >>> 0; // mulberry32
      Math.random = () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      // Pixel perfect scaling for the docs: every pixel the same size (the game defaults to Fill height).
      try {
        localStorage.setItem('rps-fighter.settings', JSON.stringify({ scaling: 'pixelPerfect' }));
      } catch {
        // no storage: the shots use the default scaling
      }
    }, seed);
    await page.clock.install();
    await page.goto(`http://localhost:${port}/`);
    await page.waitForFunction(() => window.__rps); // the game script has loaded
    const run = (ms) => page.clock.runFor(ms);
    const shot = (screen) => page.screenshot({ path: resolve(out, `${name}-${screen}.png`) });
    const view = () => page.evaluate(() => window.__rps.phase());

    const scenes = () => page.evaluate(() => window.__rps.scenes());
    const until = async (done) => { for (let i = 0; i < 400 && !(await done()); i++) await run(100); };

    await page.keyboard.press('Backquote'); // hide the dev tuning panel
    await run(1300); await shot('logo');
    await until(async () => (await scenes()).includes('Home'));
    await run(800); await shot('home');
    // How to play (third menu item), then back home
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await until(async () => (await scenes()).includes('HowTo'));
    await run(800); await shot('howto');
    await page.keyboard.press('Enter');
    await until(async () => (await scenes()).includes('Home'));
    await run(800);
    await page.keyboard.press('Enter');
    // Play exchanges with a fixed pattern (Throw first, the big hit) until the result screen is up.
    const picks = ['Digit2', 'Digit1', 'Digit3', 'Digit2', 'Digit1'];
    let n = 0;
    let koShot = false;
    while (!(await scenes()).includes('Result') && n < 60) {
      await until(async () => (await view()) === 'picking' || (await scenes()).includes('Result'));
      if ((await view()) !== 'picking') break;
      await page.keyboard.press(picks[n % picks.length]);
      await run(2000);
      if (n === 0) await shot('pick'); // 3 seconds left, Throw held down
      await until(async () => (await view()) !== 'picking');
      await run(700); // around the impact
      if (n === 0) await shot('reveal');
      if (!koShot) {
        // the first K.O. of the match: the round ends while the K.O. letters are up
        await until(async () => (await view()) !== 'reveal');
        if ((await view()) === 'roundOver') {
          await run(900);
          await shot('ko');
          koShot = true;
        }
      }
      n++;
    }
    await until(async () => (await scenes()).includes('Result'));
    await run(1500);
    await shot('result');
    await page.close();
    console.log(name, 'done after', n, 'exchanges');
  }
} finally {
  await browser.close();
  server.kill();
  process.exit(0);
}
