// クリア状況とベストスコア（最短クリアエポック）の永続化。storage は注入可能（テスト用）。
// 破損・欠損時も例外を投げず、初期状態に安全フォールバックする。
const KEY = "neuro-note:progress";

export function createProgress(storage = globalThis.localStorage) {
  let state = { cleared: [], best: {} };
  try {
    const raw = storage && storage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cleared)) {
        state.cleared = parsed.cleared.filter((x) => typeof x === "string");
      }
      if (parsed && parsed.best && typeof parsed.best === "object") {
        for (const k in parsed.best) if (typeof parsed.best[k] === "number") state.best[k] = parsed.best[k];
      }
    }
  } catch {
    state = { cleared: [], best: {} };
  }

  function save() {
    try {
      storage && storage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* 保存不可でも続行 */
    }
  }

  return {
    isCleared: (id) => state.cleared.includes(id),
    markCleared: (id) => {
      if (!state.cleared.includes(id)) {
        state.cleared.push(id);
        save();
      }
    },
    cleared: () => state.cleared.slice(),
    // ベストスコア = 最短クリアエポック。更新したら true。
    getBest: (id) => (state.best[id] != null ? { epochs: state.best[id] } : null),
    recordBest: (id, epochs) => {
      if (state.best[id] == null || epochs < state.best[id]) {
        state.best[id] = epochs;
        save();
        return true;
      }
      return false;
    },
    reset: () => {
      state = { cleared: [], best: {} };
      save();
    },
  };
}
