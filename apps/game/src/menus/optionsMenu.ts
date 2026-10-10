import type { ScalingMode } from '../platform/settings';
import type { MenuItem } from './MenuItem';

/** Shown names of the scaling modes (the tag on the SCALING item). */
export const SCALING_LABEL: Record<ScalingMode, string> = {
  pixelPerfect: 'PIXEL PERFECT',
  fillHeight: 'FILL HEIGHT',
};

/** Two lines under the menu saying what the current mode does. */
export const SCALING_HINT: Record<ScalingMode, [string, string]> = {
  pixelPerfect: ['SHARPEST: EVERY PIXEL', 'THE SAME SIZE'],
  fillHeight: ['BIGGER: FILLS THE SCREEN', 'PIXELS MAY BE A BIT UNEVEN'],
};

export const optionsMenu = (
  scaling: ScalingMode,
  actions: { cycleScaling: () => void; back: () => void },
): MenuItem[] => [
  {
    id: 'scaling',
    label: 'SCALING',
    tag: SCALING_LABEL[scaling],
    enabled: true,
    onSelect: actions.cycleScaling,
  },
  { id: 'back', label: 'BACK', enabled: true, onSelect: actions.back },
];
