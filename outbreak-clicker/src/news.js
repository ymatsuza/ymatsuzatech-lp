// Flavor "breaking news" headlines for the ticker. Eligibility is gated by the
// tier reached (and a world-clear flag), so the news tracks the outbreak.

export const HEADLINES = [
  { text: '速報：未確認の病原体を検出', minTier: 0 },
  { text: '保健当局「現時点で危険性は低い」', minTier: 0 },
  { text: '研究所で異常なサンプルを確認', minTier: 0 },
  { text: '最初の感染者が入院', minTier: 1 },
  { text: '病院に発熱外来の長い行列', minTier: 1 },
  { text: '専門家「ヒト‐ヒト感染の可能性」', minTier: 1 },
  { text: '複数都市で市中感染を確認', minTier: 2 },
  { text: '政府、渡航制限を検討', minTier: 2 },
  { text: '株価が世界的に急落', minTier: 2 },
  { text: 'WHO、パンデミックを宣言', minTier: 3 },
  { text: '各国で都市封鎖が拡大', minTier: 3 },
  { text: '医療体制、限界に', minTier: 3 },
  { text: '人類、沈黙——', cleared: true },
  { text: '地球は静かになった', cleared: true },
];

export function eligibleHeadlines(state) {
  const tier = state.tierIndex || 0;
  const cleared = !!state.cleared;
  return HEADLINES.filter((h) => (h.cleared ? cleared : tier >= (h.minTier || 0)));
}

export function pickHeadline(state, rng = Math.random) {
  const pool = eligibleHeadlines(state);
  if (!pool.length) return '';
  return pool[Math.floor(rng() * pool.length)].text;
}
