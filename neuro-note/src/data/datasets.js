import { mulberry32 } from "../engine/rng.js";

// 標準正規乱数（Box-Muller）。
function gauss(r) {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// すべて X: number[][2]（概ね [-3,3]^2）, y: 0|1。シードで再現可能。
export const DATASETS = {
  // 直線で分けられる2つのかたまり。第1〜3章用。
  linearBlobs(n, seed = 1) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    for (let i = 0; i < n; i++) {
      const c = i % 2;
      const cx = c ? 1.3 : -1.3;
      const cy = c ? 1.0 : -1.0;
      X.push([cx + gauss(r) * 0.6, cy + gauss(r) * 0.6]);
      y.push(c);
    }
    return { X, y };
  },
  // 上下に積み重なった2かたまり。原点を通る直線では分けられず「バイアス」が要る。第1章用。
  stackedBlobs(n, seed = 1) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    for (let i = 0; i < n; i++) {
      const c = i % 2; // 0 = 下のかたまり, 1 = 上のかたまり（どちらも原点より上）
      const cy = c ? 2.1 : 0.7;
      X.push([gauss(r) * 0.55, cy + gauss(r) * 0.32]);
      y.push(c);
    }
    return { X, y };
  },
  // XOR: 対角どうしが同じクラス。直線では分けられない。第4章用。
  xor(n, seed = 1) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    for (let i = 0; i < n; i++) {
      const sx = r() < 0.5 ? -1 : 1;
      const sy = r() < 0.5 ? -1 : 1;
      X.push([sx * (1 + Math.abs(gauss(r)) * 0.4), sy * (1 + Math.abs(gauss(r)) * 0.4)]);
      y.push(sx * sy > 0 ? 0 : 1);
    }
    return { X, y };
  },
  // 同心円: 内側と外側。第4章の別バリエーション。
  circles(n, seed = 1) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    for (let i = 0; i < n; i++) {
      const c = i % 2; // 0 = 内側, 1 = 外側
      const rad = (c ? 1.9 : 0.6) + gauss(r) * 0.18;
      const t = r() * Math.PI * 2;
      X.push([Math.cos(t) * rad, Math.sin(t) * rad]);
      y.push(c);
    }
    return { X, y };
  },
  // 二重らせん: いちばん難しい。第4章以降の挑戦用。
  spiral(n, seed = 1) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    const per = Math.floor(n / 2);
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < per; i++) {
        const t = (i / per) * 3.2 + c * Math.PI;
        const rad = (i / per) * 2.2;
        X.push([Math.cos(t) * rad + gauss(r) * 0.12, Math.sin(t) * rad + gauss(r) * 0.12]);
        y.push(c);
      }
    }
    return { X, y };
  },
  // 二日月（moons）2つ。ノイズを上げると端で重なり、過学習が見える。第6章用。
  moons(n, seed = 1, noise = 0.28) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    const per = Math.floor(n / 2);
    for (let i = 0; i < per; i++) {
      const t = Math.PI * (i / Math.max(1, per - 1));
      X.push([Math.cos(t) * 1.4 - 0.7 + gauss(r) * noise, Math.sin(t) * 1.4 - 0.35 + gauss(r) * noise]);
      y.push(0);
    }
    for (let i = 0; i < n - per; i++) {
      const t = Math.PI * (i / Math.max(1, n - per - 1));
      X.push([Math.cos(t) * 1.4 + 0.7 + gauss(r) * noise, -Math.sin(t) * 1.4 + 0.35 + gauss(r) * noise]);
      y.push(1);
    }
    return { X, y };
  },
  // 8×8 手書き風数字（多クラス）。第7章の最終ボス。X は 64 次元(0/1), y は 0..9。
  // shiftMax>0 なら ±shiftMax 画素の平行移動でデータ拡張（中央以外に描いた数字にも強くなる）。
  digits8x8(perClass = 24, seed = 1, noise = 0.06, shiftMax = 0) {
    const r = mulberry32(seed);
    const X = [];
    const y = [];
    for (let d = 0; d < 10; d++) {
      const tpl = DIGIT_TEMPLATES[d];
      for (let k = 0; k < perClass; k++) {
        const dx = shiftMax ? Math.round((r() * 2 - 1) * shiftMax) : 0;
        const dy = shiftMax ? Math.round((r() * 2 - 1) * shiftMax) : 0;
        const px = new Array(64).fill(0);
        for (let rr = 0; rr < 8; rr++) {
          for (let cc = 0; cc < 8; cc++) {
            const sr = rr - dy;
            const sc = cc - dx;
            let v = sr >= 0 && sr < 8 && sc >= 0 && sc < 8 ? (tpl[sr * 8 + sc] === "1" ? 1 : 0) : 0;
            if (r() < noise) v = 1 - v; // ノイズで画素を反転
            px[rr * 8 + cc] = v;
          }
        }
        X.push(px);
        y.push(d);
      }
    }
    return { X, y };
  },
};

// 8×8 の数字テンプレート（各64文字, 行優先）。手描きの“お手本”。
const DIGIT_TEMPLATES = [
  "0011110001100110110000111100001111000011110000110110011000111100", // 0
  "0001100000111000000110000001100000011000000110000011110000000000", // 1
  "0011110001100110000001100000110000011000001100000111111000000000", // 2
  "0011110001100110000001100001110000000110011001100011110000000000", // 3
  "0000110000011100001111000110110011111110000011000000110000000000", // 4
  "0111111001100000011111000000011000000110011001100011110000000000", // 5
  "0011110001100000011000000111110001100110011001100011110000000000", // 6
  "0111111000000110000011000001100000110000001100000011000000000000", // 7
  "0011110001100110011001100011110001100110011001100011110000000000", // 8
  "0011110001100110011001100011111000000110000001100011110000000000", // 9
];

// データセットを訓練用とテスト用に分ける（第6章の汎化用）。
export function splitDataset(ds, testRatio = 0.4, seed = 1) {
  const r = mulberry32(seed);
  const idx = ds.X.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const nTest = Math.floor(ds.X.length * testRatio);
  const testSet = new Set(idx.slice(0, nTest));
  const train = { X: [], y: [] };
  const test = { X: [], y: [] };
  ds.X.forEach((x, i) => {
    const dst = testSet.has(i) ? test : train;
    dst.X.push(x);
    dst.y.push(ds.y[i]);
  });
  return { train, test };
}
