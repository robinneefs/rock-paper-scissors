import type { MenuItem } from './MenuItem';

export const resultMenu = (actions: { retry: () => void; mainMenu: () => void }): MenuItem[] => [
  { id: 'retry', label: 'RETRY', enabled: true, onSelect: actions.retry },
  { id: 'home', label: 'MAIN MENU', enabled: true, onSelect: actions.mainMenu },
];
