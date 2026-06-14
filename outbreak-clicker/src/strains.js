// Data: virus strains. Each is an independently tappable entity with a trait
// (tapper / spreader / amplifier / balanced) and per-level contributions.
// Names are fictional / type-based on purpose — no real disease names (keeps the
// app clear of "sensitive event" store policies and ad-network restrictions).
// strainTapValue / strainAutoTotal / strainAmp etc. live in economy.js.
// `note` is the tap-sound base frequency (Hz) so each strain sounds distinct.

export const STRAINS = [
  { id: 'origin',  name: '起源株',       icon: '🦠', trait: 'balanced',  baseTap: 1,  baseAuto: 0,   amp: 1,    synthCost: 0,   note: 180, color: '#ff5a4d' },
  { id: 'aero',    name: 'エアロ株',     icon: '💨', trait: 'spreader',  baseTap: 2,  baseAuto: 4,   amp: 1,    synthCost: 5e3, note: 150, color: '#ffa64d' },
  { id: 'rapid',   name: 'ラピッド株',   icon: '⚡', trait: 'tapper',    baseTap: 12, baseAuto: 0.5, amp: 1,    synthCost: 4e4, note: 340, color: '#4dd2ff' },
  { id: 'phantom', name: 'ファントム株', icon: '👻', trait: 'spreader',  baseTap: 4,  baseAuto: 24,  amp: 1,    synthCost: 4e5, note: 120, color: '#a06bff' },
  { id: 'crimson', name: 'クリムゾン株', icon: '🩸', trait: 'tapper',    baseTap: 60, baseAuto: 3,   amp: 1,    synthCost: 5e6, note: 270, color: '#ff4d6a' },
  { id: 'omega',   name: 'オメガ株',     icon: '🧬', trait: 'amplifier', baseTap: 8,  baseAuto: 8,   amp: 1.03, synthCost: 6e7, note: 210, color: '#d24dff' },
];

const INDEX = new Map(STRAINS.map((s) => [s.id, s]));

export function byId(id) {
  return INDEX.get(id);
}
