// Pure economic calculations: upgrade costs, production rates, multipliers,
// and tier progression. No DOM, no time side effects (now is passed in).

import { UPGRADES, byId } from './upgrades.js';
import { TIERS } from './tiers.js';
import { outbreakMultiplier } from './outbreak.js';
import { frenzyMultiplier } from './golden.js';
import { STRAINS, byId as strainById } from './strains.js';
import { byId as perkById } from './perks.js';
import { createState } from './state.js';

const BASE_TAP = 1;
const PRESTIGE_SCALE = 1e5; // totalProduced needed per DNA point (quadratic)

function lvl(state, id) {
  const n = state.upgrades?.[id] || 0;
  return Number.isFinite(n) ? n : 0;
}

export function upgradeCost(def, level) {
  return Math.ceil(def.baseCost * def.costGrowth ** level);
}

export function isUnlocked(state, def) {
  return state.tierIndex >= def.unlockTier;
}

export function canAfford(state, id) {
  const def = byId(id);
  if (!def || !isUnlocked(state, def)) return false;
  return state.balance >= upgradeCost(def, lvl(state, id));
}

export function applyPurchase(state, id) {
  const def = byId(id);
  if (!def || !isUnlocked(state, def) || !canAfford(state, id)) return state;
  const level = lvl(state, id);
  return {
    ...state,
    balance: state.balance - upgradeCost(def, level),
    upgrades: { ...state.upgrades, [id]: level + 1 },
  };
}

export function tapPower(state) {
  let p = BASE_TAP;
  for (const u of UPGRADES) if (u.kind === 'tapAdd') p += u.amount * lvl(state, u.id);
  return p;
}

export function autoRate(state) {
  let r = 0;
  for (const u of UPGRADES) if (u.kind === 'autoAdd') r += u.amount * lvl(state, u.id);
  return r;
}

export function globalMultiplier(state) {
  let m = 1;
  for (const u of UPGRADES) if (u.kind === 'globalMul') m *= u.amount ** lvl(state, u.id);
  return m * prestigeMultiplier(state) * strainAmp(state);
}

// --- Mutation prestige (NG+) ---

export function prestigeMultiplier(state) {
  return 1 + perkById('potency').amount * perkLevel(state, 'potency');
}

// --- prestige perks (bought with DNA in the 研究所) ---

function perkLevel(state, id) {
  return (state.perks || {})[id] || 0;
}

export function perkLevelOf(state, id) {
  return perkLevel(state, id);
}

export function tapMultiplier(state) {
  return 1 + perkById('tapBoost').amount * perkLevel(state, 'tapBoost');
}

export function perkCost(state, id) {
  const p = perkById(id);
  if (!p || perkLevel(state, id) >= p.maxLevel) return Infinity;
  return Math.ceil(p.baseCost * p.costGrowth ** perkLevel(state, id));
}

export function canBuyPerk(state, id) {
  const p = perkById(id);
  return !!p && perkLevel(state, id) < p.maxLevel && (state.dna || 0) >= perkCost(state, id);
}

export function buyPerk(state, id) {
  if (!canBuyPerk(state, id)) return state;
  const lvl = perkLevel(state, id);
  return { ...state, dna: (state.dna || 0) - perkCost(state, id), perks: { ...state.perks, [id]: lvl + 1 } };
}

export function prestigeGain(state) {
  const g = Math.sqrt((state.totalProduced || 0) / PRESTIGE_SCALE);
  return Number.isFinite(g) ? Math.floor(g) : 0;
}

export function canPrestige(state) {
  return prestigeGain(state) >= 1;
}

export function applyPrestige(state) {
  if (!canPrestige(state)) return state;
  const fresh = createState();
  // strains are part of the permanent collection: keep the roster, reset levels
  const keptStrains = {};
  for (const id of Object.keys(state.strains || { origin: 1 })) keptStrains[id] = 1;
  // perks are permanent; seedBank grants a starting bank each run
  const perks = state.perks || {};
  const startBalance = perks.seedBank ? 10 ** perks.seedBank : 0;
  return {
    ...fresh,
    balance: startBalance,
    strains: keptStrains,
    perks,
    dna: (state.dna || 0) + prestigeGain(state),
    prestiges: (state.prestiges || 0) + 1,
    cleared: state.cleared,
    settings: state.settings,
    score: state.score,
  };
}

