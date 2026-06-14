// NeuroNote ― 全モジュールを結線し、RAFループで「学習→描画→用語→勝敗判定」を回す。
import { forward, trainStep, maxAbsWeight, evaluate, predict } from "./engine/network.js";
import { DATASETS, splitDataset } from "./data/datasets.js";
import { STAGES } from "./game/stages.js";
import { TERMS } from "./game/termcards.js";
import { createProgress } from "./game/progress.js";
import { drawBoundary } from "./render/boundary.js";
import { renderNetwork } from "./render/networkview.js";
import { drawDigitInput, renderDigitOutput } from "./render/digitview.js";
import { createLossChart } from "./render/losschart.js";
import { buildShell } from "./ui/shell.js";
import { createControls } from "./ui/controls.js";
import { createGlossary } from "./ui/glossary.js";
import { renderChapterMap } from "./ui/chaptermap.js";
import { openDrawPad } from "./ui/drawpad.js";
import { openHelp } from "./ui/help.js";
import { serializeBrain, parseBrain, downloadText, pickJsonFile } from "./ui/brainio.js";
import { createSound } from "./ui/sound.js";
import { renderDecision, renderCleared, renderMessage, hideOverlay } from "./ui/stagepanel.js";
import { t, locField, getLang, toggleLang, chapterLabel, termName, termBody } from "./i18n.js";

const refs = buildShell(document.getElementById("app"));
const progress = createProgress();
const gloss = createGlossary(refs.glossModal, refs.glossBtn, STAGES);
const chart = createLossChart(refs.chartCanvas);
const sound = createSound();
refs.muteBtn.textContent = sound.muted ? "🔇" : "🔊";
refs.muteBtn.onclick = () => { refs.muteBtn.textContent = sound.toggle() ? "🔇" : "🔊"; };

// 言語（日本語 / English）
refs.glossBtn.textContent = t("glossBtn");
refs.homeBtn.textContent = t("chapters");
refs.helpBtn.textContent = t("helpBtn");
refs.langBtn.textContent = getLang() === "en" ? "日本語" : "EN";
refs.langBtn.onclick = () => { toggleLang(); applyLanguage(); };
refs.helpBtn.onclick = () => openHelp(refs.helpModal);
localizeTermCap();
setTermEmpty();
// 初回起動時はヘルプを自動表示
try {
  if (!localStorage.getItem("neuro-note:seenHelp")) {
    openHelp(refs.helpModal);
    localStorage.setItem("neuro-note:seenHelp", "1");
  }
} catch {}

function applyLanguage() {
  controls.relabel();
  refs.glossBtn.textContent = t("glossBtn");
  refs.homeBtn.textContent = t("chapters");
  refs.helpBtn.textContent = t("helpBtn");
  refs.langBtn.textContent = getLang() === "en" ? "日本語" : "EN";
  if (!refs.homeEl.classList.contains("hidden")) {
    showHome();
  } else if (state.stage) {
    refs.chapterEl.textContent = chapterLabel(state.stage.chapter);
    refs.titleEl.textContent = locField(state.stage, "title");
    refs.goalEl.innerHTML = locField(state.stage, "goal");
    setCaptions(state.stage);
    renderAll();
    localizeTermCap();
    if (state.lastTerm) renderTermCard(state.lastTerm);
    else setTermEmpty();
    if (!refs.decisionOverlay.classList.contains("hidden") && refs.decisionOverlay.querySelector(".nn-option")) {
      renderDecision(refs.decisionOverlay, state.stage, onDecision);
    }
    if (!refs.clearedOverlay.classList.contains("hidden")) {
      const isLast = state.idx >= STAGES.length - 1;
      renderCleared(refs.clearedOverlay, state.stage, isLast, () => {
        if (isLast) { hideOverlay(refs.clearedOverlay); showHome(); } else loadStage(state.idx + 1);
      });
    }
  }
}

const state = {
  idx: 0, stage: null, net: null, dataset: null, testData: null, lr: 0.5,
  running: false, spf: 1, epoch: 0, lastLoss: NaN, lastAcc: 0, lastTest: null, lastGrads: null,
  decided: false, diverged: false, fired: new Set(), acc: 0,
};

const controls = createControls(refs.controlsEl, {
  onPlayToggle: () => setRunning(!state.running),
  onStep: () => { if (state.decided && !state.diverged) { doStep(); renderAll(); } },
  onSpeed: (v) => { state.spf = v; },
  onRedecide: redecide,
  onDraw: () => { setRunning(false); openDrawPad(refs.drawModal, state.net); },
  onSaveBrain: saveBrain,
  onLoadBrain: loadBrain,
});

