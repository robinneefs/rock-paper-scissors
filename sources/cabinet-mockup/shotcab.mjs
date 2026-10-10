import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
p.on('pageerror', e => console.log('ERR', e.message));
for (const s of process.argv.slice(2)) {
  await p.setViewportSize(s.startsWith('phone') ? { width: 1300, height: 2500 } : { width: 1920, height: 1200 });
  await p.goto('file://' + process.cwd() + '/cabinet.html#' + s); await p.reload();
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.locator(s.startsWith('phone') ? '.phone' : '.view').screenshot({ path: `cab-${s}.png` });
}
await b.close();
