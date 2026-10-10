import { CABINET } from '../config/layout';

export interface ScreenLayout {
  /** Whole-number scale in device pixels (1 native pixel = `scale` device pixels). */
  scale: number;
  /** Size of the native canvas: the window divided by the scale. */
  width: number;
  height: number;
  /** Top-left of the cabinet on the native canvas. */
  cabinetX: number;
  cabinetY: number;
}

/**
 * Picks the largest whole scale at which the cabinet fits the window, measured in device pixels
 * so it is crisp on high-DPI phones too. The canvas fills the window; the leftover is arcade room.
 */
export function computeLayout(cssWidth: number, cssHeight: number, dpr: number): ScreenLayout {
  const devW = Math.floor(cssWidth * dpr);
  const devH = Math.floor(cssHeight * dpr);
  const scale = Math.max(1, Math.floor(Math.min(devW / CABINET.width, devH / CABINET.height)));
  const width = Math.max(CABINET.width, Math.ceil(devW / scale));
  const height = Math.max(CABINET.height, Math.ceil(devH / scale));
  return {
    scale,
    width,
    height,
    cabinetX: Math.floor((width - CABINET.width) / 2),
    cabinetY: Math.floor((height - CABINET.height) / 2),
  };
}

type Listener = (layout: ScreenLayout) => void;

/** Watches the window and keeps the game at a whole-number scale. */
export class PixelScaler {
  private listeners = new Set<Listener>();
  layout: ScreenLayout;

  constructor(private readonly win: Window = window) {
    this.layout = this.measure();
    win.addEventListener('resize', this.update);
    win.addEventListener('orientationchange', this.update);
  }

  measure(): ScreenLayout {
    return computeLayout(this.win.innerWidth, this.win.innerHeight, this.win.devicePixelRatio || 1);
  }

  /** CSS zoom for Phaser: native pixels to CSS pixels. */
  get zoom(): number {
    return this.layout.scale / (this.win.devicePixelRatio || 1);
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private update = (): void => {
    const next = this.measure();
    const prev = this.layout;
    if (
      next.scale === prev.scale &&
      next.width === prev.width &&
      next.height === prev.height &&
      next.cabinetX === prev.cabinetX
    )
      return;
    this.layout = next;
    this.listeners.forEach((fn) => fn(next));
  };
}
