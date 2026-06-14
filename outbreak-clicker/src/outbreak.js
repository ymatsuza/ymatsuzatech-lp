// Pure "Outbreak" boost state machine. Tapping fills a meter; when full the
// player can trigger a timed production multiplier, followed by a cooldown.
// Functions that change state return a new state object (no mutation).

const BASE_MUL = 7;
const BASE_DURATION_MS = 10000;
const COOLDOWN_MS = 20000;
const PER_LEVEL_DURATION_MS = 2000;
const PER_LEVEL_MUL = 1;

function clamp(n, lo, hi) {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function boostLevel(state) {
  return state.upgrades?.outbreakBoost || 0;
}

export function meterRatio(state) {
  return clamp(state.outbreak.meter, 0, 1);
}

export function addMeter(state, amount) {
  const meter = clamp(state.outbreak.meter + amount, 0, 1);
  return { ...state, outbreak: { ...state.outbreak, meter } };
}

export function isActive(state, now) {
  return now < state.outbreak.activeUntil;
}

export function canActivate(state, now) {
  return state.outbreak.meter >= 1 && now >= state.outbreak.cooldownUntil && !isActive(state, now);
}

export function activate(state, now) {
  if (!canActivate(state, now)) return state;
  const duration = BASE_DURATION_MS + PER_LEVEL_DURATION_MS * boostLevel(state);
  const activeUntil = now + duration;
  return {
    ...state,
    outbreak: { meter: 0, activeUntil, cooldownUntil: activeUntil + COOLDOWN_MS },
  };
}

export function outbreakMultiplier(state, now) {
  return isActive(state, now) ? BASE_MUL + PER_LEVEL_MUL * boostLevel(state) : 1;
}

export function outbreakRemainingMs(state, now) {
  return Math.max(0, state.outbreak.activeUntil - now);
}
