import { predict } from "../engine/network.js";
import { t } from "../i18n.js";

// 8×8 のマスを手で塗って、育てたネットワークに数字を当てさせるモーダル。
export function openDrawPad(modal, net) {
  const grid = new Array(64).fill(0);
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="nn-card nn-draw">
    <h3>${t("drawTitle")}</h3>
    <p class="prompt">${t("drawPrompt")}</p>
    <div class="nn-draw-row">
      <div class="nn-draw-grid" id="nn-dg"></div>
      <div class="nn-draw-out" id="nn-do"></div>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:center">
      <button class="nn-btn" id="nn-dclear">${t("drawClear")}</button>
      <button class="nn-btn primary" id="nn-dclose">${t("close")}</button>
    </div>
  </div>`;

  const dg = modal.querySelector("#nn-dg");
  const out = modal.querySelector("#nn-do");
  const cells = [];
  let painting = false;
  let mode = 1; // 塗る(1) か 消す(0)

  for (let i = 0; i < 64; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      mode = grid[i] ? 0 : 1; // 押した場所の状態で塗る/消すを決める
      painting = true;
      paint(i, mode);
    });
    c.addEventListener("pointerenter", () => { if (painting) paint(i, mode); });
    cells.push(c);
    dg.appendChild(c);
  }
  window.addEventListener("pointerup", stop);
  function stop() { painting = false; }

  function paint(i, on) {
    grid[i] = on;
    cells[i].classList.toggle("on", !!on);
    update();
  }

  function update() {
    const probs = predict(net, grid);
    let pred = 0;
    for (let k = 1; k < probs.length; k++) if (probs[k] > probs[pred]) pred = k;
    const drawn = grid.some((v) => v);
    const bars = probs
      .map((p, d) =>
        `<div class="nn-draw-bar"><span>${d}</span><i style="width:${Math.round(p * 90)}px;${d === pred ? "background:#2c6e8f" : ""}"></i></div>`
      )
      .join("");
    out.innerHTML = `<div class="nn-draw-pred">${drawn ? pred : "?"}</div>
      <div class="nn-draw-cap">${drawn ? `${t("confidence")} ${Math.round(probs[pred] * 100)}%` : t("drawHere")}</div>
      <div class="nn-draw-bars">${bars}</div>`;
  }

  modal.querySelector("#nn-dclear").onclick = () => {
    grid.fill(0);
    cells.forEach((c) => c.classList.remove("on"));
    update();
  };
  const close = () => { modal.classList.add("hidden"); window.removeEventListener("pointerup", stop); };
  modal.querySelector("#nn-dclose").onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  update();
}
