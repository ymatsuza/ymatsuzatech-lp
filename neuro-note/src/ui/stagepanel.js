import { t, locField } from "../i18n.js";

// ステージのオーバーレイ表示（決断 / クリア / メッセージ）。
// 内容はすべて自作の静的データ（stages.js）由来でユーザー入力は含まない。

export function renderDecision(overlay, stage, onChoose) {
  overlay.classList.remove("hidden");
  overlay.innerHTML = `<div class="nn-card">
    <h3>${t("decision")}</h3>
    <p class="prompt">${locField(stage.decision, "prompt")}</p>
    <div class="nn-options"></div>
  </div>`;
  const wrap = overlay.querySelector(".nn-options");
  stage.decision.options.forEach((opt) => {
    const b = document.createElement("button");
    b.className = "nn-option";
    const label = document.createElement("div");
    label.className = "opt-label";
    label.textContent = locField(opt, "label");
    const hint = document.createElement("div");
    hint.className = "opt-hint";
    hint.textContent = locField(opt, "hint") || "";
    b.append(label, hint);
    b.onclick = () => onChoose(opt.value);
    wrap.appendChild(b);
  });
}

export function renderCleared(overlay, stage, isLast, onNext) {
  overlay.classList.remove("hidden");
  overlay.innerHTML = `<div class="nn-card" style="text-align:center">
    <div class="nn-cleared-emoji">${isLast ? "🎓" : "✅"}</div>
    <h3>${isLast ? t("allCleared") : t("cleared")}</h3>
    <p class="prompt">${isLast ? t("finalBody") : t("clearedBody")}</p>
    <button class="nn-btn primary">${isLast ? t("replay") : t("next")}</button>
  </div>`;
  overlay.querySelector("button").onclick = onNext;
  if (isLast) addConfetti(overlay);
}

export function renderMessage(overlay, html, btnLabel, onClick) {
  overlay.classList.remove("hidden");
  overlay.innerHTML = `<div class="nn-card">${html}<div style="margin-top:14px"><button class="nn-btn primary">${btnLabel}</button></div></div>`;
  overlay.querySelector("button").onclick = onClick;
}

export function hideOverlay(overlay) {
  overlay.classList.add("hidden");
  overlay.innerHTML = "";
}

// 最終章クリアの紙吹雪（依存ゼロ・CSSアニメ）。
function addConfetti(overlay) {
  const colors = ["#c0392b", "#2c6e8f", "#f59e0b", "#2c8f5a", "#7d3c98"];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("span");
    s.className = "nn-confetti";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = -10 - Math.random() * 30 + "px";
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = Math.random() * 0.7 + "s";
    overlay.appendChild(s);
  }
}
