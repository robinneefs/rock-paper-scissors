// Dev builds only (main.ts loads this behind import.meta.env.DEV, so release builds never ship it).
// A Tweakpane panel over the live tuning values, rules and phase timings: drag a slider while
// playing, then "Copy changes" and paste the note back into the source files (or to Claude).
import { Pane, type FolderApi } from 'tweakpane';
import {
  assign,
  changeNote,
  flatten,
  isTree,
  rangeFor,
  TuningMemory,
  type NumberTree,
  type TunableGroup,
} from './tunables';

export interface TuningPanelOptions {
  /** One group per source file; the panel edits each `tree` in place. */
  groups: { file: string; title: string; tree: object; expanded?: boolean }[];
  /** Starts a fresh match, so rules and timings changes take effect. */
  restartMatch: () => void;
}

/** Builds the panel. Toggle it with the backquote key (`). */
export function mountTuningPanel(opts: TuningPanelOptions): Pane {
  const memory = new TuningMemory(safeStorage());
  const saved = memory.load();
  const groups: TunableGroup[] = opts.groups.map((g) => {
    const tree = g.tree as NumberTree;
    const defaults = flatten(tree);
    assign(tree, saved[g.file] ?? {});
    return { file: g.file, tree, defaults };
  });

  const pane = new Pane({ title: 'Tuning  ( ` hides )', expanded: true });
  Object.assign(pane.element.parentElement!.style, {
    width: '300px',
    maxHeight: 'calc(100vh - 16px)',
    overflowY: 'auto',
    zIndex: '10',
  });
  // typing in a field must not reach the game (1/2/3 pick moves, arrows move the menu cursor)
  for (const type of ['keydown', 'keyup'] as const)
    pane.element.addEventListener(type, (e) => e.stopPropagation());

  pane.addButton({ title: 'Restart match' }).on('click', opts.restartMatch);
  pane.addButton({ title: 'Copy changes' }).on('click', () => {
    const note = changeNote(groups);
    console.info(`[tuning]\n${note}`);
    void navigator.clipboard?.writeText(note).catch(() => undefined);
  });
  pane.addButton({ title: 'Reset all to defaults' }).on('click', () => {
    for (const g of groups) assign(g.tree, g.defaults);
    pane.refresh();
    memory.save(groups);
  });

  opts.groups.forEach((g, i) => {
    const folder = pane.addFolder({ title: g.title, expanded: g.expanded ?? false });
    addBindings(folder, groups[i]!.tree, '');
  });

  pane.on('change', () => memory.save(groups));
  window.addEventListener('keydown', (e) => {
    if (e.key !== '`') return;
    pane.hidden = !pane.hidden;
  });
  return pane;
}

function addBindings(folder: FolderApi, tree: NumberTree, prefix: string): void {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'number')
      folder.addBinding(tree, key, {
        ...rangeFor(path, value),
        // byDamage tables are keyed by the damage of the hit
        label: /^\d+$/.test(key) ? `${key} dmg` : key,
      });
    else if (isTree(value) && Object.keys(flatten(value)).length)
      addBindings(folder.addFolder({ title: key, expanded: false }), value, path);
  }
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
