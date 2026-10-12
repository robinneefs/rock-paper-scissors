export type Move = 'rock' | 'paper' | 'scissors';
export type Side = 'p1' | 'p2';

export const MOVES: readonly Move[] = ['rock', 'paper', 'scissors'];
export const SIDES: readonly Side[] = ['p1', 'p2'];

export interface RulesConfig {
  /** Which move each move beats: rock beats scissors, scissors beats paper, paper beats rock. */
  beats: Record<Move, Move>;
  /** Damage dealt to the loser when this move wins the exchange. */
  damage: Record<Move, number>;
  startHealth: number;
  /** Rounds needed to win the match (2 = best of three). */
  roundsToWin: number;
}

export type Picks = Record<Side, Move>;

export interface MatchState {
  /** 1-based number of the round being played (or the last one, once the match is over). */
  round: number;
  health: Record<Side, number>;
  roundsWon: Record<Side, number>;
  /** Set when the match is over. */
  winner: Side | null;
}

export type ExchangeOutcome =
  { kind: 'tie'; picks: Picks } | { kind: 'win'; picks: Picks; winner: Side; loser: Side; damage: number };

export type RuleEvent =
  | { type: 'damage'; side: Side; amount: number; health: number }
  | { type: 'ko'; side: Side }
  | { type: 'roundWon'; side: Side; round: number; roundsWon: number }
  | { type: 'matchWon'; side: Side };
