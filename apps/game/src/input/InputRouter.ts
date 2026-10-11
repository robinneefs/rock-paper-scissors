import { Emitter, type Move } from '@rps/core';
import { tuning } from '../config/tuning';

export type NavDir = 'up' | 'down' | 'left' | 'right';

/** What scenes hear. They never read keys or pointers for these themselves. */
export type Action =
  | { type: 'pick'; move: Move } // a cabinet button (keys 1/2/3 or a tap); menus treat it as confirm
  | { type: 'confirm' } // Enter, Space
  | { type: 'back' } // Esc (Android back later)
  | { type: 'nav'; dir: NavDir } // joystick or arrow keys
  | { type: 'char'; char: string }; // a letter key A to Z (typing a room code)

export interface StickTilt {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

interface InputEvents extends Record<string, unknown> {
  action: Action;
  /** A cabinet button went down or up (for the visual press). */
  button: { move: Move; down: boolean };
  /** The joystick's tilt changed (for the visual). */
  stick: StickTilt;
}

const KEY_MOVES: Record<string, Move> = {
  Digit1: 'attack',
  Digit2: 'throw',
  Digit3: 'block',
  Numpad1: 'attack',
  Numpad2: 'throw',
  Numpad3: 'block',
};
const ARROWS: Record<string, NavDir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/**
 * Turns every input source into game actions: keys, taps on the cabinet buttons, the joystick
 * (arrow keys or drag), later a gamepad. Rebinding or adding a device touches only this folder.
 */
export class InputRouter {
  private readonly events = new Emitter<InputEvents>();
  private readonly arrowsHeld = new Set<NavDir>();
  private stick: StickTilt = { x: 0, y: 0 };
  private repeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(target: Window = window) {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', () => this.releaseAll());
  }

  on<E extends keyof InputEvents>(event: E, fn: (payload: InputEvents[E]) => void): () => void {
    return this.events.on(event, fn);
  }

  /** Cabinet button pressed (key or tap). */
  pressButton(move: Move): void {
    this.events.emit('button', { move, down: true });
    this.events.emit('action', { type: 'pick', move });
  }

  releaseButton(move: Move): void {
    this.events.emit('button', { move, down: false });
  }

  /** Joystick dragged to a direction (0, 0 = released, springs back). */
  setStick(x: -1 | 0 | 1, y: -1 | 0 | 1): void {
    if (x === this.stick.x && y === this.stick.y) return;
    this.stick = { x, y };
    this.events.emit('stick', this.stick);
    this.stopRepeat();
    const dir = stickToNav(this.stick);
    if (dir) {
      this.events.emit('action', { type: 'nav', dir });
      this.repeatTimer = setInterval(
        () => this.events.emit('action', { type: 'nav', dir }),
        tuning.menu.repeatDelayMs,
      );
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const move = KEY_MOVES[e.code];
    const arrow = ARROWS[e.code];
    if (move) {
      if (!e.repeat) this.pressButton(move);
    } else if (arrow) {
      this.arrowsHeld.add(arrow);
      this.syncStickFromArrows();
      // the browser's own key repeat drives menu repeat for arrow keys
      this.events.emit('action', { type: 'nav', dir: arrow });
    } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
      if (!e.repeat) this.events.emit('action', { type: 'confirm' });
    } else if (e.code === 'Escape' || e.code === 'Backspace') {
      if (!e.repeat) this.events.emit('action', { type: 'back' });
    } else if (/^Key[A-Z]$/.test(e.code) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!e.repeat) this.events.emit('action', { type: 'char', char: e.code.slice(3) });
    } else return;
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const move = KEY_MOVES[e.code];
    const arrow = ARROWS[e.code];
    if (move) this.releaseButton(move);
    if (arrow) {
      this.arrowsHeld.delete(arrow);
      this.syncStickFromArrows();
    }
  };

  /** Two arrow keys at once tilt the stick diagonally. Only the visual; nav comes from keydown. */
  private syncStickFromArrows(): void {
    const h = this.arrowsHeld;
    const x = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    const y = (h.has('down') ? 1 : 0) - (h.has('up') ? 1 : 0);
    this.stick = { x: x as StickTilt['x'], y: y as StickTilt['y'] };
    this.events.emit('stick', this.stick);
  }

  private releaseAll(): void {
    this.arrowsHeld.clear();
    this.stopRepeat();
    this.stick = { x: 0, y: 0 };
    this.events.emit('stick', this.stick);
    for (const move of ['attack', 'throw', 'block'] as const) this.releaseButton(move);
  }

  private stopRepeat(): void {
    if (this.repeatTimer) clearInterval(this.repeatTimer);
    this.repeatTimer = null;
  }
}

/** Menus move up and down; a mostly-sideways tilt counts as left/right. */
function stickToNav({ x, y }: StickTilt): NavDir | null {
  if (y !== 0) return y < 0 ? 'up' : 'down';
  if (x !== 0) return x < 0 ? 'left' : 'right';
  return null;
}
