// "Golden virus" — the Golden-Cookie equivalent. A rare pickup that grants a
// brief production frenzy or an instant lucky payout. Pure logic; the caller
// passes the current balance/rate so this module stays free of economy imports.

import { byId as perkById } from './perks.js';

const FRENZY_MULT = 7;
const FRENZY_MS = 30000;
const LUCKY_BANK_FRACTION = 0.13;
const LUCKY_RATE_SECONDS = 60;
const LUCKY_FLOOR = 25;
const GOLDEN_MIN_MS = 45000;
const GOLDEN_SPAN_MS = 75000;

// Random delay until the next golden virus; the goldenLuck perk shortens it.
export function goldenIntervalMs(state, rng = Math.random) {
  const level = (state.perks && state.perks.goldenLuck) || 0;
  const factor = Math.max(0.3, 1 - perkById('goldenLuck').amount * level);
  return (GOLDEN_MIN_MS + rng() * GOLDEN_SPAN_MS) * factor;
}

export function frenzyMultiplier(state, now) {
  const f = state.frenzy;
  return f && now < f.activeUntil ? f.mult : 1;
}

export function frenzyRemainingMs(state, now) {
  return state.frenzy ? Math.max(0, state.frenzy.activeUntil - now) : 0;
}

/** Decide the reward. `rng` returns [0,1). */
export function rollGolden({ balance = 0, rate = 0, rng = Math.random }) {
  if (rng() < 0.5) {
    return { type: 'frenzy', mult: FRENZY_MULT, durMs: FRENZY_MS };
  }
  const gain = Math.max(Math.floor(balance * LUCKY_BANK_FRACTION), Math.floor(rate * LUCKY_RATE_SECONDS), LUCKY_FLOOR);
  return { type: 'lucky', gain };
}

export function applyGolden(state, effect, now) {
  if (effect.type === 'frenzy') {
    return { ...state, frenzy: { activeUntil: now + effect.durMs, mult: effect.mult } };
  }
  if (effect.type === 'lucky') {
    const g = effect.gain;
    return { ...state, balance: state.balance + g, totalProduced: state.totalProduced + g, tierProduced: state.tierProduced + g };
  }
  return state;
}
