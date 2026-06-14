// Data: prestige perks bought with DNA (変異株) in the 研究所. Permanent —
// they persist across mutations. Effects are interpreted by `kind`:
//   globalMul -> +amount global production per level (prestige multiplier)
//   tapMul    -> +amount tap power per level
//   seedBank  -> start each run with 10^level infections
//   golden    -> golden virus appears more often
//   offline   -> +amount seconds of offline cap per level

export const PERKS = [
  { id: 'potency',    name: '増殖効率', icon: '🧬', kind: 'globalMul', amount: 0.05, baseCost: 1, costGrowth: 1.3, maxLevel: 100, desc: '全生産 +5% / Lv' },
  { id: 'tapBoost',   name: '神経強化', icon: '⚡', kind: 'tapMul',    amount: 0.10, baseCost: 1, costGrowth: 1.5, maxLevel: 60,  desc: 'タップ威力 +10% / Lv' },
  { id: 'seedBank',   name: '種銭',     icon: '💰', kind: 'seedBank',  amount: 1,    baseCost: 2, costGrowth: 1.7, maxLevel: 12,  desc: '変異後の開始所持を増やす' },
  { id: 'goldenLuck', name: '好機',     icon: '🍀', kind: 'golden',    amount: 0.08, baseCost: 3, costGrowth: 1.8, maxLevel: 10,  desc: 'ゴールデン出現が早まる' },
  { id: 'offlineDeep',name: '深い眠り', icon: '🌙', kind: 'offline',   amount: 7200, baseCost: 2, costGrowth: 1.6, maxLevel: 12,  desc: 'オフライン上限 +2時間 / Lv' },
];

const INDEX = new Map(PERKS.map((p) => [p.id, p]));

export function byId(id) {
  return INDEX.get(id);
}
