import { predict } from "../engine/network.js";

// 決定境界ヒートマップ + データ点を canvas に描く。net は変更しない。
// 平面 [-dom, dom]^2 を canvas にマップ。小さな res×res を評価して滑らかに拡大描画。
const BLUE = [44, 110, 143]; // class 0
const RED = [192, 57, 43]; // class 1
const lerp = (a, b, t) => Math.round(a + (b - a) * t);

let _off = null;

export function drawBoundary(canvas, net, dataset, opts = {}) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const res = opts.res || 50;
  const dom = opts.domain || 3;

  if (!_off) _off = makeOffscreen(res);
  if (_off.width !== res) _off = makeOffscreen(res);
  const octx = _off.getContext("2d");
  const img = octx.createImageData(res, res);

  for (let gy = 0; gy < res; gy++) {
    const y = dom - (gy / (res - 1)) * 2 * dom;
    for (let gx = 0; gx < res; gx++) {
      const x = -dom + (gx / (res - 1)) * 2 * dom;
      const out = predict(net, [x, y]);
      const p = out.length === 1 ? out[0] : Math.max(...out);
      const k = (gy * res + gx) * 4;
      img.data[k] = lerp(BLUE[0], RED[0], p);
      img.data[k + 1] = lerp(BLUE[1], RED[1], p);
      img.data[k + 2] = lerp(BLUE[2], RED[2], p);
      img.data[k + 3] = 150;
    }
  }
  octx.putImageData(img, 0, 0);

  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(_off, 0, 0, res, res, 0, 0, W, H);

  // 座標軸（原点の十字）
  ctx.strokeStyle = "rgba(58,51,38,0.35)";
  ctx.lineWidth = 1;
  const ox = (0 + dom) / (2 * dom) * W;
  const oy = (dom - 0) / (2 * dom) * H;
  ctx.beginPath();
  ctx.moveTo(ox, 0); ctx.lineTo(ox, H);
  ctx.moveTo(0, oy); ctx.lineTo(W, oy);
  ctx.stroke();

  // データ点
  for (let i = 0; i < dataset.X.length; i++) {
    const [px, py] = dataset.X[i];
    const cx = (px + dom) / (2 * dom) * W;
    const cy = (dom - py) / (2 * dom) * H;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = dataset.y[i] === 1 ? "#c0392b" : "#2c6e8f";
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#3a3326";
    ctx.stroke();
  }
}

function makeOffscreen(res) {
  const c = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (c) { c.width = res; c.height = res; }
  return c;
}
