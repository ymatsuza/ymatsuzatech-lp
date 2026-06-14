// 損失関数。f は損失値、df は ∂L/∂yhat（出力に対する勾配）。
const EPS = 1e-12;
const clamp01 = (p) => Math.min(1 - EPS, Math.max(EPS, p));

export const LOSS = {
  // 平均二乗誤差（出力次元で平均）。
  mse: {
    f: (yhat, y) => yhat.reduce((s, p, i) => s + 0.5 * (p - y[i]) ** 2, 0) / yhat.length,
    df: (yhat, y) => yhat.map((p, i) => (p - y[i]) / yhat.length),
  },
  // 2値クロスエントロピー（yhat は sigmoid 後の確率, y∈{0,1}）。
  bce: {
    f: (yhat, y) =>
      yhat.reduce((s, p, i) => {
        const c = clamp01(p);
        return s - (y[i] * Math.log(c) + (1 - y[i]) * Math.log(1 - c));
      }, 0) / yhat.length,
    df: (yhat, y) =>
      yhat.map((p, i) => {
        const c = clamp01(p);
        return (c - y[i]) / (c * (1 - c)) / yhat.length;
      }),
  },
  // 多クラス交差エントロピー（yhat は softmax 後, y は one-hot）。章7用。
  ce: {
    f: (yhat, y) => -y.reduce((s, t, i) => s + t * Math.log(Math.max(EPS, yhat[i])), 0),
    df: (yhat, y) => yhat.map((p, i) => -y[i] / Math.max(EPS, p)),
  },
};
