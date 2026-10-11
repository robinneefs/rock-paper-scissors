import type { MenuItem } from './MenuItem';

export const lobbyMenu = (actions: {
  create: () => void;
  join: () => void;
  back: () => void;
}): MenuItem[] => [
  { id: 'create', label: 'CREATE ROOM', enabled: true, onSelect: actions.create },
  { id: 'join', label: 'JOIN ROOM', tag: 'CODE', enabled: true, onSelect: actions.join },
  { id: 'back', label: 'BACK', enabled: true, onSelect: actions.back },
];
