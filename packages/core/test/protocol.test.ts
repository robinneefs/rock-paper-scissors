import { describe, expect, it } from 'vitest';
import { isRoomCode, parseClientMessage, randomRoomCode, ROOM_CODE_LETTERS, seededRng } from '../src';

describe('online protocol', () => {
  it('accepts exactly the known client messages', () => {
    expect(parseClientMessage('{"type":"pick","move":"block"}')).toEqual({ type: 'pick', move: 'block' });
    expect(parseClientMessage('{"type":"hello","protocol":1,"version":"0.6.0","intent":"join"}')).toEqual({
      type: 'hello',
      protocol: 1,
      version: '0.6.0',
      intent: 'join',
    });
    expect(parseClientMessage('{"type":"ready","extra":1}')).toEqual({ type: 'ready' });
  });

  it('refuses anything else', () => {
    for (const raw of [
      '{"type":"pick","move":"laser"}',
      '{"type":"hello","protocol":1,"version":"0.6.0","intent":"spectate"}',
      '{"type":"nuke"}',
      'null',
      '"pick"',
      'not json',
      42,
      `{"type":"ready","pad":"${'x'.repeat(600)}"}`,
    ])
      expect(parseClientMessage(raw)).toBeNull();
  });

  it('makes room codes of four letters from the allowed set, without vowels', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 50; i++) expect(isRoomCode(randomRoomCode(() => rng.next()))).toBe(true);
    expect(ROOM_CODE_LETTERS).not.toMatch(/[AEIOUY]/);
    expect(isRoomCode('BCD')).toBe(false);
    expect(isRoomCode('BCDA')).toBe(false);
  });
});
