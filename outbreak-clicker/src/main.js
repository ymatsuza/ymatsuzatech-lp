// Wiring: real storage / clock / rAF injected here. Boots the game, handles
// input, runs the loop, and persists progress.

import { createState, load, save, SAVE_KEY, migrate } from './state.js';
import { exportSave, importSave } from './save-code.js';
import * as eco from './economy.js';
import * as ob from './outbreak.js';
import { applyOfflineGain } from './offline.js';
import { start } from './loop.js';
import * as ui from './ui.js';
import * as audio from './audio.js';
import { unlockPending } from './achievements.js';
import { pickHeadline } from './news.js';
import { rollGolden, applyGolden, goldenIntervalMs } from './golden.js';
import { canWatchAd, applyAdReward } from './ads.js';
import { byId as strainById } from './strains.js';
import { short } from './format.js';

const TAP_METER = 0.04; // 25 taps fill the outbreak meter

function makeStorage() {
  try {
    const probe = '__ob_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return { real: true, getItem: (k) => localStorage.getItem(k), setItem: (k, v) => localStorage.setItem(k, v), removeItem: (k) => localStorage.removeItem(k) };
  } catch {
    const mem = {};
    return { real: false, getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  }
}

const storage = makeStorage();
const now = () => Date.now();

let state = load(storage);

// Apply offline progress before the loop starts.
let offlineGained = 0;
if (state.lastSeen) {
  const res = applyOfflineGain(state, now() - state.lastSeen);
  state = res.state;
  offlineGained = res.gain;
}

audio.setMuted(!!(state.settings && state.settings.muted));

ui.init({
  onTapStrain: (id, e) => {
    const t = now();
    const g = eco.strainTapValue(state, id, t);
    state = { ...state, balance: state.balance + g, totalProduced: state.totalProduced + g, tierProduced: state.tierProduced + g, taps: (state.taps || 0) + 1 };
    state = ob.addMeter(state, TAP_METER);
    const def = strainById(id);
    audio.playTap(def && def.note);
    ui.spawnFloat(g, e, def && def.color);
    applyAchievements();
    ui.render(state, t);
  },
  onOpenLab: () => ui.openLab(state),
  onSynthesize: () => {
    const before = state.balance;
    state = eco.synthesizeStrain(state);
    if (state.balance !== before) audio.playBuy();
    applyAchievements();
    ui.refreshLab(state);
    ui.render(state, now());
  },
  onLevelStrain: (id) => {
    const before = state.balance;
    state = eco.levelUpStrain(state, id);
    if (state.balance !== before) audio.playBuy();
    applyAchievements();
    ui.refreshLab(state);
    ui.render(state, now());
  },
  onBuy: (id) => {
    const before = state.balance;
    state = eco.applyPurchase(state, id);
    if (state.balance !== before) audio.playBuy();
    applyAchievements();
    ui.render(state, now());
  },
  onOutbreak: () => {
    const wasActive = ob.isActive(state, now());
    state = ob.activate(state, now());
    if (!wasActive && ob.isActive(state, now())) {
      state = { ...state, outbreaks: (state.outbreaks || 0) + 1 };
      audio.playOutbreak();
    }
    applyAchievements();
    ui.render(state, now());
  },
  onToggleMute: () => {
    state = { ...state, settings: { ...state.settings, muted: !state.settings?.muted } };
    audio.setMuted(!!state.settings.muted);
    ui.render(state, now());
    persist();
  },
  onPrestige: () => {
    if (!eco.canPrestige(state)) return;
    const gain = eco.prestigeGain(state);
    if (confirm(`変異して進行をリセットし、変異株を +${gain} 獲得します（永続で生産が上がります）。株コレクションは維持（Lvはリセット）。よろしいですか？`)) {
      state = eco.applyPrestige(state);
      audio.setMuted(!!(state.settings && state.settings.muted));
      audio.playClear();
      applyAchievements();
      ui.render(state, now());
      persist();
    }
  },
  onOpenAchievements: () => ui.openAchievements(state),
  onOpenSettings: () => ui.openSettings(state),
  onExportSave: () => ui.showExport(exportSave(state)),
  onImportSave: () => {
    const parsed = importSave(ui.getImportCode());
    if (!parsed) { ui.settingsMsg('無効なコードです', false); return; }
    if (confirm('現在の進行を、貼り付けたデータで上書きします。よろしいですか？')) {
      state = migrate(parsed);
      audio.setMuted(!!(state.settings && state.settings.muted));
      persist();
      ui.render(state, now());
      ui.settingsMsg('読み込みました！', true);
    }
  },
  onOpenDnaLab: () => ui.openDnaLab(state),
  onBuyPerk: (id) => {
    const before = state.dna;
    state = eco.buyPerk(state, id);
    if (state.dna !== before) audio.playBuy();
    ui.refreshDnaLab(state);
    ui.render(state, now());
    persist();
  },
  onGolden: () => {
    clearTimeout(goldenHideTimer);
    ui.hideGolden();
    const t = now();
    const effect = rollGolden({ balance: state.balance, rate: eco.effectiveRate(state, t) });
    state = applyGolden(state, effect, t);
    state = { ...state, goldens: (state.goldens || 0) + 1 };
    audio.playGolden();
    ui.showToast(effect.type === 'frenzy' ? `🦠✨ フレンジー！ 生産 ×${effect.mult}（30秒）` : `🍀 ラッキー！ +${short(effect.gain)} 感染`);
    applyAchievements();
    ui.render(state, t);
    scheduleGolden();
  },
  onWatchAd: () => {
    if (!canWatchAd(state, now())) return;
    ui.playRewardedAd(() => {
      state = applyAdReward(state, now());
      audio.playGolden();
      ui.showToast('📺 ブースト獲得！ 生産 ×3（90秒）');
      ui.render(state, now());
      persist();
    });
  },
  onReset: () => {
    if (confirm('進行をリセットしますか？この操作は元に戻せません。')) {
      storage.removeItem(SAVE_KEY);
      state = createState();
      ui.render(state, now());
    }
  },
});

if (!storage.real) ui.showStorageWarning();
if (offlineGained > 0) ui.showOfflineToast(offlineGained);

ui.render(state, now());

let stopLoop = null;
const loopDeps = {
  getState: () => state,
  setState: (s) => { state = s; },
  onTick: () => { applyAchievements(); ui.render(state, now()); },
  onTierComplete: () => { ui.playZoom(); audio.playZoom(); },
  onCleared: (s) => { ui.showClear(s); audio.playClear(); },
  now,
  raf: (cb) => requestAnimationFrame(cb),
};
function startLoop() {
  if (!stopLoop) stopLoop = start(loopDeps);
}
startLoop();

function applyAchievements() {
  const { state: next, unlocked } = unlockPending(state);
  if (!unlocked.length) return;
  state = next;
  ui.showToast('🏆 実績解除: ' + unlocked.map((a) => a.name).join(' / '));
  audio.playAch();
}

function persist() {
  state = { ...state, lastSeen: now() };
  save(storage, state);
}

setInterval(persist, 5000);

// Tab visibility: pause the loop while hidden; on return, apply the elapsed
// time as offline progress (avoids double-counting since the loop was stopped).
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = now();
    persist();
    if (stopLoop) { stopLoop(); stopLoop = null; }
  } else {
    if (hiddenAt) {
      const res = applyOfflineGain(state, now() - hiddenAt);
      state = res.state;
      if (res.gain > 0 && now() - hiddenAt > 60000) ui.showOfflineToast(res.gain);
      hiddenAt = 0;
    }
    startLoop();
    ui.render(state, now());
  }
});
window.addEventListener('beforeunload', persist);

// breaking-news ticker
ui.setTicker(pickHeadline(state));
setInterval(() => ui.setTicker(pickHeadline(state)), 10000);

// golden virus: appears at random intervals for a short window
let goldenHideTimer = 0;
function scheduleGolden() {
  setTimeout(spawnGolden, goldenIntervalMs(state));
}
function spawnGolden() {
  ui.showGolden();
  goldenHideTimer = setTimeout(() => { ui.hideGolden(); scheduleGolden(); }, 12000);
}
scheduleGolden();
