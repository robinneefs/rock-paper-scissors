import type { Clock } from '@rps/core';

/** The referee's clock in the browser. */
export const browserClock: Clock = {
  now: () => performance.now(),
  schedule(ms, fn) {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
  },
};
