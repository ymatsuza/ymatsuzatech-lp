import { ACT, softmax } from "./activations.js";
import { LOSS } from "./losses.js";

// ネットワークは層の配列。各層 = { W:number[][], b:number[], act:string }。
//   W[j][i] = 入力i → 出力j の重み。
export function makeNet(layers) {
  return {
    layers: layers.map((l) => ({
      W: l.W.map((r) => r.slice()),
      b: l.b.slice(),
      act: l.act,
      lockBias: !!l.lockBias, // true なら学習中もバイアスを 0 のまま固定（第1章の比較用）
    })),
  };
}

// 順伝播: 入力 x（配列）→ 各層の z(事前活性) と a(活性) を返す。
//   as[0] = 入力, as[k+1] = 層k の出力。zs[k+1] = 層k の事前活性。
export function forward(net, x) {
  const as = [x];
  const zs = [null];
  let a = x;
  for (const layer of net.layers) {
    const z = layer.W.map((row, j) => row.reduce((s, w, i) => s + w * a[i], layer.b[j]));
    let out;
    if (layer.act === "softmax") out = softmax(z);
    else { const fn = ACT[layer.act].f; out = z.map(fn); }
    zs.push(z);
    as.push(out);
    a = out;
  }
  return { zs, as };
}

// 逆伝播（1サンプル）。cache = forward(net, x) の戻り値。
// 解析的勾配 { dW, db } を返す。数値勾配チェックで正しさを検証する。
export function backward(net, cache, yTrue, lossName) {
  const { zs, as } = cache;
  const Ln = net.layers.length;
  const dW = new Array(Ln);
  const db = new Array(Ln);
  const yhat = as[Ln];

  // 出力層の δ = ∂L/∂z
  const outLayer = net.layers[Ln - 1];
  let delta;
  if (
    (outLayer.act === "sigmoid" && lossName === "bce") ||
    (outLayer.act === "softmax" && lossName === "ce")
  ) {
    // 既知の簡約: δ = yhat - y（数値的に安定でシンプル）。
    delta = yhat.map((p, i) => p - yTrue[i]);
  } else {
    const dL = LOSS[lossName].df(yhat, yTrue); // ∂L/∂a
    delta = dL.map((g, i) => g * ACT[outLayer.act].df(zs[Ln][i]));
  }

  for (let L = Ln - 1; L >= 0; L--) {
    const aPrev = as[L]; // 層L への入力
    dW[L] = delta.map((d) => aPrev.map((a) => d * a));
    db[L] = delta.slice();
    if (L > 0) {
      const layer = net.layers[L];
      const prevLayer = net.layers[L - 1];
      const nPrev = aPrev.length;
      const newDelta = new Array(nPrev).fill(0);
      for (let i = 0; i < nPrev; i++) {
        let s = 0;
        for (let j = 0; j < delta.length; j++) s += layer.W[j][i] * delta[j];
        newDelta[i] = s * ACT[prevLayer.act].df(zs[L][i]);
      }
      delta = newDelta;
    }
  }
  return { dW, db };
}

// in-place 勾配更新。
export function step(net, grads, lr) {
  net.layers.forEach((layer, L) => {
    for (let j = 0; j < layer.W.length; j++) {
      for (let i = 0; i < layer.W[j].length; i++) layer.W[j][i] -= lr * grads.dW[L][j][i];
      if (!layer.lockBias) layer.b[j] -= lr * grads.db[L][j];
    }
  });
}

export function predict(net, x) {
  const { as } = forward(net, x);
  return as[as.length - 1];
}

// 重みの最大絶対値。発散（重みが爆発）の検出に使う。
export function maxAbsWeight(net) {
  let m = 0;
  for (const layer of net.layers)
    for (const row of layer.W) for (const w of row) m = Math.max(m, Math.abs(w));
  return m;
}

// データセット全体を評価（重みは変えない）。{ loss, accuracy } を返す。
export function evaluate(net, dataset, lossName) {
  const N = dataset.X.length;
  let loss = 0;
  let correct = 0;
  for (let n = 0; n < N; n++) {
    const yhat = predict(net, dataset.X[n]);
    loss += LOSS[lossName].f(yhat, toTarget(dataset.y[n], net));
    if (isCorrect(yhat, dataset.y[n])) correct++;
  }
  return { loss: loss / N, accuracy: correct / N };
}

// フルバッチで1ステップ（=1エポック）。loss/accuracy/diverged を返す。
export function trainStep(net, dataset, lossName, lr) {
  const N = dataset.X.length;
  let g = null;
  let loss = 0;
  let correct = 0;
  for (let n = 0; n < N; n++) {
    const x = dataset.X[n];
    const y = toTarget(dataset.y[n], net);
    const cache = forward(net, x);
    const yhat = cache.as[cache.as.length - 1];
    loss += LOSS[lossName].f(yhat, y);
    if (isCorrect(yhat, dataset.y[n])) correct++;
    const grads = backward(net, cache, y, lossName);
    g = g ? addGrads(g, grads) : grads;
  }
  loss /= N;
  scaleGrads(g, 1 / N);
  const diverged = !Number.isFinite(loss);
  if (!diverged) step(net, g, lr);
  // grads は適用した平均勾配。第5章で「各重みがいま受けている修正の大きさ」を可視化するのに使う。
  return { loss, accuracy: correct / N, diverged, grads: g };
}

// --- helpers ---

// 2値: ラベル(0/1) → [ラベル]。多クラス: 出力次元の one-hot。
function toTarget(label, net) {
  const out = net.layers[net.layers.length - 1].W.length;
  if (out === 1) return [label];
  const t = new Array(out).fill(0);
  t[label] = 1;
  return t;
}

function isCorrect(yhat, label) {
  if (yhat.length === 1) return (yhat[0] >= 0.5 ? 1 : 0) === label;
  let best = 0;
  for (let i = 1; i < yhat.length; i++) if (yhat[i] > yhat[best]) best = i;
  return best === label;
}

function addGrads(a, b) {
  a.dW.forEach((m, L) => m.forEach((row, j) => row.forEach((_, i) => { a.dW[L][j][i] += b.dW[L][j][i]; })));
  a.db.forEach((row, L) => row.forEach((_, j) => { a.db[L][j] += b.db[L][j]; }));
  return a;
}

function scaleGrads(g, s) {
  g.dW.forEach((m) => m.forEach((row) => { for (let i = 0; i < row.length; i++) row[i] *= s; }));
  g.db.forEach((row) => { for (let j = 0; j < row.length; j++) row[j] *= s; });
}
