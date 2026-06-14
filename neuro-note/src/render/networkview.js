// ネットワークを SVG で描く。重み=エッジの太さ・色、活性=ノードの塗り。
// activations は forward の as（[入力, 層1出力, ...]）。省略可。
const SVGNS = "http://www.w3.org/2000/svg";

export function renderNetwork(svg, net, activations = null, gradients = null) {
  const W = 360;
  const H = 210;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // 各層のノード数: [入力, 各層の出力...]
  const counts = [net.layers[0].W[0].length, ...net.layers.map((l) => l.W.length)];
  const padX = 34;
  const xs = counts.map((_, i) => padX + (i * (W - 2 * padX)) / (counts.length - 1));
  const ys = counts.map((c) => nodeYs(c, H));

  // エッジ（重み）
  let maxW = 0.001;
  net.layers.forEach((l) => l.W.forEach((row) => row.forEach((w) => (maxW = Math.max(maxW, Math.abs(w))))));
  net.layers.forEach((layer, L) => {
    layer.W.forEach((row, j) => {
      row.forEach((w, i) => {
        const t = Math.abs(w) / maxW;
        const line = el("line", {
          x1: xs[L], y1: ys[L][i], x2: xs[L + 1], y2: ys[L + 1][j],
          stroke: w >= 0 ? "#2c6e8f" : "#c0392b",
          "stroke-width": (0.4 + t * 3).toFixed(2),
          "stroke-opacity": (0.18 + t * 0.6).toFixed(2),
        });
        svg.appendChild(line);
      });
    });
  });

  // 勾配グロー（第5章: いま誤差逆伝播で各重みが受けている修正の大きさを赤い光で）
  if (gradients) {
    let maxG = 1e-9;
    gradients.forEach((m) => m.forEach((row) => row.forEach((g) => (maxG = Math.max(maxG, Math.abs(g))))));
    gradients.forEach((dW, L) => {
      dW.forEach((row, j) => {
        row.forEach((g, i) => {
          const t = Math.abs(g) / maxG;
          if (t < 0.05) return;
          svg.appendChild(el("line", {
            x1: xs[L], y1: ys[L][i], x2: xs[L + 1], y2: ys[L + 1][j],
            stroke: "#e74c3c", "stroke-width": (t * 5).toFixed(2),
            "stroke-opacity": (t * 0.7).toFixed(2), "stroke-linecap": "round",
          }));
        });
      });
    });
  }

  // ノード
  counts.forEach((c, L) => {
    for (let n = 0; n < c; n++) {
      const a = activations && activations[L] ? clamp01(activations[L][n]) : null;
      const fill = a == null ? "#fbf7ec" : shade(a);
      svg.appendChild(el("circle", {
        cx: xs[L], cy: ys[L][n], r: 11,
        fill, stroke: "#3a3326", "stroke-width": 2,
      }));
    }
  });

  // ラベル
  const inN = counts[0];
  for (let i = 0; i < inN; i++) text(svg, xs[0] - 22, ys[0][i] + 4, `x${sub(i + 1)}`, "#3a3326");
  const outN = counts[counts.length - 1];
  for (let j = 0; j < outN; j++) text(svg, xs[xs.length - 1] + 16, ys[ys.length - 1][j] + 4, outN === 1 ? "ŷ" : `y${sub(j)}`, "#2c6e8f");
  text(svg, xs[0], H - 4, "入力", "#8a7f63", "middle", 9);
  if (counts.length > 2) text(svg, xs[1], H - 4, "隠れ層", "#8a7f63", "middle", 9);
  text(svg, xs[xs.length - 1], H - 4, "出力", "#8a7f63", "middle", 9);
}

function nodeYs(count, H) {
  const top = 22, bot = H - 24;
  if (count === 1) return [(top + bot) / 2];
  return Array.from({ length: count }, (_, i) => top + (i * (bot - top)) / (count - 1));
}
function el(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function text(svg, x, y, str, fill, anchor = "middle", size = 12) {
  const t = el("text", { x, y, fill, "font-size": size, "text-anchor": anchor, "font-family": "Courier New, monospace" });
  t.textContent = str;
  svg.appendChild(t);
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function shade(a) {
  // 活性が高いほど濃い赤茶に
  const r = Math.round(251 + (192 - 251) * a);
  const g = Math.round(247 + (57 - 247) * a);
  const b = Math.round(236 + (43 - 236) * a);
  return `rgb(${r},${g},${b})`;
}
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).split("").map((d) => SUB[+d]).join("");
