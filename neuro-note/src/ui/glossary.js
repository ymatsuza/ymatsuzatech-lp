import { TERMS } from "../game/termcards.js";
import { t, locField, chapterLabel, termName, termBody } from "../i18n.js";

// 学んだ用語を章ごとに整理して表示する用語集。未習得は 🔒 でロック表示。
export function createGlossary(modal, btn, stages) {
  const learned = new Set();

  // 各用語を「初めて登場する章」に割り当てる（重複排除）。
  const byChapter = [];
  const seen = new Set();
  for (const s of stages) {
    const terms = [];
    for (const c of s.cards) {
      if (!seen.has(c.term) && TERMS[c.term]) {
        seen.add(c.term);
        terms.push(c.term);
      }
    }
    if (terms.length) byChapter.push({ stage: s, terms });
  }
  const total = seen.size;

  btn.onclick = show;
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };

  function show() {
    modal.classList.remove("hidden");
    const sections = byChapter
      .map((ch) => {
        const items = ch.terms
          .map((id) => {
            if (!learned.has(id)) {
              return `<div class="nn-gloss-item locked">🔒 ??? <span style="font-size:11px">${t("glossLocked")}</span></div>`;
            }
            const term = TERMS[id];
            return `<div class="nn-gloss-item"><span class="nn-term">${termName(term)}</span> <span style="color:var(--muted);font-size:11px">${term.en}</span><div>${termBody(term)}</div></div>`;
          })
          .join("");
        return `<div class="nn-gloss-chapter">${chapterLabel(ch.stage.chapter)} ${locField(ch.stage, "title")}</div>${items}`;
      })
      .join("");
    modal.innerHTML = `<div class="nn-card"><h3>📖 ${t("glossTitle")}（${learned.size} / ${total}）</h3>${sections}<div style="margin-top:12px"><button class="nn-btn">${t("close")}</button></div></div>`;
    modal.querySelector("button").onclick = () => modal.classList.add("hidden");
  }

  return {
    add: (id) => { if (TERMS[id]) learned.add(id); },
    has: (id) => learned.has(id),
    count: () => learned.size,
  };
}
