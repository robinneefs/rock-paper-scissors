// Builds the interactive design document from gdd.html + the cabinet scripts.
// Usage: node build.mjs [artifactOut]
//   writes docs/design/interactive-gdd.html (images as ../ paths, for the repository)
//   and, when artifactOut is given, a copy for the published artifact (images as mockups/..., art-direction/..., architecture/...).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');
const scripts = ['../cabinet-mockup/art.js', '../cabinet-mockup/pixfont.js', '../cabinet-mockup/screens.js', 'sketch.js']
  .map((p) => `<script>\n${read(p)}\n</script>`).join('\n');
const page = (img) => read('gdd.html').replaceAll('{{IMG}}', img).replace('{{SCRIPTS}}', () => scripts);
writeFileSync(resolve(here, '../../docs/design/interactive-gdd.html'), page('../'));
if (process.argv[2]) writeFileSync(resolve(process.argv[2]), page(''));
console.log('built');
