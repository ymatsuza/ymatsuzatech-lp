// 多言語対応（日本語 / English）。UI文字列は t(key)、コンテンツ({title, title_en}等)は locField()。
const KEY = "neuro-note:lang";
let LANG = "ja";
try {
  const saved = localStorage.getItem(KEY);
  if (saved === "ja" || saved === "en") LANG = saved;
} catch {}

export function getLang() { return LANG; }
export function setLang(l) {
  LANG = l === "en" ? "en" : "ja";
  try { localStorage.setItem(KEY, LANG); } catch {}
}
export function toggleLang() { setLang(LANG === "ja" ? "en" : "ja"); return LANG; }

// UI文字列。{ja, en} を引く。
const UI = {
  play: { ja: "▶ 再生", en: "▶ Play" },
  pause: { ja: "⏸ 一時停止", en: "⏸ Pause" },
  step: { ja: "⏭ 1ステップ", en: "⏭ Step" },
  redecide: { ja: "🔄 決断をやり直す", en: "🔄 Re-decide" },
  draw: { ja: "✏️ 手描きで試す", en: "✏️ Try drawing" },
  speed: { ja: "速度", en: "Speed" },
  chapters: { ja: "🗺 章を選ぶ", en: "🗺 Chapters" },
  decision: { ja: "💡 決断", en: "💡 Your decision" },
  cleared: { ja: "クリア！", en: "Cleared!" },
  allCleared: { ja: "全章クリア！", en: "All chapters cleared!" },
  clearedBody: { ja: "新しい概念を習得した。次の章で、さらに賢いネットワークを育てよう。", en: "New concept learned. Grow an even smarter network in the next chapter." },
  finalBody: { ja: "おめでとう！ ニューロン1個から、隠れ層で“曲線”を描くところまで到達したよ。", en: "Congrats! From a single neuron all the way to networks that bend curves and read digits." },
  next: { ja: "次の章へ →", en: "Next chapter →" },
  replay: { ja: "もう一度遊ぶ", en: "Play again" },
  divergeTitle: { ja: "発散しちゃった！💥", en: "It diverged! 💥" },
  divergeBody: { ja: "学習率が大きすぎて、損失が坂を飛び越えて暴れてしまった。もっと小さい学習率を選び直そう。", en: "The learning rate was too big — the loss overshot and blew up. Pick a smaller learning rate." },
  timeoutTitle: { ja: "うーん、時間切れ ⏳", en: "Hmm, out of time ⏳" },
  overfitTitle: { ja: "過学習だ！🧠", en: "Overfitting! 🧠" },
  overfitBody: { ja: "訓練データ（青）は覚えたのに、テスト（紫の点線）では外すようになった。網が大きすぎて“丸暗記”しているよ。もっと小さい網で、本質だけ学ばせよう。", en: "It memorized the training data (blue) but misses on the test set (purple dashed). The network is too big and is rote-memorizing. Use a smaller network so it learns the essence." },
  redecideBtn: { ja: "決断をやり直す", en: "Re-decide" },
  capBoundary: { ja: "決定境界（青=クラス0 / 赤=クラス1）", en: "Decision boundary (blue=class 0 / red=class 1)" },
  capNetwork: { ja: "ネットワーク（線の太さ=重み）", en: "Network (line width = weight)" },
  capNetworkGrad: { ja: "ネットワーク（赤い光=逆伝播の修正）", en: "Network (red glow = backprop updates)" },
  capDigitIn: { ja: "入力（8×8の手書き数字）", en: "Input (8×8 handwritten digit)" },
  capDigitOut: { ja: "予測（10クラスの確率）", en: "Prediction (10-class probabilities)" },
  mAccuracy: { ja: "正解率", en: "acc" },
  mTest: { ja: "テスト", en: "test" },
  glossBtn: { ja: "📖 用語集", en: "📖 Glossary" },
  glossTitle: { ja: "用語集", en: "Glossary" },
  glossLocked: { ja: "（未習得）", en: "(locked)" },
  close: { ja: "閉じる", en: "Close" },
  homeSub: { ja: "ニューロンを育てる学習ノート ― 1個のニューロンから、手書き数字の認識まで", en: "A notebook for growing neurons — from a single neuron to reading handwritten digits" },
  homeAllClear: { ja: "　🎓 全章制覇！", en: "  🎓 All chapters complete!" },
  reset: { ja: "最初から（進捗リセット）", en: "Reset progress" },
  drawTitle: { ja: "✏️ 自分で数字を描いてみよう", en: "✏️ Draw a digit yourself" },
  drawPrompt: { ja: "マスをなぞって 0〜9 を描くと、育てたAIが当てるよ。（もう一度押すと消える）", en: "Paint the cells to draw 0–9 and your trained AI will guess it. (tap again to erase)" },
  drawClear: { ja: "クリア", en: "Clear" },
  drawHere: { ja: "描いてね", en: "Draw here" },
  confidence: { ja: "自信", en: "conf." },
  best: { ja: "ベスト", en: "Best" },
  bestEpochs: { ja: "最短", en: "best" },
  helpBtn: { ja: "❓ ヘルプ", en: "❓ Help" },
  termEmpty: { ja: "学習を始めると、ここに用語が現れます。", en: "Terms will appear here as you train." },
  termSideCap: { ja: "いま学んだ用語", en: "Term just learned" },
  saveBrainTip: { ja: "育てた脳を保存（JSON）", en: "Save the trained brain (JSON)" },
  loadBrainTip: { ja: "保存した脳を読み込む", en: "Load a saved brain" },
  savedBrain: { ja: "💾 脳を保存しました", en: "💾 Brain saved" },
  loadedBrain: { ja: "📂 脳を読み込みました", en: "📂 Brain loaded" },
  loadFail: { ja: "読み込めませんでした", en: "Couldn't load that file" },
  loadMismatch: { ja: "この章には形が合いません", en: "Shape doesn't match this chapter" },
};

export function t(key) {
  const e = UI[key];
  return e ? e[LANG] : key;
}

// コンテンツ用: obj[base+"_en"] があり英語なら使う。なければ obj[base]。
export function locField(obj, base) {
  if (LANG === "en" && obj[base + "_en"] != null) return obj[base + "_en"];
  return obj[base];
}

// 章ラベル。
export function chapterLabel(n) { return LANG === "en" ? `Ch.${n}` : `第${n}章`; }

// 用語の名前と説明。
export function termName(term) { return LANG === "en" ? term.en : term.ja; }
export function termBody(term) { return LANG === "en" && term.body_en ? term.body_en : term.body; }
