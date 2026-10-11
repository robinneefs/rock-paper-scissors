import { MONITOR } from '../config/layout';
import { tuning } from '../config/tuning';
import type { PixelScaler } from '../platform/PixelScaler';
import type { CabinetShake } from './cabinetShake';

/**
 * The CRT's scanlines: a see-through layer laid over the monitor in the page, at device
 * resolution, so each native pixel row gets a fine dark line under it (the canvas itself is at
 * native size, too coarse for that). Follows the window, the scaling mode and the cabinet shake.
 */
export class CrtOverlay {
  private readonly el: HTMLDivElement;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly scaler: PixelScaler,
    private readonly shake: CabinetShake,
  ) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '1',
      display: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(this.el);
    scaler.onChange(() => this.place());
    shake.onMove(() => this.place());
    window.addEventListener('scroll', () => this.place());
  }

  setVisible(on: boolean): void {
    this.el.style.display = on ? 'block' : 'none';
    if (on) this.place();
  }

  private place(): void {
    if (this.el.style.display === 'none') return;
    const l = this.scaler.layout;
    const zoom = this.scaler.zoom;
    const o = this.shake.offset;
    const rect = this.canvas.getBoundingClientRect();
    const c = tuning.crt;
    // one dark line per native pixel row, a fraction of the row thick
    const row = zoom;
    const line = Math.max(1, row * c.scanlineThickness);
    Object.assign(this.el.style, {
      left: `${rect.left + window.scrollX + (l.cabinetX + MONITOR.x + o.x) * zoom}px`,
      top: `${rect.top + window.scrollY + (l.cabinetY + MONITOR.y + o.y) * zoom}px`,
      width: `${MONITOR.width * zoom}px`,
      height: `${MONITOR.height * zoom}px`,
      borderRadius: `${MONITOR.width * zoom * c.cornerRadius * 0.6}px`,
      background: `repeating-linear-gradient(to bottom, transparent 0, transparent ${row - line}px, rgba(0, 0, 0, ${c.scanlineAlpha}) ${row - line}px, rgba(0, 0, 0, ${c.scanlineAlpha}) ${row}px)`,
      boxShadow: `inset 0 0 ${8 * zoom}px rgba(0, 0, 0, 0.35)`,
    } satisfies Partial<CSSStyleDeclaration>);
  }
}
