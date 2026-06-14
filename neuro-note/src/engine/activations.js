// 各活性化関数は要素ごとの { f, df }。
// df(x) は「事前活性 x における出力の微分」。逆伝播で使う。
const sig = (x) => 1 / (1 + Math.exp(-x));

export const ACT = {
  sigmoid: { f: sig, df: (x) => { const s = sig(x); return s * (1 - s); } },
  tanh: { f: Math.tanh, df: (x) => { const t = Math.tanh(x); return 1 - t * t; } },
  relu: { f: (x) => (x > 0 ? x : 0), df: (x) => (x > 0 ? 1 : 0) },
  // step は微分が常に0で学習できない。「だから滑らかな活性化が要る」を見せる比較用。
  step: { f: (x) => (x >= 0 ? 1 : 0), df: () => 0 },
  identity: { f: (x) => x, df: () => 1 },
};

// softmax は出力層用のベクトル演算。数値安定化のため最大値を引く。
export function softmax(zs) {
  const m = Math.max(...zs);
  const ex = zs.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}
