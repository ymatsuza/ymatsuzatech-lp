import {
  levelThreshold, tapPower, passiveRate, unlockCost, upgradeCost,
} from "./economy.js";
import { defaultAvatar } from "./avatar.js";

const STORAGE_KEY = "kizuna-clicker-save";
const VERSION = 2;
const OFFLINE_CAP_SECONDS = 8 * 3600;
const MAX_NAME_LEN = 12;

const NAME_A = ["あか", "あお", "き", "みどり", "むらさき", "しろ", "そら", "ひ"];
const NAME_B = ["まる", "ぽん", "たま", "ち", "すけ", "ろう", "な", "こ"];

function nameFromSeed(seed) {
  return NAME_A[seed % NAME_A.length] + NAME_B[Math.floor(seed / 8) % NAME_B.length];
}

function createPerson(id, resident = true) {
  const seed = Math.floor(Math.random() * 1e9);
  return {
    id, seed, name: nameFromSeed(seed), avatar: defaultAvatar(seed),
    affection: 0, level: 0, story: [], present: true, resident,
  };
}

function nextId(state) {
  return state.people.reduce((m, p) => Math.max(m, p.id), -1) + 1;
}

export function residentCount(state) {
  return state.people.reduce((n, p) => n + (p.resident ? 1 : 0), 0);
}

// Fill in fields missing from older saves so we never discard progress.
function normalizePerson(p) {
  const seed = typeof p.seed === "number" ? p.seed : 0;
  if (!p.avatar) p.avatar = defaultAvatar(seed);
  if (typeof p.name !== "string" || p.name === "") p.name = nameFromSeed(seed);
  if (!Array.isArray(p.story)) p.story = [];
  if (typeof p.present !== "boolean") p.present = true;
  if (typeof p.resident !== "boolean") p.resident = true; // old people stay (never leave)
  return p;
}

export function renamePerson(person, raw) {
  const n = String(raw ?? "").trim().slice(0, MAX_NAME_LEN);
  if (n) person.name = n;
  return person;
}

const STORY_CAP = 40;

export function logStory(person, text, cap = STORY_CAP) {
  if (!Array.isArray(person.story)) person.story = [];
  person.story.push(text);
  if (person.story.length > cap) person.story.splice(0, person.story.length - cap);
  return person;
}

// --- population: people drift in and out over time ---
export const STAY_LEVEL = 3;     // a visitor who reaches this level settles in for good
export const PRESENT_CAP = 8;    // soft cap on how many drift in on their own

// Visitors who have grown close enough become permanent residents.
export function promoteResidents(state) {
  const promoted = [];
  for (const p of state.people) {
    if (p.present && !p.resident && p.level >= STAY_LEVEL) {
      p.resident = true;
      promoted.push(p);
    }
  }
  return promoted;
}

// One population step: a neglected visitor may leave (kizuna kept), and someone may arrive
// (a returning person or a brand-new visitor). Returns { left, arrived }.
export function stepPopulation(state, rng = Math.random) {
  promoteResidents(state);
  const left = [];
  const arrived = [];

  const visitors = state.people.filter((p) => p.present && !p.resident);
  if (visitors.length > 0 && rng() < 0.5) {
    const v = visitors[Math.floor(rng() * visitors.length)];
    v.present = false;
    left.push(v);
  }

  const presentCount = state.people.filter((p) => p.present).length;
  if (presentCount < PRESENT_CAP && rng() < 0.7) {
    const away = state.people.filter((p) => !p.present);
    if (away.length > 0 && rng() < 0.6) {
      const back = away[Math.floor(rng() * away.length)];
      back.present = true;
      arrived.push(back);
    } else {
      const v = createPerson(nextId(state), false);
      state.people.push(v);
      arrived.push(v);
    }
  }

  return { left, arrived };
}

export function createNewState(now = Date.now()) {
  return {
    version: VERSION,
    hearts: 0,
    people: [createPerson(0)],
    upgrades: { tapPowerLevel: 0, passiveMultLevel: 0 },
    lastSeen: now,
    boostUntil: 0,
  };
}

// --- rewarded-ad boost: temporarily multiplies hearts earned (tap + passive) ---
export const BOOST_MULT = 2;
export const BOOST_SECONDS = 60;

export function activateBoost(state, durationSec = BOOST_SECONDS, now = Date.now()) {
  state.boostUntil = Math.max(state.boostUntil || 0, now + durationSec * 1000);
  return state;
}

export function boostActive(state, now = Date.now()) {
  return (state.boostUntil || 0) > now;
}

export function heartsMultiplier(state, now = Date.now()) {
  return boostActive(state, now) ? BOOST_MULT : 1;
}

export function totalLevels(state) {
  return state.people.reduce((sum, p) => sum + p.level, 0);
}

export function applyAffection(person, amount) {
  person.affection += amount;
  while (person.affection >= levelThreshold(person.level)) {
    person.level += 1;
  }
  return person;
}

export function tapPerson(state, personId, heartsMult = 1) {
  const p = state.people.find((x) => x.id === personId);
  if (!p) return state;
  const power = tapPower(state.upgrades.tapPowerLevel);
  state.hearts += power * heartsMult; // boost affects currency only
  applyAffection(p, power);           // relationship is always earned 1:1
  return state;
}

export function tick(state, dtSeconds, mult = 1) {
  const rate = passiveRate(totalLevels(state), state.upgrades.passiveMultLevel);
  state.hearts += rate * dtSeconds * mult;
  return state;
}

export function tryUnlockPerson(state) {
  const cost = unlockCost(residentCount(state));
  if (state.hearts < cost) return false;
  state.hearts -= cost;
  state.people.push(createPerson(nextId(state), true));
  return true;
}

export function tryBuyUpgrade(state, kind) {
  const level = kind === "tapPower"
    ? state.upgrades.tapPowerLevel
    : state.upgrades.passiveMultLevel;
  const cost = upgradeCost(kind, level);
  if (state.hearts < cost) return false;
  state.hearts -= cost;
  if (kind === "tapPower") state.upgrades.tapPowerLevel += 1;
  else state.upgrades.passiveMultLevel += 1;
  return true;
}

export function save(state, storage = globalThis.localStorage) {
  if (!storage) return;
  state.lastSeen = Date.now();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[kizuna] save failed:", e);
  }
}

export function load(storage = globalThis.localStorage) {
  if (!storage) return createNewState();
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[kizuna] load failed, new game:", e);
    return createNewState();
  }
  if (!raw) return createNewState();
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.people)) {
      console.warn("[kizuna] save invalid, new game");
      return createNewState();
    }
    // Migrate older saves rather than discarding progress.
    data.people.forEach(normalizePerson);
    if (!data.upgrades) data.upgrades = { tapPowerLevel: 0, passiveMultLevel: 0 };
    if (typeof data.boostUntil !== "number") data.boostUntil = 0;
    data.version = VERSION;
    return data;
  } catch (e) {
    console.warn("[kizuna] save corrupt, new game:", e);
    return createNewState();
  }
}

export function applyOfflineProgress(state, now = Date.now()) {
  const elapsedMs = Math.max(0, now - (state.lastSeen ?? now));
  const elapsedSec = Math.min(elapsedMs / 1000, OFFLINE_CAP_SECONDS);
  const rate = passiveRate(totalLevels(state), state.upgrades.passiveMultLevel);
  const gained = rate * elapsedSec;
  state.hearts += gained;
  state.lastSeen = now;
  return gained;
}
