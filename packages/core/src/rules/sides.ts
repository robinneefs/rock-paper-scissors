import type { Side } from './types';

export function opponentOf(side: Side): Side {
  return side === 'p1' ? 'p2' : 'p1';
}
