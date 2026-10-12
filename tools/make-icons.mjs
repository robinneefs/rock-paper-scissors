// Makes the browser tab icons and the link-share image from the game's own art.
//
//   node tools/make-icons.mjs        (from the repository root; starts the Vite dev server)
//
// The cabinet button and the marquee come straight from the game (the button is painted by the
// same code the game uses), scaled up by whole numbers so the pixels stay sharp. Writes into
// apps/game/public/: favicon.png (64x64), apple-touch-icon.png (180x180), share.png (1200x630),
// and the README's PLAY button into docs/readme/play-button.png. For the Android app: the launcher
// icons and splash screens in every density (apps/android/android/app/src/main/res/), and the
// Play Store icon (512x512) and feature graphic (1024x500) in apps/android/store/.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'apps/game/public');
const port = 5176;

const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
  cwd: resolve(root, 'apps/game'),
  stdio: 'pipe',
});
await new Promise((ok) => server.stdout.on('data', (d) => String(d).includes('Local') && ok()));

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`);
  const files = await page.evaluate(async () => {
    const { paintButtons, BUTTON_FRAME } = await import('/src/assets/placeholders/cabinet.ts');
    const { palette } = await import('/src/config/palette.ts');
    const { PixelBuffer } = await import('/src/assets/placeholders/PixelBuffer.ts');
    const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
    const sheet = paintButtons();
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = sheet.width;
    sheetCanvas.height = sheet.height;
    sheetCanvas.getContext('2d').putImageData(new ImageData(sheet.data, sheet.width, sheet.height), 0, 0);
    const marquee = new Image();
    marquee.src = '/assets/marquee.png';
    await marquee.decode();

    const canvas = (w, h, bg) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      if (bg) {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
      }
      return [c, g];
    };
    const fw = BUTTON_FRAME.width;
    const fh = BUTTON_FRAME.height;
    // the 'up' frame of a move's button (row: rock 0, paper 1, scissors 2)
    const button = (g, row, x, y, scale) =>
      g.drawImage(sheetCanvas, 0, row * fh, fw, fh, x, y, fw * scale, fh * scale);

    const [fav, fg] = canvas(64, 64);
    button(fg, 0, (64 - fw) / 2, (64 - fh) / 2 + 2, 1);
    const [touch, tg] = canvas(180, 180, hex(palette.ink));
    button(tg, 0, (180 - fw * 3) / 2, (180 - fh * 3) / 2 + 4, 3);

    const [share, sg] = canvas(1200, 630, hex(palette.ink));
    const ms = 4;
    const mx = (1200 - marquee.width * ms) / 2;
    sg.fillStyle = hex(palette.pink);
    sg.fillRect(mx - 12, 36, marquee.width * ms + 24, marquee.height * ms + 24);
    sg.fillStyle = '#000';
    sg.fillRect(mx - 4, 44, marquee.width * ms + 8, marquee.height * ms + 8);
    sg.drawImage(
      marquee,
      0,
      0,
      marquee.width,
      marquee.height,
      mx,
      48,
      marquee.width * ms,
      marquee.height * ms,
    );
    [0, 1, 2].forEach((row, i) => button(sg, row, 600 - fw * 1.5 * 3 - 60 + i * (fw * 3 + 60), 400, 3));
    // the tagline in the game's pixel font, drawn at 1x then scaled up
    const line = 'PLAY FREE IN YOUR BROWSER';
    const text = new PixelBuffer(200, 9);
    text.text(line, 0, 0, palette.text, { shadow: palette.shadow });
    const tc = document.createElement('canvas');
    tc.width = text.width;
    tc.height = text.height;
    tc.getContext('2d').putImageData(new ImageData(text.data, text.width, text.height), 0, 0);
    const tw = text.textWidth(line) + 1;
    sg.drawImage(tc, 0, 0, tw, 8, (1200 - tw * 4) / 2, 560, tw * 4, 32);
    // the README's PLAY button: a pink arcade-style plate with PLAY NOW in the pixel font
    const label = 'PLAY NOW';
    const lw = text.textWidth(label);
    const pw = lw + 26;
    const ph = 19;
    const plate = new PixelBuffer(pw, ph + 4);
    plate.rect(1, 3, pw - 2, ph, palette.ink); // shadow under the plate
    plate.rect(0, 0, pw, ph, palette.ink);
    plate.rect(1, 1, pw - 2, ph - 2, 0xb01846);
    plate.rect(1, 1, pw - 2, ph - 5, palette.pink);
    plate.rect(2, 2, pw - 4, 1, 0xff8ad8);
    // a play triangle, then the label
    for (let i = 0; i < 4; i++) plate.rect(7 + i, 5 + i, 1, 7 - i * 2, palette.white);
    plate.text(label, 15, 5, palette.white, { shadow: palette.shadow });
    const pc = document.createElement('canvas');
    pc.width = plate.width;
    pc.height = plate.height;
    pc.getContext('2d').putImageData(new ImageData(plate.data, plate.width, plate.height), 0, 0);
    const [play, pg] = canvas(plate.width * 4, plate.height * 4);
    pg.drawImage(pc, 0, 0, plate.width * 4, plate.height * 4);

    // Android launcher icons, per density (mdpi = 1x). The adaptive icon is the button on the
    // ink-coloured background (values/ic_launcher_background.xml); older phones get the square and
    // round icons with the background drawn in. Splash screens: the marquee on the room colour.
    const res = '../../android/android/app/src/main/res';
    const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
    const android = [];
    const centred = (g, size, scale, row = 0) =>
      button(g, row, Math.round((size - fw * scale) / 2), Math.round((size - fh * scale) / 2), scale);
    for (const [d, k] of Object.entries(densities)) {
      const fgSize = 108 * k;
      const [fgc, fgg] = canvas(fgSize, fgSize);
      centred(fgg, fgSize, 1.25 * k);
      android.push([`${res}/mipmap-${d}/ic_launcher_foreground.png`, fgc]);
      const size = 48 * k;
      const [sq, sqg] = canvas(size, size);
      sqg.fillStyle = hex(palette.ink);
      sqg.beginPath();
      sqg.roundRect(0, 0, size, size, 8 * k);
      sqg.fill();
      centred(sqg, size, 0.8 * k);
      android.push([`${res}/mipmap-${d}/ic_launcher.png`, sq]);
      const [rc, rg] = canvas(size, size);
      rg.fillStyle = hex(palette.ink);
      rg.beginPath();
      rg.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      rg.fill();
      centred(rg, size, 0.8 * k);
      android.push([`${res}/mipmap-${d}/ic_launcher_round.png`, rc]);
    }
    const splash = (w, h) => {
      const [c, g] = canvas(w, h, hex(palette.room));
      const s = Math.max(1, Math.floor((Math.min(w, h) * 0.8) / marquee.width));
      g.drawImage(
        marquee,
        Math.round((w - marquee.width * s) / 2),
        Math.round((h - marquee.height * s) / 2),
        marquee.width * s,
        marquee.height * s,
      );
      return c;
    };
    const splashSizes = {
      mdpi: [320, 480],
      hdpi: [480, 800],
      xhdpi: [720, 1280],
      xxhdpi: [960, 1600],
      xxxhdpi: [1280, 1920],
    };
    for (const [d, [w, h]] of Object.entries(splashSizes)) {
      android.push([`${res}/drawable-port-${d}/splash.png`, splash(w, h)]);
      android.push([`${res}/drawable-land-${d}/splash.png`, splash(h, w)]);
    }
    android.push([`${res}/drawable/splash.png`, splash(480, 320)]);
    // Play Store listing: the 512x512 icon and the 1024x500 feature graphic
    const [store, stg] = canvas(512, 512, hex(palette.ink));
    centred(stg, 512, 8);
    android.push(['../../android/store/icon-512.png', store]);
    const [feat, ftg] = canvas(1024, 500, hex(palette.ink));
    const fs = 3;
    const fx = (1024 - marquee.width * fs) / 2;
    ftg.fillStyle = hex(palette.pink);
    ftg.fillRect(fx - 9, 24, marquee.width * fs + 18, marquee.height * fs + 18);
    ftg.fillStyle = '#000';
    ftg.fillRect(fx - 3, 30, marquee.width * fs + 6, marquee.height * fs + 6);
    ftg.drawImage(
      marquee,
      0,
      0,
      marquee.width,
      marquee.height,
      fx,
      33,
      marquee.width * fs,
      marquee.height * fs,
    );
    [0, 1, 2].forEach((row, i) => button(ftg, row, 512 - fw * 1.5 * 3 - 60 + i * (fw * 3 + 60), 320, 3));
    android.push(['../../android/store/feature-graphic.png', feat]);

    return Object.fromEntries(
      [
        ...android,
        ['favicon.png', fav],
        ['apple-touch-icon.png', touch],
        ['share.png', share],
        ['../../../docs/readme/play-button.png', play],
      ].map(([name, c]) => [name, c.toDataURL('image/png')]),
    );
  });
  for (const [name, url] of Object.entries(files)) {
    mkdirSync(dirname(resolve(out, name)), { recursive: true });
    writeFileSync(resolve(out, name), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`wrote ${resolve(out, name).slice(root.length + 1)}`);
  }
} finally {
  await browser.close();
  server.kill();
  process.exit(0);
}
