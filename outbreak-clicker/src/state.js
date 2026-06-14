// Game state: creation, persistence, and migration.
// `storage` is injected (localStorage in the app, a fake in tests) and must
// implement getItem(key) / setItem(key, value).

export const STATE_VERSION = 1;
export const SAVE_KEY = 'outbreak-clicker.save';

export function createState() {
  return {
    version: STATE_VERSION,
    balance: 0, // spendable infections
    totalProduced: 0, // lifetime infections produced
    tierIndex: 0, // 0..3 (organ/human/country/world)
    tierProduced: 0, // cumulative infections produced in the current tier
    upgrades: {}, // id -> level
    outbreak: { meter: 0, activeUntil: 0, cooldownUntil: 0 },
    frenzy: { activeUntil: 0, mult: 1 }, // golden-virus / ad production boost
    goldens: 0, // golden viruses collected
    adCooldownUntil: 0, // next time a rewarded ad is available
    strains: { origin: 1 }, // virus strains: id -> level (origin owned at start)
    dna: 0, // 変異株 — permanent prestige currency (spent in the 研究所)
    perks: {}, // permanent prestige perks: id -> level
    prestiges: 0, // number of mutations performed
    taps: 0, // lifetime taps (for achievements)
    outbreaks: 0, // lifetime outbreak activations
    playMs: 0, // active play time (ms; accumulated by the loop)
    achievements: {}, // id -> true (sticky unlocks)
    score: 0, // endless score after world clear
    cleared: false, // reached world 100%
    lastSeen: 0, // timestamp ms of last save; 0 = never
    settings: {},
  };
}

export function save(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('outbreak-clicker: save failed', e);
    return false;
  }
}

export function load(storage) {
  let raw = null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch (e) {
    console.warn('outbreak-clicker: storage unavailable', e);
    return createState();
  }
  if (raw == null) return createState();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('outbreak-clicker: corrupt save, starting fresh', e);
    return createState();
  }

  return migrate(parsed);
}

// Backfill missing fields onto a parsed save and force the current version.
// Used by load() and by importing a save code.
export function migrate(parsed) {
  const fresh = createState();
  return {
    ...fresh,
    ...parsed,
    version: STATE_VERSION,
    upgrades: { ...(parsed.upgrades || {}) },
    outbreak: { ...fresh.outbreak, ...(parsed.outbreak || {}) },
    strains: { origin: 1, ...(parsed.strains || {}) },
    perks: { ...(parsed.perks || {}) },
    achievements: { ...(parsed.achievements || {}) },
    settings: { ...fresh.settings, ...(parsed.settings || {}) },
  };
}
