// Achievement definitions and a pure check. Conditions read only from state,
// so unlocking is sticky (once in state.achievements it stays unlocked).
import { UPGRADES } from './upgrades.js';
import { STRAINS } from './strains.js';

const maxLevel = (s) => {
  const v = Object.values(s.upgrades || {});
  return v.length ? Math.max(...v) : 0;
};

export const ACHIEVEMENTS = [
  // infection totals
  { id: 'patient0', icon: '🦠', name: 'ゼロ号患者', desc: '最初の感染',       cond: (s) => (s.totalProduced || 0) >= 1 },
  { id: 'thousand', icon: '🧫', name: '千の宿主',   desc: '累計1,000感染',     cond: (s) => (s.totalProduced || 0) >= 1e3 },
  { id: 'million',  icon: '💉', name: '百万の宿主', desc: '累計100万感染',     cond: (s) => (s.totalProduced || 0) >= 1e6 },
  { id: 'billion',  icon: '☠️', name: '数十億',     desc: '累計10億感染',       cond: (s) => (s.totalProduced || 0) >= 1e9 },
  { id: 'trillion', icon: '🌌', name: '兆の彼方',   desc: '累計1兆感染',       cond: (s) => (s.totalProduced || 0) >= 1e12 },
  // balance
  { id: 'rich',     icon: '🤑', name: '感染長者',   desc: '所持100万',          cond: (s) => (s.balance || 0) >= 1e6 },
  { id: 'rich9',    icon: '💰', name: '億万長者',   desc: '所持10億',           cond: (s) => (s.balance || 0) >= 1e9 },
  // tiers
  { id: 'host',     icon: '🧍', name: '宿主制圧',   desc: '人間スケールへ',     cond: (s) => (s.tierIndex || 0) >= 1 },
  { id: 'borders',  icon: '🏙️', name: '国境を越えて', desc: '国スケールへ',       cond: (s) => (s.tierIndex || 0) >= 2 },
  { id: 'reachworld',      icon: '🛰️', name: '世界の門前',   desc: '世界スケールへ到達',   cond: (s) => (s.tierIndex || 0) >= 3 },
  { id: 'reachspace',      icon: '🪐', name: '地球を超えて', desc: '宇宙スケールへ到達',   cond: (s) => (s.tierIndex || 0) >= 4 },
  { id: 'reachgalaxy',     icon: '🌠', name: '星々の海',     desc: '銀河スケールへ到達',   cond: (s) => (s.tierIndex || 0) >= 5 },
  { id: 'reachmultiverse', icon: '🌌', name: '並行する終焉', desc: 'マルチバースへ到達',   cond: (s) => (s.tierIndex || 0) >= 6 },
  { id: 'endofworld',      icon: '💀', name: 'オムニサイド', desc: '全存在を制圧した',     cond: (s) => !!s.cleared },
  // taps
  { id: 'tap100',   icon: '👆', name: '指ならし',   desc: '100回タップ',         cond: (s) => (s.taps || 0) >= 100 },
  { id: 'tap1k',    icon: '⚡', name: '連打中毒',   desc: '1,000回タップ',       cond: (s) => (s.taps || 0) >= 1000 },
  { id: 'tap10k',   icon: '🔥', name: '腱鞘炎',     desc: '10,000回タップ',      cond: (s) => (s.taps || 0) >= 10000 },
  // outbreak
  { id: 'outbreak1', icon: '💥', name: '大流行',    desc: 'アウトブレイク発動',  cond: (s) => (s.outbreaks || 0) >= 1 },
  { id: 'outbreak25', icon: '🌊', name: '波状攻撃', desc: 'アウトブレイク25回',  cond: (s) => (s.outbreaks || 0) >= 25 },
  { id: 'golden1',  icon: '🌟', name: '金色の幸運', desc: 'ゴールデンウイルスを捕獲', cond: (s) => (s.goldens || 0) >= 1 },
  { id: 'strain2',   icon: '🧫', name: '二刀流',       desc: '株を2種類所有',        cond: (s) => Object.values(s.strains || {}).filter((l) => l >= 1).length >= 2 },
  { id: 'strainAll', icon: '🧪', name: '株コレクター', desc: '全ての株を所有',       cond: (s) => STRAINS.every((st) => ((s.strains || {})[st.id] || 0) >= 1) },
  { id: 'strainLv10',icon: '🔬', name: '純粋培養',     desc: 'いずれかの株をLv.10',  cond: (s) => Object.values(s.strains || {}).some((l) => l >= 10) },
  // upgrades
  { id: 'upg10',    icon: '🧪', name: '特化',       desc: '強化をLv.10まで',     cond: (s) => maxLevel(s) >= 10 },
  { id: 'upg50',    icon: '🧬', name: '暴走進化',   desc: '強化をLv.50まで',     cond: (s) => maxLevel(s) >= 50 },
  { id: 'allUpg',   icon: '📋', name: 'フルスペック', desc: '全強化を所持',       cond: (s) => UPGRADES.every((u) => ((s.upgrades || {})[u.id] || 0) >= 1) },
  // prestige / dna
  { id: 'dna1',     icon: '🧷', name: '初めての株', desc: '変異株を獲得',         cond: (s) => (s.dna || 0) >= 1 },
  { id: 'mutate1',  icon: '🌱', name: '進化の一歩', desc: '初めての変異',         cond: (s) => (s.prestiges || 0) >= 1 },
  { id: 'mutate5',  icon: '🌀', name: '繰り返す悪夢', desc: '5回の変異',          cond: (s) => (s.prestiges || 0) >= 5 },
  { id: 'prestige10', icon: '♾️', name: '輪廻',     desc: '10回の変異',           cond: (s) => (s.prestiges || 0) >= 10 },
  { id: 'dna25',    icon: '💜', name: '変異の達人', desc: '変異株25を保有',       cond: (s) => (s.dna || 0) >= 25 },
  { id: 'dna100',   icon: '👽', name: '変異の覇者', desc: '変異株100を保有',      cond: (s) => (s.dna || 0) >= 100 },
  // meta — must stay last; depends on all others
  { id: 'completionist', icon: '👑', name: '完全制覇', desc: '全ての実績を解除', cond: (s) => ACHIEVEMENTS.every((a) => a.id === 'completionist' || (s.achievements || {})[a.id]) },
];

function satisfied(a, state) {
  try {
    return !!a.cond(state);
  } catch {
    return false;
  }
}

/** Achievement defs that are satisfied now but not yet recorded in state.achievements. */
export function pendingAchievements(state) {
  const have = state.achievements || {};
  return ACHIEVEMENTS.filter((a) => !have[a.id] && satisfied(a, state));
}

/**
 * Unlock all currently-earned achievements, looping so chained unlocks
 * (e.g. the "completionist" meta that depends on the others) resolve too.
 * Pure: returns a new state plus the list of newly unlocked defs.
 */
export function unlockPending(state) {
  let s = state;
  const unlocked = [];
  for (let guard = 0; guard <= ACHIEVEMENTS.length; guard++) {
    const pend = pendingAchievements(s);
    if (!pend.length) break;
    const achievements = { ...s.achievements };
    for (const a of pend) achievements[a.id] = true;
    s = { ...s, achievements };
    unlocked.push(...pend);
  }
  return { state: s, unlocked };
}
