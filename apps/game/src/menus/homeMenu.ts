import { SERVER_URL } from '../config/online';
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
  // greyed out in a build that has no match server address
  SERVER_URL
    ? { id: 'online', label: 'ONLINE', tag: 'VS FRIEND', enabled: true, onSelect: () => flow.toLobby() }
    : { id: 'online', label: 'ONLINE', tag: 'SOON', enabled: false },
  { id: 'howto', label: 'HOW TO PLAY', enabled: true, onSelect: () => flow.toHowTo() },
  { id: 'options', label: 'OPTIONS', enabled: true, onSelect: () => flow.toOptions() },
];
