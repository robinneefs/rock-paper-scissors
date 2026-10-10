import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('ERR', e.message));
for (const s of process.argv.slice(2)) {
  await p.goto('file://' + process.cwd() + '/samples.html#' + s); await p.reload();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `out-${s}.png` });
}
await b.close();
