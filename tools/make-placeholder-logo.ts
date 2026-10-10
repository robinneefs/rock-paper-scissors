// Writes the placeholder studio logo to apps/game/public/assets/logo.png.
// Run with: npx vite-node tools/make-placeholder-logo.ts
// Replacing that PNG with the company logo is the whole logo swap; this script is only for the placeholder.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { paintLogo } from '../apps/game/src/assets/placeholders/logo';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Uint8Array) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Uint8Array) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

const img = paintLogo();
const raw = Buffer.alloc((img.width * 4 + 1) * img.height);
for (let y = 0; y < img.height; y++) {
  raw[y * (img.width * 4 + 1)] = 0;
  Buffer.from(img.data.buffer, y * img.width * 4, img.width * 4).copy(raw, y * (img.width * 4 + 1) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(img.width, 0);
ihdr.writeUInt32BE(img.height, 4);
ihdr.set([8, 6, 0, 0, 0], 8);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', new Uint8Array()),
]);
const out = new URL('../apps/game/public/assets/logo.png', import.meta.url);
writeFileSync(out, png);
console.log(`Wrote ${out.pathname} (${img.width}x${img.height})`);
