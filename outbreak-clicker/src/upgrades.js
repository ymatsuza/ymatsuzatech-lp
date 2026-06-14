// Data: upgrade definitions. Effects are interpreted by economy.js / outbreak.js
// by `kind`. `amount` meaning depends on kind:
//   tapAdd   -> +tap power per level
//   autoAdd  -> +infections/sec per level
//   globalMul-> production multiplied by amount^level
//   scoreMul -> endless score multiplied by amount^level
//   offline  -> +seconds of offline cap per level
//   outbreak -> { durMs, mul } added per level

export const UPGRADES = [
  { id: 'virulence',     name: '感染力',             icon: '🦠', kind: 'tapAdd',   baseCost: 15,     costGrowth: 1.15, amount: 2,                    unlockTier: 0, desc: 'タップ威力 +2' },
  { id: 'replication',   name: '自己増殖',           icon: '💧', kind: 'autoAdd',  baseCost: 100,    costGrowth: 1.15, amount: 1,                    unlockTier: 0, desc: '自動拡散 +1/s' },
  { id: 'mutation',      name: '増殖速度',           icon: '🧬', kind: 'globalMul', baseCost: 1100,   costGrowth: 1.20, amount: 1.06,                 unlockTier: 0, desc: '全生産 ×1.06' },
  { id: 'outbreakBoost', name: 'アウトブレイク強化', icon: '💥', kind: 'outbreak', baseCost: 2500,   costGrowth: 1.6,  amount: { durMs: 2000, mul: 1 }, unlockTier: 0, desc: '発動 +2秒 / 倍率 +1' },
  { id: 'latency',       name: '潜伏',               icon: '🌙', kind: 'offline',  baseCost: 5000,   costGrowth: 1.5,  amount: 3600,                 unlockTier: 1, desc: 'オフライン上限 +1時間' },
  { id: 'droplet',       name: '飛沫感染',           icon: '💨', kind: 'autoAdd',  baseCost: 12000,  costGrowth: 1.15, amount: 25,                   unlockTier: 1, desc: '自動拡散 +25/s' },
  { id: 'airborne',      name: '空気感染',           icon: '🌫️', kind: 'globalMul', baseCost: 130000, costGrowth: 1.28, amount: 1.15,                 unlockTier: 1, desc: '全生産 ×1.15' },
  { id: 'contact',       name: '接触感染',           icon: '🤝', kind: 'autoAdd',  baseCost: 1.4e6,  costGrowth: 1.15, amount: 1500,                 unlockTier: 2, desc: '自動拡散 +1500/s' },
  { id: 'lethality',     name: '致死性',             icon: '☠️', kind: 'scoreMul', baseCost: 1.0e7,  costGrowth: 1.2,  amount: 1.05,                 unlockTier: 2, desc: 'スコア倍率 ×1.05' },
];

const INDEX = new Map(UPGRADES.map((u) => [u.id, u]));

export function byId(id) {
  return INDEX.get(id);
}
