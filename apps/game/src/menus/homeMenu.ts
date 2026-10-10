import type { SceneFlow } from '../scenes/flow';
import type { MenuItem } from './MenuItem';

export const homeMenu = (flow: SceneFlow): MenuItem[] => [
  {
    id: 'cpu',
    label: 'START GAME',
    tag: 'VS CPU',
    enabled: true,
    onSelect: () => flow.toFight({ mode: 'cpu', cpu: 'random' }),
  },
  { id: 'online', label: 'ONLINE', tag: 'SOON', enabled: false }, // step 5: opens the lobby
  { id: 'options', label: 'OPTIONS', enabled: true, onSelect: () => flow.toOptions() },
];
