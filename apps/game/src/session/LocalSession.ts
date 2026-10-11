import {
  Emitter,
  opponentOf,
  Referee,
  type Clock,
  type Move,
  type PhaseTimings,
  type Rng,
  type RulesConfig,
  type Side,
  type Unsubscribe,
} from '@rps/core';
import type { MatchSession, MatchView, SessionEvents } from './MatchSession';
import type { MoveSource } from './MoveSource';

/** A match on this device: owns the referee; the opponent's picks come from a move source. */
export class LocalSession implements MatchSession {
  readonly me: Side = 'p1';
  readonly opponentName = 'CPU';
  private readonly events = new Emitter<SessionEvents>();
  private readonly referee: Referee;
  private readonly unsubs: Unsubscribe[] = [];
  private myPick: Move | null = null;

  constructor(
    readonly rules: RulesConfig,
    timings: PhaseTimings,
    private readonly clock: Clock,
    private readonly rng: Rng,
    private readonly opponent: MoveSource,
  ) {
    this.referee = new Referee(rules, timings, clock, rng);
    const them = opponentOf(this.me);
    this.unsubs.push(
      this.referee.on('phase', (e) => {
        if (e.phase === 'picking') {
          this.myPick = null;
          this.opponent.onPickingStarted(
            { side: them, state: this.referee.matchState, deadline: e.endsAt ?? 0, clock, rng },
            (move) => this.referee.submitPick(them, move),
          );
        } else {
          this.opponent.cancel();
        }
        this.events.emit('phase', e);
      }),
      this.referee.on('locked', (e) => this.events.emit('locked', e)),
      this.referee.on('reveal', (e) => this.events.emit('reveal', e)),
      this.referee.on('matchOver', (e) => this.events.emit('matchOver', e)),
    );
  }

  ready(): void {
    if (this.referee.currentPhase === 'idle' || this.referee.currentPhase === 'matchOver')
      this.referee.start();
  }

  submitPick(move: Move): void {
    if (this.referee.submitPick(this.me, move)) this.myPick = move;
  }

  /** Locally the CPU always agrees; the next ready() starts the new match. */
  requestRematch(): void {
    this.events.emit('rematchAccepted', {});
  }

  snapshot(): MatchView {
    const endsAt = this.referee.phaseEndsAt;
    return {
      phase: this.referee.currentPhase,
      state: this.referee.matchState,
      msLeft: endsAt === null ? 0 : Math.max(0, endsAt - this.clock.now()),
      myPick: this.myPick,
    };
  }

  on<E extends keyof SessionEvents>(event: E, fn: (payload: SessionEvents[E]) => void): Unsubscribe {
    return this.events.on(event, fn);
  }

  dispose(): void {
    this.opponent.cancel();
    this.unsubs.forEach((u) => u());
    this.referee.dispose();
    this.events.clear();
  }
}
