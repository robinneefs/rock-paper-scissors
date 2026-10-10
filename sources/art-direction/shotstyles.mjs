import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + process.cwd() + '/styles.html');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
await p.screenshot({ path: 'styles.png', fullPage: true });
await b.close();
