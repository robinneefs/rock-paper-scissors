import { MONITOR } from '../config/layout';
import { tuning } from '../config/tuning';
import type { PixelScaler } from '../platform/PixelScaler';
import type { CabinetShake } from './cabinetShake';

/**
 * The CRT's scanlines: a see-through layer laid over the monitor in the page, at device
 * resolution, so each native pixel row gets a fine dark line under it (the canvas itself is at
 * native size, too coarse for that). Follows the window, the scaling mode and the cabinet shake.
 *
 * The lines are drawn on a canvas the size of the window, pinned to its top-left corner, in whole
 * device pixels: one per native row, at the bottom of the device rows the browser gives that row,
 * all equally thick. (Before, a CSS gradient on a box at a fractional position drew them: the
 * browser rounded its stripes and its position differently from row to row, so the lines came out
 * uneven and drifted against the pixel rows.)
 */
export class CrtOverlay {
  private readonly lines: HTMLCanvasElement;
  /** The soft dark edge round the glass (fractional positions don't matter for a blur). */
  private readonly glass: HTMLDivElement;
  private on = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly scaler: PixelScaler,
    private readonly shake: CabinetShake,
  ) {
    this.lines = document.createElement('canvas');
    this.glass = document.createElement('div');
    for (const el of [this.lines, this.glass])
      Object.assign(el.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        pointerEvents: 'none',
        zIndex: '1',
        display: 'none',
      } satisfies Partial<CSSStyleDeclaration>);
    document.body.append(this.lines, this.glass);
    scaler.onChange(() => this.place());
    shake.onMove(() => this.place());
    window.addEventListener('scroll', () => this.place());
    window.addEventListener('resize', () => this.place());
  }

  setVisible(on: boolean): void {
    this.on = on;
    for (const el of [this.lines, this.glass]) el.style.display = on ? 'block' : 'none';
    if (on) this.place();
  }

  private place(): void {
    if (!this.on) return;
    const dpr = window.devicePixelRatio || 1;
    const l = this.scaler.layout;
    const o = this.shake.offset;
    const rect = this.canvas.getBoundingClientRect();
    const c = tuning.crt;
    // device pixels per native pixel, measured from where the browser really put the game canvas
    const canvasLeft = Math.round(rect.left * dpr);
    const canvasTop = Math.round(rect.top * dpr);
    const dev = (Math.round(rect.bottom * dpr) - canvasTop) / this.canvas.height || this.scaler.zoom * dpr;
    // pixelated scaling samples each device pixel at its centre, so native row n starts at the
    // device row nearest to n * dev
    const edge = (n: number) => Math.ceil(n * dev - 0.5 - 1e-6);
    const mx = l.cabinetX + MONITOR.x + o.x;
    const my = l.cabinetY + MONITOR.y + o.y;
    const left = canvasLeft + edge(mx);
    const top = canvasTop + edge(my);
    const w = edge(mx + MONITOR.width) - edge(mx);
    const h = edge(my + MONITOR.height) - edge(my);
    const radius = w * c.cornerRadius * 0.6;

    Object.assign(this.glass.style, {
      left: `${left / dpr}px`,
      top: `${top / dpr}px`,
      width: `${w / dpr}px`,
      height: `${h / dpr}px`,
      borderRadius: `${radius / dpr}px`,
      boxShadow: `inset 0 0 ${8 * this.scaler.zoom}px rgba(0, 0, 0, 0.35)`,
    } satisfies Partial<CSSStyleDeclaration>);

    const cv = this.lines;
    const cw = Math.round(window.innerWidth * dpr);
    const ch = Math.round(window.innerHeight * dpr);
    if (cv.width !== cw || cv.height !== ch) {
      cv.width = cw;
      cv.height = ch;
      cv.style.width = `${cw / dpr}px`;
      cv.style.height = `${ch / dpr}px`;
    }
    const g = cv.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, cw, ch);
    g.save();
    g.beginPath();
    g.roundRect(left, top, w, h, radius);
    g.clip();
    g.fillStyle = `rgba(0, 0, 0, ${c.scanlineAlpha})`;
    const thick = Math.max(1, Math.round(dev * c.scanlineThickness));
    for (let k = 0; k < MONITOR.height; k++) {
      const rowTop = canvasTop + edge(my + k);
      const rowBottom = canvasTop + edge(my + k + 1);
      // a row only a device pixel or two tall keeps at least one clear pixel
      const line = Math.min(thick, Math.max(1, rowBottom - rowTop - 1));
      g.fillRect(left, rowBottom - line, w, line);
    }
    g.restore();
  }
}
