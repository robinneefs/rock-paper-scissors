import { defaultRules, defaultTimings, mathRandomRng } from '@rps/core';
import { browserClock } from './browserClock';
import { RandomCpu } from './cpu/RandomCpu';
import { LocalSession } from './LocalSession';
import type { MatchSession, MatchSetup } from './MatchSession';

/**
 * Builds the session a match setup describes. Online play adds a branch here (step 5).
 * Each match gets its own copy of the rules and timings, so the dev tuning panel's edits
 * apply from the next match instead of changing one halfway through.
 */
export function createSession(setup: MatchSetup): MatchSession {
  const rules = structuredClone(defaultRules);
  const timings = structuredClone(defaultTimings);
  switch (setup.mode) {
    case 'cpu':
      return new LocalSession(rules, timings, browserClock, mathRandomRng, new RandomCpu());
  }
}
