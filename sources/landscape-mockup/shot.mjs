import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
for (const s of ['pick','reveal','clash','win']) {
  await p.goto('file://' + process.cwd() + '/mockup.html#' + s); await p.reload();
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${s}.png` });
}
await b.close();
