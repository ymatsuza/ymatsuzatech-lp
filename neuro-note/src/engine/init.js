import { mulberry32 } from "./rng.js";

// 1層分のランダム初期化。He(ReLU)/Xavier(その他) 風のスケールで小さな乱数を入れる。
// W[j][i] = 入力i → 出力j の重み。b は 0 始まり。
export function randomLayer(nIn, nOut, act, seed) {
  const r = mulberry32(seed);
  const scale = act === "relu" ? Math.sqrt(2 / nIn) : Math.sqrt(1 / nIn);
  const W = Array.from({ length: nOut }, () =>
    Array.from({ length: nIn }, () => (r() * 2 - 1) * scale)
  );
  const b = Array.from({ length: nOut }, () => 0);
  return { W, b, act };
}
