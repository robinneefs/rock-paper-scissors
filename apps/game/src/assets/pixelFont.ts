import Phaser from 'phaser';
import { FONT_CHARS, GLYPH, GLYPHS } from './glyphs';
import { fontKey, type FontSize } from './keys';

/** Draws the glyph sheet at a whole-number size and registers it as a bitmap font. */
export function registerPixelFont(scene: Phaser.Scene, size: FontSize): void {
  const key = fontKey(size);
  if (scene.cache.bitmapFont.exists(key)) return;
  const cw = GLYPH.width * size;
  const ch = GLYPH.height * size;
  const tex = scene.textures.createCanvas(key, cw * FONT_CHARS.length, ch);
  if (!tex) throw new Error('Could not create the font texture');
  const ctx = tex.getContext();
  ctx.fillStyle = '#ffffff';
  [...FONT_CHARS].forEach((c, i) => {
    const rows = (GLYPHS[c] ?? '').split(' ');
    rows.forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit === '1') ctx.fillRect(i * cw + x * size, y * size, size, size);
      });
    });
  });
  tex.refresh();
  // Parse returns a ready cache entry ({ data, texture, frame }) despite its typings
  const entry = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: key,
    width: cw,
    height: ch,
    chars: FONT_CHARS,
    charsPerRow: FONT_CHARS.length,
    'spacing.x': 0,
    'spacing.y': 0,
    'offset.x': 0,
    'offset.y': 0,
    lineSpacing: 0,
  });
  scene.cache.bitmapFont.add(key, entry);
}
