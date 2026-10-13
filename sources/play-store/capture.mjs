// Captures the Google Play phone screenshots (play-store/screenshots/, 1080x1920) as the Android
// app shows the game: full height, no SCALING in Options, QUIT on the home menu.
// Usage, from the repository root: node sources/play-store/capture.mjs [seed]
// Drives a match with a fake clock and a seeded Math.random, like sources/screenshots/capture.mjs.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = process.env.OUT ?? resolve(root, 'play-store/screenshots');
const seed = Number(process.argv[2] ?? 3);
const port = Number(process.env.PORT ?? 5176);
mkdirSync(out, { recursive: true });

// 9:16 at 3x is exactly 1080x1920, the size Google Play recommends for phone screenshots.
const device = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: resolve(root, 'apps/game'), stdio: 'pipe' });
await new Promise((ok) => server.stdout.on('data', (d) => String(d).includes('Local') && ok()));

const browser = await chromium.launch();
try {
  const page = await browser.newPage(device);
  await page.addInitScript((s) => {
    let a = s >>> 0; // mulberry32
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // Capacitor takes this for the Android app; plugin calls just never answer.
    window.androidBridge = { postMessage: () => undefined };
  }, seed);
  await page.clock.install();
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__rps);
  const run = (ms) => page.clock.runFor(ms);
  let count = 0;
  const shot = (screen) => page.screenshot({ path: resolve(out, `${String(++count).padStart(2, '0')}-${screen}.png`) });
  const view = () => page.evaluate(() => window.__rps.phase());
  const scenes = () => page.evaluate(() => window.__rps.scenes());
  const until = async (done) => { for (let i = 0; i < 400 && !(await done()); i++) await run(100); };

  await page.keyboard.press('Backquote'); // hide the dev tuning panel
  await until(async () => (await scenes()).includes('Home'));
  await run(800); await shot('home');
  await page.keyboard.press('Enter');
  const picks = ['Digit3', 'Digit1', 'Digit2', 'Digit1', 'Digit3'];
  let n = 0;
  let koShot = false;
  while (!(await scenes()).includes('Result') && n < 60) {
    await until(async () => (await view()) === 'picking' || (await scenes()).includes('Result'));
    if ((await view()) !== 'picking') break;
    await page.keyboard.press(picks[n % picks.length]);
    await run(2000);
    if (n === 0) await shot('pick');
    await until(async () => (await view()) !== 'picking');
    await run(700);
    if (n === 0) await shot('first-hit');
    if (n === 1) await shot('second-hit');
    if (!koShot) {
      await until(async () => (await view()) !== 'reveal');
      if ((await view()) === 'roundOver') { await run(1800); await shot('ko'); koShot = true; }
    }
    n++;
  }
  await until(async () => (await scenes()).includes('Result'));
  await run(1500); await shot('result');
  console.log('done after', n, 'exchanges');
} finally {
  await browser.close();
  server.kill();
  process.exit(0);
}