export function scoreMultiplier(state) {
  let m = 1;
  for (const u of UPGRADES) if (u.kind === 'scoreMul') m *= u.amount ** lvl(state, u.id);
  return m;
}

export function tapGain(state, now) {
  return tapPower(state) * globalMultiplier(state) * outbreakMultiplier(state, now) * frenzyMultiplier(state, now) * tapMultiplier(state);
}

export function effectiveRate(state, now) {
  return (strainAutoTotal(state) + autoRate(state)) * globalMultiplier(state) * outbreakMultiplier(state, now) * frenzyMultiplier(state, now);
}

// --- Virus strains (multiple tappable entities) ---

function strainLevel(state, id) {
  return (state.strains || {})[id] || 0;
}

export function ownedStrains(state) {
  return STRAINS.filter((s) => strainLevel(state, s.id) >= 1);
}

export function globalTapAdd(state) {
  return tapPower(state) - 1; // tap bonus from virulence, shared by all strains
}

export function strainAmp(state) {
  let m = 1;
  for (const s of ownedStrains(state)) if (s.trait === 'amplifier') m *= s.amp ** strainLevel(state, s.id);
  return m;
}

export function strainAutoTotal(state) {
  let r = 0;
  for (const s of ownedStrains(state)) r += s.baseAuto * strainLevel(state, s.id);
  return r;
}

export function strainTapValue(state, id, now) {
  const def = strainById(id);
  const level = strainLevel(state, id);
  if (!def || level < 1) return 0;
  return (def.baseTap * level + globalTapAdd(state)) * globalMultiplier(state) * outbreakMultiplier(state, now) * frenzyMultiplier(state, now) * tapMultiplier(state);
}

export function nextStrain(state) {
  return STRAINS.find((s) => strainLevel(state, s.id) < 1); // first unowned, in order
}

export function synthCost(state) {
  const n = nextStrain(state);
  return n ? n.synthCost : Infinity;
}

export function canSynthesize(state) {
  const n = nextStrain(state);
  return !!n && state.balance >= n.synthCost;
}

export function synthesizeStrain(state) {
  const n = nextStrain(state);
  if (!n || state.balance < n.synthCost) return state;
  return { ...state, balance: state.balance - n.synthCost, strains: { ...state.strains, [n.id]: 1 } };
}

export function strainLevelCost(state, id) {
  const def = strainById(id);
  if (!def) return Infinity;
  const level = strainLevel(state, id);
  const base = Math.max(10, def.synthCost * 0.1);
  return Math.ceil(base * 1.2 ** Math.max(0, level - 1));
}

export function canLevelStrain(state, id) {
  return strainLevel(state, id) >= 1 && state.balance >= strainLevelCost(state, id);
}

export function levelUpStrain(state, id) {
  if (!canLevelStrain(state, id)) return state;
  const level = strainLevel(state, id);
  return { ...state, balance: state.balance - strainLevelCost(state, id), strains: { ...state.strains, [id]: level + 1 } };
}

export function tierThreshold(state) {
  return TIERS[state.tierIndex].threshold;
}

export function tierProgress(state) {
  const p = state.tierProduced / tierThreshold(state);
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(1, p));
}

export function isTierComplete(state) {
  return state.tierIndex < TIERS.length - 1 && state.tierProduced >= tierThreshold(state);
}

export function isFinalCleared(state) {
  return state.tierIndex === TIERS.length - 1 && state.tierProduced >= tierThreshold(state);
}

export function advanceTier(state) {
  if (!isTierComplete(state)) return state;
  return { ...state, tierIndex: state.tierIndex + 1, tierProduced: 0 };
}
