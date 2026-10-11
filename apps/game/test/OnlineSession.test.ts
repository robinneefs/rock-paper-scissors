import { defaultRules, defaultTimings, type ServerMessage } from '@rps/core';
import { describe, expect, it } from 'vitest';
import { OnlineSession } from '../src/session/OnlineSession';
import type { SocketHandlers } from '../src/session/socket';

/** An OnlineSession on a fake socket: the test plays the room. */
function setup() {
  let t = 1000;
  let handlers!: SocketHandlers;
  const sent: unknown[] = [];
  const socket = { url: '', closed: false };
  const session = new OnlineSession({
    serverUrl: 'wss://example.test',
    roomCode: 'ABCD',
    intent: 'join',
    version: '0.6.0',
    now: () => t,
    openSocket: (url, h) => {
      socket.url = url;
      handlers = h;
      return { send: (d) => sent.push(JSON.parse(d)), close: () => (socket.closed = true) };
    },
  });
  const room = (msg: ServerMessage) => handlers.message(JSON.stringify(msg));
  const tick = (ms: number) => (t += ms);
  return { session, sent, socket, room, tick, handlers: () => handlers };
}

const state = (p1: number, p2: number, won = { p1: 0, p2: 0 }) => ({
  round: 1,
  health: { p1, p2 },
  roundsWon: won,
  winner: null,
});

describe('OnlineSession', () => {
  it('connects to the room code and says hello when the socket opens', () => {
    const { sent, socket, handlers } = setup();
    expect(socket.url).toBe('wss://example.test/room/ABCD');
    handlers().open();
    expect(sent).toEqual([{ type: 'hello', protocol: 1, version: '0.6.0', intent: 'join' }]);
  });

  it('as p2, shows you on the left: sides, health and picks are mirrored', () => {
    const { session, room } = setup();
    const seen: unknown[] = [];
    session.on('locked', (e) => seen.push(e));
    session.on('reveal', (e) => seen.push(e));
    room({ type: 'welcome', side: 'p2', rules: defaultRules, timings: defaultTimings });
    room({
      type: 'phase',
      phase: 'picking',
      msLeft: 5000,
      round: 1,
      finalRound: false,
      state: state(100, 80),
    });
    expect(session.snapshot().state.health).toEqual({ p1: 80, p2: 100 });

    room({ type: 'locked', side: 'p1' });
    room({
      type: 'reveal',
      picks: { p1: 'rock', p2: 'paper' },
      autoPicked: { p1: false, p2: true },
      outcome: { kind: 'win', picks: { p1: 'rock', p2: 'paper' }, winner: 'p2', loser: 'p1', damage: 10 },
      events: [{ type: 'damage', side: 'p1', amount: 10, health: 90 }],
      state: state(90, 80),
    });
    expect(seen[0]).toEqual({ side: 'p2' }); // the opponent locked in, on the right
    expect(seen[1]).toMatchObject({
      picks: { p1: 'paper', p2: 'rock' },
      autoPicked: { p1: true, p2: false },
      outcome: { winner: 'p1', loser: 'p2', picks: { p1: 'paper', p2: 'rock' } },
      events: [{ side: 'p2', health: 90 }],
      state: { health: { p1: 80, p2: 90 } },
    });
  });

  it('turns time left into a local countdown', () => {
    const { session, room, tick } = setup();
    room({ type: 'welcome', side: 'p1', rules: defaultRules, timings: defaultTimings });
    room({
      type: 'phase',
      phase: 'picking',
      msLeft: 5000,
      round: 1,
      finalRound: false,
      state: state(100, 100),
    });
    tick(1200);
    expect(session.snapshot().msLeft).toBe(3800);
    tick(9000);
    expect(session.snapshot().msLeft).toBe(0);
  });

  it('sends picks only while picking, and remembers my pick for the buttons', () => {
    const { session, room, sent } = setup();
    room({ type: 'welcome', side: 'p1', rules: defaultRules, timings: defaultTimings });
    session.submitPick('scissors');
    expect(sent).toEqual([]);
    room({
      type: 'phase',
      phase: 'picking',
      msLeft: 5000,
      round: 1,
      finalRound: false,
      state: state(100, 100),
    });
    session.submitPick('scissors');
    expect(sent).toEqual([{ type: 'pick', move: 'scissors' }]);
    expect(session.snapshot().myPick).toBe('scissors');
  });

  it('uses the rules the room sends', () => {
    const { session, room } = setup();
    room({
      type: 'welcome',
      side: 'p1',
      rules: { ...defaultRules, startHealth: 50 },
      timings: defaultTimings,
    });
    expect(session.rules.startHealth).toBe(50);
  });

  it('reports a refusal, a leaver and a dropped connection once, then stops', () => {
    const a = setup();
    const refused: unknown[] = [];
    a.session.on('refused', (e) => refused.push(e));
    a.session.on('disconnected', () => refused.push('disconnected'));
    a.room({ type: 'error', error: 'noRoom' });
    a.handlers().close(4000);
    expect(refused).toEqual([{ error: 'noRoom' }]);
    expect(a.socket.closed).toBe(true);

    const b = setup();
    const left: string[] = [];
    b.session.on('opponentLeft', () => left.push('left'));
    b.session.on('disconnected', () => left.push('disconnected'));
    b.room({ type: 'opponentLeft' });
    b.handlers().close(4001);
    expect(left).toEqual(['left']);

    const c = setup();
    const dropped: string[] = [];
    c.session.on('disconnected', () => dropped.push('disconnected'));
    c.handlers().close(1006);
    expect(dropped).toEqual(['disconnected']);
  });

  it('says nothing more after dispose', () => {
    const { session, handlers, socket } = setup();
    const heard: string[] = [];
    session.on('disconnected', () => heard.push('disconnected'));
    session.dispose();
    handlers().close(1000);
    expect(heard).toEqual([]);
    expect(socket.closed).toBe(true);
  });
});
