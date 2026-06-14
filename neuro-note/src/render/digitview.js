// 第7章（手書き数字）用の表示。
// 入力 8×8 グリッドを Canvas に、10クラスの確率バーと予測を SVG に描く。
const SVGNS = "http://www.w3.org/2000/svg";

// 8×8 の入力画像を canvas に描く。sample は 64 個の 0/1（または 0..1）。
export function drawDigitInput(canvas, sample) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const grid = 8;
  const cell = Math.min(W, H) / grid;
  const ox = (W - cell * grid) / 2;
  const oy = (H - cell * grid) / 2;
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const v = sample[r * grid + c];
      const R = Math.round(244 - (244 - 58) * v);
      const G = Math.round(236 - (236 - 51) * v);
      const B = Math.round(216 - (216 - 38) * v);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    }
  }
  ctx.strokeStyle = "rgba(58,51,38,0.25)";
  ctx.lineWidth = 1;
  for (let k = 0; k <= grid; k++) {
    ctx.beginPath();
    ctx.moveTo(ox + k * cell, oy); ctx.lineTo(ox + k * cell, oy + grid * cell);
    ctx.moveTo(ox, oy + k * cell); ctx.lineTo(ox + grid * cell, oy + k * cell);
    ctx.stroke();
  }
}

// 10クラスの確率バー + 予測 + 正解を SVG に描く。
export function renderDigitOutput(svg, probs, predicted, trueLabel) {
  const W = 360, H = 210;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const correct = predicted === trueLabel;
  const col = correct ? "#2c6e8f" : "#c0392b";

  text(svg, 42, 16, "予測", "#8a7f63", "middle", 10);
  text(svg, 42, 78, String(predicted), col, "middle", 56);
  text(svg, 42, 104, correct ? "✓ 正解！" : "✗ ちがう", col, "middle", 12);
  text(svg, 42, 150, `お手本: ${trueLabel}`, "#8a7f63", "middle", 11);

  const bx = 100, bw = 200, bh = 15, gap = 3.4;
  for (let d = 0; d < 10; d++) {
    const y = 10 + d * (bh + gap);
    text(svg, bx - 8, y + bh - 3, String(d), "#3a3326", "end", 11);
    svg.appendChild(rect(bx, y, bw, bh, "#f0e7d2"));
    const w = Math.max(1, probs[d] * bw);
    const fill = d === predicted ? col : "#cbb98f";
    svg.appendChild(rect(bx, y, w, bh, fill));
    text(svg, bx + bw + 5, y + bh - 3, Math.round(probs[d] * 100) + "%", "#8a7f63", "start", 9);
  }
}

function rect(x, y, w, h, fill) {
  const e = document.createElementNS(SVGNS, "rect");
  e.setAttribute("x", x); e.setAttribute("y", y);
  e.setAttribute("width", Math.max(0, w)); e.setAttribute("height", h);
  e.setAttribute("fill", fill); e.setAttribute("rx", 2);
  return e;
}
function text(svg, x, y, str, fill, anchor, size) {
  const t = document.createElementNS(SVGNS, "text");
  t.setAttribute("x", x); t.setAttribute("y", y);
  t.setAttribute("fill", fill); t.setAttribute("text-anchor", anchor);
  t.setAttribute("font-size", size);
  t.setAttribute("font-family", "Courier New, monospace");
  t.textContent = str;
  svg.appendChild(t);
}
