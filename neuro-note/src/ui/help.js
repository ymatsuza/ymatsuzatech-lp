import { getLang, t } from "../i18n.js";

const HELP = {
  ja: {
    title: "❓ あそびかた",
    lines: [
      "🎯 本物のニューラルネットが学習する様子を眺めて、用語も学べるゲーム。",
      "🧭 各章：① 決断を1つ選ぶ → ② ▶ で学習を眺める → ③ 用語カードで学ぶ → ④ クリア。",
      "🎮 ▶/⏸ 再生・一時停止（スペースキーでも）、速度 🐢/×1/×4/×16、⏭ 1ステップ、🔄 決断やり直し。",
      "🗺 章マップでいつでも復習、📖 用語集で学んだ言葉を確認。",
      "✏️ 最終章（第7章）では、自分で数字を描いて育てたAIに当てさせられる。",
      "🌐 日本語 / English 切替、🔊 音のオン・オフ。",
    ],
  },
  en: {
    title: "❓ How to play",
    lines: [
      "🎯 Watch a real neural network learn — and pick up the terminology along the way.",
      "🧭 Each chapter: ① make one decision → ② press ▶ and watch it train → ③ learn from term cards → ④ clear it.",
      "🎮 ▶/⏸ Play/Pause (or Spacebar), Speed 🐢/×1/×4/×16, ⏭ Step, 🔄 Re-decide.",
      "🗺 Chapter map to replay anytime, 📖 Glossary to review terms you've learned.",
      "✏️ In the final chapter (7) you can draw your own digit for your trained AI to read.",
      "🌐 Japanese / English toggle, 🔊 sound on/off.",
    ],
  },
};

export function openHelp(modal) {
  const h = HELP[getLang()] || HELP.ja;
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="nn-card nn-help">
    <h3>${h.title}</h3>
    <ul>${h.lines.map((l) => `<li>${l}</li>`).join("")}</ul>
    <div style="text-align:center;margin-top:14px"><button class="nn-btn primary">${t("close")}</button></div>
  </div>`;
  modal.querySelector("button").onclick = () => modal.classList.add("hidden");
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
}
