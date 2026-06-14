// Game loop. `tick` is pure and unit-tested; `start` is a thin rAF driver
// (dependencies injected) verified by playing the game.

import { effectiveRate, isTierComplete, advanceTier, isFinalCleared } from './economy.js';

const MAX_DT_MS = 60000; // ignore absurd gaps (tab asleep) — offline handles long away time

/** Advance the simulation by dtMs. Returns a new state. */
export function tick(state, dtMs, now) {
  const dt = Math.max(0, Math.min(MAX_DT_MS, dtMs));
  if (dt === 0) return state;
  const gain = effectiveRate(state, now) * (dt / 1000);
  return {
    ...state,
    balance: state.balance + gain,
    totalProduced: state.totalProduced + gain,
    tierProduced: state.tierProduced + gain,
    playMs: (state.playMs || 0) + dt,
  };
}

/**
 * Start the rAF-driven loop. Returns a stop() function.
 * deps: { getState, setState, onTick, onTierComplete, onCleared, now, raf }
 */
export function start({ getState, setState, onTick, onTierComplete, onCleared, now, raf }) {
  let last = now();
  let running = true;

  function frame() {
    if (!running) return;
    const t = now();
    const dt = t - last;
    last = t;

    let s = tick(getState(), dt, t);

    while (isTierComplete(s)) {
      const from = s.tierIndex;
      s = advanceTier(s);
      onTierComplete?.(from, s.tierIndex);
    }
    if (!s.cleared && isFinalCleared(s)) {
      s = { ...s, cleared: true };
      onCleared?.(s);
    }

    setState(s);
    onTick?.(s);
    raf(frame);
  }

  raf(frame);
  return () => {
    running = false;
  };
}
