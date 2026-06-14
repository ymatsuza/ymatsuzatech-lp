// Data: the zoom tiers. `threshold` is the cumulative `tierProduced` needed
// (within the current tier) to fill the infection bar and zoom out.
// The progression past 世界 (space → galaxy → multiverse) is intentionally not
// surfaced in the UI ahead of time — each zoom-out is a reveal.

export const TIERS = [
  { id: 'organ',      name: '臓器',         host: '肺',           threshold: 1e3 },
  { id: 'human',      name: '人間',         host: '全身',         threshold: 1e5 },
  { id: 'country',    name: '国',           host: '国',           threshold: 5e6 },
  { id: 'world',      name: '世界',         host: '世界',         threshold: 2.5e8 },
  { id: 'space',      name: '宇宙',         host: '太陽系',       threshold: 1e11 },
  { id: 'galaxy',     name: '銀河',         host: '天の川銀河',   threshold: 1e14 },
  { id: 'multiverse', name: 'マルチバース', host: '並行宇宙',     threshold: 1e17 },
];
