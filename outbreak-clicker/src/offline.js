// Pure offline-progress calculation. While away, the player earns auto-spread
// (without the outbreak bonus), capped to avoid runaway gains.

import { autoRate, globalMultiplier } from './economy.js';
import { byId } from './upgrades.js';
import { byId as perkById } from './perks.js';

const BASE_CAP_SEC = 28800; // 8 hours

function capSeconds(state) {
  const latency = state.upgrades?.latency || 0;
  const deep = state.perks?.offlineDeep || 0;
  return BASE_CAP_SEC + byId('latency').amount * latency + perkById('offlineDeep').amount * deep;
}

/**
 * @returns {{ gain: number, cappedMs: number }}
 */
export function offlineGain(state, elapsedMs) {
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  if (elapsedSec === 0) return { gain: 0, cappedMs: 0 };
  const cappedSec = Math.min(elapsedSec, capSeconds(state));
  const rate = autoRate(state) * globalMultiplier(state); // no outbreak offline
  return { gain: rate * cappedSec, cappedMs: cappedSec * 1000 };
}

/** Apply offline gain to a state. Returns { state, gain } (state unchanged if gain is 0). */
export function applyOfflineGain(state, elapsedMs) {
  const { gain } = offlineGain(state, elapsedMs);
  if (gain <= 0) return { state, gain: 0 };
  return {
    state: { ...state, balance: state.balance + gain, totalProduced: state.totalProduced + gain, tierProduced: state.tierProduced + gain },
    gain,
  };
}
