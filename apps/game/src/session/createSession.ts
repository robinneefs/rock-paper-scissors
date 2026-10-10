import { defaultRules, defaultTimings, mathRandomRng } from '@rps/core';
import { browserClock } from './browserClock';
import { RandomCpu } from './cpu/RandomCpu';
import { LocalSession } from './LocalSession';
import type { MatchSession, MatchSetup } from './MatchSession';

/** Builds the session a match setup describes. Online play adds a branch here (step 5). */
export function createSession(setup: MatchSetup): MatchSession {
  switch (setup.mode) {
    case 'cpu':
      return new LocalSession(defaultRules, defaultTimings, browserClock, mathRandomRng, new RandomCpu());
  }
}
