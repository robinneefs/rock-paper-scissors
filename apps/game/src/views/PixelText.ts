import Phaser from 'phaser';
import { GLYPH } from '../assets/glyphs';
import { fontKey, type FontSize } from '../assets/keys';
import { palette } from '../config/palette';
import { snap } from '../util/snap';

export interface PixelTextStyle {
  size?: FontSize;
  color?: number;
  align?: 'left' | 'center' | 'right';
  shadow?: number;
  outline?: number;
  /** How far the outline and shadow sit from the text, in pixels (default: one font pixel). */
  edgePx?: number;
}

/**
 * Text in the 5x7 pixel font at a whole-number size, with an optional 1-step drop shadow and outline
 * (drawn as offset copies, not smooth effects). (x, y) is the top of the text; `align` picks the anchor.
 */
export class PixelText extends Phaser.GameObjects.Container {
  private readonly layers: {
    text: Phaser.GameObjects.BitmapText;
    dx: number;
    dy: number;
    role: 'main' | 'fx';
  }[] = [];
  private readonly style: Required<Pick<PixelTextStyle, 'size' | 'color' | 'align'>> & PixelTextStyle;
  private anchorX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: PixelTextStyle = {}) {
    super(scene, 0, snap(y));
    this.style = { size: 1, color: palette.text, align: 'left', ...style };
    this.anchorX = x;
    const s = this.style.size;
    const e = this.style.edgePx ?? s;
    const add = (dx: number, dy: number, color: number, role: 'main' | 'fx') => {
      const t = scene.add
        .bitmapText(dx, dy, fontKey(s), '')
        .setLetterSpacing(GLYPH.spacing * s)
        .setTint(color);
      this.add(t);
      this.layers.push({ text: t, dx, dy, role });
    };
    if (this.style.outline !== undefined)
      for (const [dx, dy] of [
        [-e, 0],
        [e, 0],
        [0, -e],
        [0, e],
      ] as const)
        add(dx, dy, this.style.outline, 'fx');
    if (this.style.shadow !== undefined) add(e, e, this.style.shadow, 'fx');
    add(0, 0, this.style.color, 'main');
    this.setText(text);
    scene.add.existing(this);
  }

  setText(text: string): this {
    const t = text.toUpperCase();
    for (const l of this.layers) l.text.setText(t);
    this.reanchor();
    return this;
  }

  setColor(color: number): this {
    for (const l of this.layers) if (l.role === 'main') l.text.setTint(color);
    return this;
  }

  setAnchorX(x: number): this {
    this.anchorX = x;
    this.reanchor();
    return this;
  }

  get textWidth(): number {
    const n = this.layers[0]?.text.text.length ?? 0;
    return n ? (n * (GLYPH.width + GLYPH.spacing) - GLYPH.spacing) * this.style.size : 0;
  }

  private reanchor(): void {
    const w = this.textWidth;
    const left =
      this.style.align === 'center'
        ? this.anchorX - w / 2
        : this.style.align === 'right'
          ? this.anchorX - w
          : this.anchorX;
    this.x = snap(left);
  }
}
