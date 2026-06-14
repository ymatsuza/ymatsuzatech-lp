import { t, locField, chapterLabel, getLang } from "../i18n.js";

// ホーム＝章セレクト・マップ。全7章を俯瞰し、クリア状況とベストスコアを表示。
// getBest(id) は { epochs } か null を返す（未設定なら null）。
export function renderChapterMap(host, stages, progress, onSelect, onReset, getBest) {
  const en = getLang() === "en";
  const cards = stages
    .map((s, i) => {
      const cleared = progress.isCleared(s.id);
      const unlocked = i === 0 || progress.isCleared(stages[i - 1].id);
      const status = cleared ? "cleared" : unlocked ? "open" : "locked";
      const badge = cleared ? "✓" : unlocked ? "▶" : "🔒";
      const best = getBest && getBest(s.id);
      const bestLine = best
        ? `<div class="nn-chbest">${t("best")}: ${best.epochs} ${en ? "ep" : "エポック"}</div>`
        : "";
      return `<button class="nn-chcard ${status}" data-idx="${i}" ${unlocked ? "" : "disabled"}>
        <div class="nn-chnum">${chapterLabel(s.chapter)} <span class="nn-chbadge">${badge}</span></div>
        <div class="nn-chtitle">${locField(s, "title")}</div>
        ${bestLine}
      </button>`;
    })
    .join("");

  const clearedCount = stages.filter((s) => progress.isCleared(s.id)).length;
  const allClear = clearedCount === stages.length;
  const progressLabel = en ? `Cleared ${clearedCount} / ${stages.length}` : `クリア ${clearedCount} / ${stages.length}`;

  host.innerHTML = `
    <div class="nn-home-inner">
      <div class="nn-home-title">📒 NeuroNote</div>
      <div class="nn-home-sub">${t("homeSub")}</div>
      <div class="nn-home-progress">${progressLabel}${allClear ? t("homeAllClear") : ""}</div>
      <div class="nn-chgrid">${cards}</div>
      <div class="nn-home-foot">
        <button class="nn-btn" id="nn-reset">${t("reset")}</button>
      </div>
    </div>`;

  host.querySelectorAll(".nn-chcard").forEach((btn) => {
    if (btn.disabled) return;
    btn.onclick = () => onSelect(Number(btn.dataset.idx));
  });
  host.querySelector("#nn-reset").onclick = onReset;
}