// 育てた「脳」（重み）の保存・読込
function brainKey() { return "neuro-note:brain:" + state.stage.id; }
function saveBrain() {
  if (!state.net || !state.stage) return;
  setRunning(false);
  const text = serializeBrain(state.net, state.stage.id);
  try { localStorage.setItem(brainKey(), text); } catch {}
  downloadText(`neuronote-${state.stage.id}.json`, text);
  toast(t("savedBrain"));
}
async function loadBrain() {
  if (!state.stage) return;
  setRunning(false);
  let text = null;
  try { text = localStorage.getItem(brainKey()); } catch {}
  if (!text) text = await pickJsonFile();
  if (!text) return;
  const parsed = parseBrain(text);
  if (!parsed) return toast(t("loadFail"));
  const inDim = parsed.net.layers[0].W[0].length;
  const outDim = parsed.net.layers[parsed.net.layers.length - 1].W.length;
  const wantIn = state.dataset.X[0].length;
  const wantOut = state.net.layers[state.net.layers.length - 1].W.length;
  if (inDim !== wantIn || outDim !== wantOut) return toast(t("loadMismatch"));
  state.net = parsed.net;
  state.decided = true;
  state.diverged = false;
  hideOverlay(refs.decisionOverlay);
  controls.setEnabled(true);
  renderAll();
  toast(t("loadedBrain"));
}
let _toastTimer = null;
function toast(msg) {
  let el = document.getElementById("nn-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "nn-toast";
    el.className = "nn-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

refs.homeBtn.onclick = () => { state.running = false; controls.setRunning(false); showHome(); };

// ホーム（章セレクト・マップ）を表示。
function showHome() {
  state.running = false;
  controls.setRunning(false);
  renderChapterMap(
    refs.homeEl,
    STAGES,
    progress,
    (idx) => { hideHome(); loadStage(idx); },
    () => { progress.reset(); showHome(); },
    (id) => progress.getBest(id)
  );
  refs.homeEl.classList.remove("hidden");
}
function hideHome() { refs.homeEl.classList.add("hidden"); }

function loadStage(idx) {
  const stage = STAGES[idx];
  state.idx = idx;
  state.stage = stage;

  // データ生成（args 形式 or {n,seed} 形式）。testSplit があれば訓練/テストに分割。
  const args = stage.dataset.args || [stage.dataset.n, stage.dataset.seed];
  const raw = DATASETS[stage.dataset.name](...args);
  if (stage.testSplit) {
    const sp = splitDataset(raw, stage.testSplit.ratio, stage.testSplit.seed);
    state.dataset = sp.train;
    state.testData = sp.test;
  } else {
    state.dataset = raw;
    state.testData = null;
  }

  state.epoch = 0; state.running = false; state.decided = false; state.diverged = false;
  state.lastLoss = NaN; state.lastAcc = 0; state.lastTest = null; state.lastGrads = null; state.acc = 0;
  state.fired = new Set();
  state.lastTerm = null;
  chart.reset();

  refs.chapterEl.textContent = chapterLabel(stage.chapter);
  refs.titleEl.textContent = locField(stage, "title");
  refs.goalEl.innerHTML = locField(stage, "goal");
  setCaptions(stage);
  hideOverlay(refs.clearedOverlay);
  controls.setEnabled(false);
  controls.setRunning(false);
  controls.setDrawVisible(stage.view === "digits");

  // 決断前のプレビュー用ネット（最初の選択肢・未学習）を裏に表示
  state.net = stage.apply(stage.decision.options[0].value).net;
  setTermEmpty();
  fireCards("stageStart");
  renderAll();
  renderDecision(refs.decisionOverlay, stage, onDecision);
}

function onDecision(value) {
  const { net, lr } = state.stage.apply(value);
  state.net = net; state.lr = lr;
  state.epoch = 0; state.decided = true; state.diverged = false; state.acc = 0;
  state.lastLoss = NaN; state.lastAcc = 0; state.lastTest = null; state.lastGrads = null;
  chart.reset();
  hideOverlay(refs.decisionOverlay);
  fireCards("decision");
  controls.setEnabled(true);
  renderAll();
  setRunning(true); // 決めたら自動で学習が走り出す
}

function redecide() {
  state.running = false; state.decided = false; state.diverged = false;
  state.epoch = 0; state.acc = 0; state.lastLoss = NaN; state.lastAcc = 0; state.lastTest = null; state.lastGrads = null;
  chart.reset();
  controls.setRunning(false);
  controls.setEnabled(false);
  state.net = state.stage.apply(state.stage.decision.options[0].value).net;
  renderAll();
  renderDecision(refs.decisionOverlay, state.stage, onDecision);
}

let rafId = null;
function setRunning(b) {
  if (b && (!state.decided || state.diverged)) return;
  state.running = b;
  controls.setRunning(b);
  if (b && rafId == null) rafId = requestAnimationFrame(tick);
}

function doStep() {
  const s = state.stage;
  const m = trainStep(state.net, state.dataset, s.loss, state.lr);
  state.epoch++;
  state.lastLoss = m.loss;
  state.lastAcc = m.accuracy;
  state.lastGrads = m.grads;
  if (state.testData) state.lastTest = evaluate(state.net, state.testData, s.loss).accuracy;
  chart.push({ loss: m.loss, accuracy: m.accuracy, testAccuracy: state.testData ? state.lastTest : undefined });

  if (state.epoch === 1) fireCards("firstStep");
  fireConditionalCards(m);

  // 発散検出。重みの爆発か NaN/Inf で判定する（高い損失だけでは判定しない）。
  const blown = m.diverged || !Number.isFinite(m.loss) || maxAbsWeight(state.net) > 200;
  if (blown) return onDiverge();

  // 勝敗判定。metric: "loss"（誤差以下で勝ち）/ "accuracy"（訓練正解率）/
  //   "testAccuracy"（テスト正解率で早期勝ち）/ "testAtEnd"（最後まで学習しテストで判定＝過学習章）
  if (s.win.metric === "testAtEnd") {
    if (s.maxEpochs && state.epoch >= s.maxEpochs) {
      return state.lastTest >= s.win.threshold ? onWin() : onOverfit();
    }
    return;
  }
  const v = s.win.metric === "loss" ? m.loss : s.win.metric === "testAccuracy" ? state.lastTest ?? 0 : m.accuracy;
  const won = s.win.metric === "loss" ? v <= s.win.threshold : v >= s.win.threshold;
  if (state.epoch >= 3 && won) return onWin();
  if (s.maxEpochs && state.epoch >= s.maxEpochs) return onTimeout();
}

function onWin() {
  state.running = false;
  controls.setRunning(false);
  controls.setEnabled(false);
  progress.markCleared(state.stage.id);
  progress.recordBest(state.stage.id, state.epoch);
  fireCards("win");
  const isLast = state.idx >= STAGES.length - 1;
  if (isLast) sound.fanfare(); else sound.success();
  renderAll();
  renderCleared(refs.clearedOverlay, state.stage, isLast, () => {
    if (isLast) {
      hideOverlay(refs.clearedOverlay);
      showHome();
    } else {
      loadStage(state.idx + 1);
    }
  });
}

function onDiverge() {
  state.running = false;
  state.diverged = true;
  controls.setRunning(false);
  controls.setEnabled(false);
  renderAll();
  renderMessage(
    refs.decisionOverlay,
    `<h3 class="nn-diverge">${t("divergeTitle")}</h3><p class="prompt">${t("divergeBody")}</p>`,
    t("redecideBtn"),
    redecide
  );
}

function onTimeout() {
  state.running = false;
  controls.setRunning(false);
  controls.setEnabled(false);
  const en = getLang() === "en";
  const pct = Math.round(state.stage.win.threshold * 100);
  const goal =
    state.stage.win.metric === "loss"
      ? (en ? `loss ≤ ${state.stage.win.threshold}` : `誤差を ${state.stage.win.threshold} 以下`)
      : (en ? `${pct}% accuracy` : `正解率 ${pct}%`);
  const body = en
    ? `Even after ${state.stage.maxEpochs} epochs it didn't reach the goal (${goal}). Rethink your decision.`
    : `${state.stage.maxEpochs}エポックでも目標（${goal}）に届かなかった。決断を見直してみよう。`;
  renderMessage(
    refs.decisionOverlay,
    `<h3>${t("timeoutTitle")}</h3><p class="prompt">${body}</p>`,
    t("redecideBtn"),
    redecide
  );
}

// 第6章: 最後まで学習したのにテスト精度が届かなかった＝過学習。
function onOverfit() {
  state.running = false;
  controls.setRunning(false);
  controls.setEnabled(false);
  renderAll();
  renderMessage(
    refs.decisionOverlay,
    `<h3>${t("overfitTitle")}</h3><p class="prompt">${t("overfitBody")}</p>`,
    t("redecideBtn"),
    redecide
  );
}

// ── 用語カード ──
function fireCards(when) {
  for (const c of state.stage.cards) if (c.on === when) fire(c);
}
function fireConditionalCards(m) {
  for (const c of state.stage.cards) {
    if (typeof c.on !== "object") continue;
    if (c.on.epoch != null && state.epoch >= c.on.epoch) fire(c);
    if (c.on.lossBelow != null && m.loss < c.on.lossBelow) fire(c);
  }
}
function fire(card) {
  if (state.fired.has(card.term)) return;
  state.fired.add(card.term);
  gloss.add(card.term);
  state.lastTerm = card.term;
  renderTermCard(card.term);
  refs.termcardEl.classList.remove("pop");
  void refs.termcardEl.offsetWidth; // reflow でアニメ再生
  refs.termcardEl.classList.add("pop");
  sound.blip();
}
function renderTermCard(id) {
  const term = TERMS[id];
  const sub = getLang() === "en" ? term.ja : term.en;
  refs.termcardEl.innerHTML = `<div class="nn-term">▸ ${termName(term)} <span class="en">${sub}</span></div><div>${termBody(term)}</div>`;
}
function setTermEmpty() {
  refs.termcardEl.innerHTML = `<span class="nn-empty">${t("termEmpty")}</span>`;
}
function localizeTermCap() {
  const cap = refs.termcardEl.previousElementSibling;
  if (cap && cap.classList.contains("nn-cap")) cap.textContent = t("termSideCap");
}

// ── 描画 ──
function setCaptions(stage) {
  const cap1 = refs.boundaryCanvas.previousElementSibling;
  const cap2 = refs.networkSvg.previousElementSibling;
  if (stage.view === "digits") {
    cap1.textContent = t("capDigitIn");
    cap2.textContent = t("capDigitOut");
  } else {
    cap1.textContent = t("capBoundary");
    cap2.textContent = stage.gradViz ? t("capNetworkGrad") : t("capNetwork");
  }
}

function renderAll() {
  if (!state.net) return;
  if (state.stage.view === "digits") {
    const pool = state.testData || state.dataset;
    const i = Math.floor(state.epoch / 6) % pool.X.length;
    const sample = pool.X[i];
    const truth = pool.y[i];
    const probs = predict(state.net, sample);
    let pred = 0;
    for (let k = 1; k < probs.length; k++) if (probs[k] > probs[pred]) pred = k;
    drawDigitInput(refs.boundaryCanvas, sample);
    renderDigitOutput(refs.networkSvg, probs, pred, truth);
  } else {
    drawBoundary(refs.boundaryCanvas, state.net, state.dataset, { res: 52, domain: 3 });
    const acts = forward(state.net, state.dataset.X[0]).as;
    const grads = state.stage.gradViz && state.lastGrads ? state.lastGrads.dW : null;
    renderNetwork(refs.networkSvg, state.net, acts, grads);
  }

  let html = `epoch <b>${state.epoch}</b> · loss <b>${fmt(state.lastLoss)}</b> · ${t("mAccuracy")} <b>${Math.round((state.lastAcc || 0) * 100)}%</b>`;
  if (state.testData) html += ` · <span style="color:#7d3c98">${t("mTest")} <b>${Math.round((state.lastTest || 0) * 100)}%</b></span>`;
  refs.metricsEl.innerHTML = html;
  chart.render();
}
const fmt = (v) => (Number.isFinite(v) ? v.toFixed(3) : "—");

// ── RAFループ（学習中だけ回り、止まると自分でループを終える） ──
function tick() {
  rafId = null;
  if (!(state.running && state.decided && !state.diverged)) return;
  state.acc += state.spf;
  let guard = 0;
  while (state.acc >= 1 && guard < 64) {
    doStep();
    state.acc -= 1;
    guard++;
    if (!state.running) break; // 勝敗・発散で止まったら抜ける
  }
  renderAll();
  if (state.running && !state.diverged) rafId = requestAnimationFrame(tick);
}

// ── キーボード: スペースで再生/一時停止（オーバーレイ表示中・ボタン操作中は無視） ──
window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA") return;
  const blocked =
    !refs.homeEl.classList.contains("hidden") ||
    !refs.decisionOverlay.classList.contains("hidden") ||
    !refs.clearedOverlay.classList.contains("hidden") ||
    !refs.drawModal.classList.contains("hidden");
  if (blocked) return;
  e.preventDefault();
  if (state.decided && !state.diverged) setRunning(!state.running);
});

// ── 起動: ホーム（章セレクト）から ──
showHome();
