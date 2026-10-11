import { describe, expect, it } from 'vitest';
import { MONITOR } from '../src/config/layout';
import { STAGES, stageFor } from '../src/config/stages';

describe('stages', () => {
  it('have unique ids and paint a full, opaque monitor-sized backdrop', () => {
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(STAGES.length);
    for (const stage of STAGES) {
      const buf = stage.paint();
      expect([buf.width, buf.height]).toEqual([MONITOR.width, MONITOR.height]);
      for (let i = 3; i < buf.data.length; i += 4) expect(buf.data[i]).toBe(255);
    }
  });

  it('a seed picks every stage in turn, and ?stage= forces one', () => {
    const ids = STAGES.map((_, i) => stageFor(i + 7).id);
    expect(new Set(ids).size).toBe(STAGES.length);
    expect(stageFor(-1).id).toBe(STAGES[STAGES.length - 1]!.id);
    expect(stageFor(0, STAGES[1]!.id).id).toBe(STAGES[1]!.id);
    expect(stageFor(0, 'nope').id).toBe(STAGES[0]!.id);
  });
});
