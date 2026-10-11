import { opponentOf, type MatchState, type RefereeEvents, type RuleEvent, type Side } from '@rps/core';

/**
 * Online you may really be p2, but you are always shown on the left as p1 (the gap table's
 * recommended choice). These turn the room's real sides into the seat the screen shows, so
 * scenes, the director and the HUD stay exactly as they are for the CPU match.
 */
export class SideMirror {
  constructor(private readonly real: Side) {}

  side(s: Side): Side {
    return this.real === 'p1' ? s : opponentOf(s);
  }

  record<T>(r: Record<Side, T>): Record<Side, T> {
    return { p1: r[this.side('p1')], p2: r[this.side('p2')] };
  }

  state(s: MatchState): MatchState {
    return {
      ...s,
      health: this.record(s.health),
      roundsWon: this.record(s.roundsWon),
      winner: s.winner && this.side(s.winner),
    };
  }

  reveal(e: RefereeEvents['reveal']): RefereeEvents['reveal'] {
    const { outcome } = e;
    return {
      picks: this.record(e.picks),
      autoPicked: this.record(e.autoPicked),
      outcome:
        outcome.kind === 'tie'
          ? { kind: 'tie', picks: this.record(outcome.picks) }
          : {
              ...outcome,
              picks: this.record(outcome.picks),
              winner: this.side(outcome.winner),
              loser: this.side(outcome.loser),
            },
      events: e.events.map((ev): RuleEvent => ({ ...ev, side: this.side(ev.side) })),
      state: this.state(e.state),
    };
  }
}
