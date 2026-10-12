import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import type { SfxPlayer } from '../audio/sounds';
import type { Action, InputRouter } from '../input/InputRouter';
import type { MenuItem } from '../menus/MenuItem';
import { frameRect } from '../util/gfx';
import { PixelText } from './PixelText';

const ITEM_H = 17;
const GAP = 4;
const PAD = 6;

/**
 * Draws any menu (a list of MenuItem) on the monitor: panel, blinking cursor, disabled items skipped.
 * Joystick / arrows move the cursor; any cabinet button, Enter or Space confirms; items can be tapped.
 */
export class MenuView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly cursor: PixelText;
  private readonly labels: PixelText[] = [];
  private readonly tags: PixelText[] = [];
  private readonly zones: Phaser.GameObjects.Zone[] = [];
  private readonly x: number;
  private readonly itemW: number;
  private selected: number;
  private blinkOn = true;
  private locked = false;
  private readonly unsubscribe: () => void;
  readonly bottom: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly items: MenuItem[],
    private readonly y: number,
    input: InputRouter,
    private readonly sfx: SfxPlayer,
    width = 136,
    private readonly gap = GAP,
  ) {
    this.x = Math.round((MONITOR.width - width) / 2);
    this.itemW = width - PAD * 2;
    const h = PAD * 2 + items.length * ITEM_H + (items.length - 1) * gap;
    this.bottom = y + h;
    this.selected = Math.max(
      0,
      items.findIndex((i) => i.enabled),
    );

    const panel = scene.add.graphics();
    panel.fillStyle(palette.ink).fillRect(this.x - 1, y - 1, width + 2, h + 2);
    panel.fillStyle(palette.panel).fillRect(this.x, y, width, h);
    frameRect(panel, this.x, y, width, h, palette.panelEdge);
    this.gfx = scene.add.graphics();

    items.forEach((item, i) => {
      const iy = this.itemY(i);
      const ix = this.x + PAD;
      this.labels.push(new PixelText(scene, ix + 13, iy + 5, item.label, { color: palette.text }));
      this.tags.push(
        new PixelText(scene, ix + this.itemW - 4, iy + 5, item.tag ?? '', {
          color: item.enabled ? palette.cyan : 0x8c6a2a,
          align: 'right',
        }),
      );
      const zone = scene.add
        .zone(ix, iy, this.itemW, ITEM_H)
        .setOrigin(0)
        .setInteractive({ useHandCursor: item.enabled });
      zone.on('pointerdown', () => {
        if (!item.enabled) return;
        this.selected = i;
        this.draw();
        this.confirm();
      });
      this.zones.push(zone);
    });
    this.cursor = new PixelText(scene, 0, 0, '>', { color: palette.gold });

    this.unsubscribe = input.on('action', this.onAction);
    const blink = scene.time.addEvent({
      delay: tuning.menu.cursorBlinkMs,
      loop: true,
      callback: () => {
        this.blinkOn = !this.blinkOn;
        this.draw();
      },
    });
    scene.events.once('shutdown', () => {
      this.unsubscribe();
      blink.remove();
    });
    this.draw();
  }

  /** Change an item's small right-hand text (e.g. a setting's current value). */
  setTag(id: string, tag: string): void {
    const i = this.items.findIndex((item) => item.id === id);
    this.tags[i]?.setText(tag);
  }

  /** The id of the item under the cursor. */
  get selectedId(): string | undefined {
    return this.items[this.selected]?.id;
  }

  /** Stop reacting (e.g. while a selection is being acted on). */
  lock(): void {
    this.locked = true;
  }

  private onAction = (a: Action): void => {
    if (this.locked || !this.scene.sys.isActive()) return;
    if (a.type === 'nav' && (a.dir === 'up' || a.dir === 'down')) this.move(a.dir === 'up' ? -1 : 1);
    else if (a.type === 'confirm' || a.type === 'pick') this.confirm();
  };

  private move(step: number): void {
    const n = this.items.length;
    for (let i = 1; i <= n; i++) {
      const next = (this.selected + step * i + n * n) % n;
      if (this.items[next]?.enabled) {
        if (next !== this.selected) this.sfx.play('menuMove');
        this.selected = next;
        break;
      }
    }
    this.blinkOn = true;
    this.draw();
  }

  private confirm(): void {
    if (this.locked) return;
    const item = this.items[this.selected];
    if (!item?.enabled) return;
    this.sfx.play(item.id === 'back' ? 'menuBack' : 'menuSelect');
    item.onSelect?.();
  }

  private itemY(i: number): number {
    return this.y + PAD + i * (ITEM_H + this.gap);
  }

  private draw(): void {
    const g = this.gfx.clear();
    this.items.forEach((item, i) => {
      const ix = this.x + PAD;
      const iy = this.itemY(i);
      const on = i === this.selected && item.enabled;
      if (on) {
        g.fillStyle(palette.select).fillRect(ix, iy, this.itemW, ITEM_H);
        g.fillStyle(palette.shadow).fillRect(ix + 1, iy + ITEM_H, this.itemW, 1);
      }
      frameRect(g, ix, iy, this.itemW, ITEM_H, on ? palette.pink : item.enabled ? 0x3b2768 : 0x2c1d50);
      this.labels[i]?.setColor(!item.enabled ? palette.dim : on ? palette.white : palette.text);
    });
    const iy = this.itemY(this.selected);
    this.cursor
      .setPosition(0, iy + 5)
      .setAnchorX(this.x + PAD + 4)
      .setVisible(this.blinkOn);
  }
}
