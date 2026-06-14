// DOM rendering and view-side effects. State lives in main.js; this module
// only reads state to paint the screen and forwards user input via handlers.

import { TIERS } from './tiers.js';
import { UPGRADES } from './upgrades.js';
import * as eco from './economy.js';
import * as ob from './outbreak.js';
import { short } from './format.js';
import { hostSvg, setHostFill } from './hosts.js';
import { ACHIEVEMENTS } from './achievements.js';
import { frenzyMultiplier } from './golden.js';
import { canWatchAd, adCooldownRemainingMs } from './ads.js';
import { STRAINS, byId as strainById } from './strains.js';
import { PERKS } from './perks.js';

const els = {};
const rows = new Map(); // upgrade id -> { root, lvl, cost, desc }
let handlers = {};
let toastTimer = 0;
let lastHostTier = -1;
let lastRoster = '';

const TRAIT_LABEL = { tapper: 'タッパー（タップ特化）', spreader: 'スプレッダー（自動特化）', amplifier: '増幅（全体倍率）', balanced: '均衡型' };

const $ = (sel) => document.querySelector(sel);

export function init(h) {
  handlers = h;
  for (const id of [
    'host-label', 'stage-label', 'balance', 'rate', 'stage-bg', 'strains', 'floats',
    'prog-label', 'prog-next', 'prog-fill', 'outbreak-btn', 'outbreak-fill',
    'outbreak-label', 'upgrade-list', 'reset-btn', 'toast', 'clear-overlay',
    'clear-stats', 'clear-continue', 'stage', 'mute-btn',
    'prestige-btn', 'prestige-label', 'prestige-info',
    'ach-btn', 'ach-count', 'ach-overlay', 'ach-list', 'ach-close', 'ticker', 'golden',
    'ad-btn', 'ad-overlay', 'ad-countdown',
    'lab-btn', 'lab-overlay', 'lab-list', 'lab-close',
    'settings-btn', 'settings-overlay', 'set-export', 'set-code', 'set-import', 'set-msg', 'set-close', 'set-stats',
    'dnalab-btn', 'dnalab-overlay', 'dnalab-dna', 'dnalab-list', 'dnalab-close',
  ]) {
    els[id] = document.getElementById(id);
  }

  // delegated tap on any strain
  els['strains'].addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.strain');
    if (!btn) return;
    e.preventDefault();
    btn.classList.remove('tap');
    void btn.offsetWidth;
    btn.classList.add('tap');
    handlers.onTapStrain(btn.dataset.id, e);
  });
  els['outbreak-btn'].addEventListener('click', () => handlers.onOutbreak());
  els['reset-btn'].addEventListener('click', () => handlers.onReset());
  els['mute-btn'].addEventListener('click', () => handlers.onToggleMute());
  els['prestige-btn'].addEventListener('click', () => handlers.onPrestige());
  els['ach-btn'].addEventListener('click', () => handlers.onOpenAchievements());
  els['ach-close'].addEventListener('click', () => els['ach-overlay'].classList.add('hidden'));
  els['golden'].addEventListener('click', () => handlers.onGolden());
  els['ad-btn'].addEventListener('click', () => handlers.onWatchAd());
  els['lab-btn'].addEventListener('click', () => handlers.onOpenLab());
  els['lab-close'].addEventListener('click', () => els['lab-overlay'].classList.add('hidden'));
  els['lab-list'].addEventListener('click', (e) => {
    const btn = e.target.closest('.lab-act');
    if (!btn) return;
    if (btn.dataset.act === 'synth') handlers.onSynthesize();
    else if (btn.dataset.act === 'level') handlers.onLevelStrain(btn.dataset.id);
  });
  els['settings-btn'].addEventListener('click', () => handlers.onOpenSettings());
  els['set-close'].addEventListener('click', () => els['settings-overlay'].classList.add('hidden'));
  els['set-export'].addEventListener('click', () => handlers.onExportSave());
  els['set-import'].addEventListener('click', () => handlers.onImportSave());
  els['dnalab-btn'].addEventListener('click', () => handlers.onOpenDnaLab());
  els['dnalab-close'].addEventListener('click', () => els['dnalab-overlay'].classList.add('hidden'));
  els['dnalab-list'].addEventListener('click', (e) => {
    const btn = e.target.closest('.lab-act');
    if (btn) handlers.onBuyPerk(btn.dataset.id);
  });
  els['clear-continue'].addEventListener('click', () => {
    els['clear-overlay'].classList.add('hidden');
  });

  lastHostTier = -1;
  lastRoster = '';
  buildUpgradeRows();
}

function renderHost(tier, prog) {
  if (tier !== lastHostTier) {
    els['stage-bg'].innerHTML = hostSvg(tier);
    lastHostTier = tier;
  }
  setHostFill(els['stage-bg'], prog);
}

function buildUpgradeRows() {
  els['upgrade-list'].innerHTML = '';
  rows.clear();
  for (const u of UPGRADES) {
    const root = document.createElement('button');
    root.className = 'upg';
    root.innerHTML =
      `<div class="upg-icon">${u.icon}</div>` +
      `<div class="upg-mid"><div class="upg-name">${u.name} <span class="upg-lvl"></span></div>` +
      `<div class="upg-desc">${u.desc}</div></div>` +
      `<div class="upg-cost"></div>`;
    root.addEventListener('click', () => handlers.onBuy(u.id));
    els['upgrade-list'].appendChild(root);
    rows.set(u.id, {
      root,
      lvl: root.querySelector('.upg-lvl'),
      cost: root.querySelector('.upg-cost'),
    });
  }
}

export function render(state, now) {
  const tier = TIERS[state.tierIndex];

  els.balance.textContent = short(state.balance);
  els.rate.textContent = '+' + short(eco.effectiveRate(state, now)) + '/s' + (frenzyMultiplier(state, now) > 1 ? ' ✨' : '');
  els['host-label'].textContent = 'HOST · ' + tier.host;
  els['stage-label'].textContent = `STAGE ${state.tierIndex + 1} · ${tier.name}`;
  els['mute-btn'].textContent = state.settings && state.settings.muted ? '🔇' : '🔊';
  renderAch(state);

  const prog = eco.tierProgress(state);
  renderHost(state.tierIndex, prog);
  renderStrains(state);
  els['prog-fill'].style.width = (prog * 100).toFixed(1) + '%';
  els['prog-label'].textContent = tier.host + ' 感染度';
  const pct = Math.floor(prog * 100);
  const isFinal = state.tierIndex >= TIERS.length - 1;
  els['prog-next'].textContent = isFinal
    ? `${pct}%${state.cleared ? ' ・制圧完了' : ' → ？？？'}`
    : `${pct}% → 次のステージへ 🔍`;

  renderOutbreak(state, now);
  renderPrestige(state);
  renderAd(state, now);
  renderUpgrades(state);
}

function renderAd(state, now) {
  const can = canWatchAd(state, now);
  els['ad-btn'].disabled = !can;
  els['ad-btn'].textContent = can
    ? '📺 広告を見て 生産×3（90秒）'
    : `📺 次の広告まで ${Math.ceil(adCooldownRemainingMs(state, now) / 1000)}s`;
}

export function playRewardedAd(onComplete) {
  const ov = els['ad-overlay'];
  const label = els['ad-countdown'];
  let n = 3;
  label.textContent = String(n);
  ov.classList.remove('hidden');
  const iv = setInterval(() => {
    n -= 1;
    if (n <= 0) {
      clearInterval(iv);
      ov.classList.add('hidden');
      onComplete();
    } else {
      label.textContent = String(n);
    }
  }, 1000);
}

function renderPrestige(state) {
  const gain = eco.prestigeGain(state);
  const can = eco.canPrestige(state);
  const btn = els['prestige-btn'];
  btn.disabled = !can;
  btn.classList.toggle('ready', can);
  els['prestige-label'].textContent = can ? `🧬 変異する  +${short(gain)} 変異株` : '🧬 変異（要 累計 100K 感染）';
  const bonus = Math.round(eco.prestigeMultiplier(state) * 100 - 100);
  els['prestige-info'].textContent = `変異株 ${short(state.dna || 0)} ・ 生産 +${bonus}%　（変異 ${state.prestiges || 0} 回）`;
}

function spikeRing(count, len1, len2, width, dotR) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const a = ((360 / count) * i).toFixed(1);
    out += `<g transform="rotate(${a})"><line y1="${-len1}" y2="${-len2}"/>${dotR ? `<circle cy="${-len2 - 3}" r="${dotR}" fill="currentColor" stroke="none"/>` : ''}</g>`;
  }
  return `<g stroke="currentColor" stroke-width="${width}" stroke-linecap="round">${out}</g>`;
}

function starPath(points, outer, inner) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += (i === 0 ? 'M' : 'L') + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1) + ' ';
  }
  return d + 'Z';
}

// Distinct silhouette per strain (all driven by currentColor = the strain color).
function strainVirionSvg(id) {
  let inner;
  switch (id) {
    case 'aero': // airborne — fine fuzzy spikes
      inner = spikeRing(16, 15, 31, 1.6) + '<circle r="15" fill="currentColor"/><circle r="15" fill="rgba(255,255,255,0.12)"/>';
      break;
    case 'rapid': // fast — sharp 4-point star
      inner = `<g fill="currentColor"><path d="${starPath(4, 34, 10)}"/></g><circle r="9" fill="rgba(0,0,0,0.25)"/>`;
      break;
    case 'phantom': // latent — ghost blob with hollow eyes
      inner = '<g fill="currentColor" opacity="0.88"><path d="M-20 2 Q-20 -24 0 -24 Q20 -24 20 2 L20 22 L12 14 L4 22 L-4 14 L-12 22 L-20 14 Z"/></g>'
        + '<circle cx="-7" cy="-7" r="4" fill="rgba(0,0,0,0.5)"/><circle cx="7" cy="-7" r="4" fill="rgba(0,0,0,0.5)"/>';
      break;
    case 'crimson': // aggressive — barbed 12-point starburst
      inner = `<g fill="currentColor"><path d="${starPath(12, 35, 15)}"/></g><circle r="9" fill="rgba(0,0,0,0.3)"/>`;
      break;
    case 'omega': // amplifier — nucleus with an orbital ring
      inner = '<g transform="rotate(-20)"><ellipse rx="34" ry="12" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="34" cy="0" r="3" fill="currentColor"/></g>'
        + '<circle r="16" fill="currentColor"/><circle r="6" fill="rgba(255,255,255,0.25)"/>';
      break;
    default: // origin — classic spiky virion
      inner = spikeRing(8, 20, 30, 3, 3.5) + '<circle r="20" fill="currentColor"/>'
        + '<circle cx="-6" cy="-4" r="3.5" fill="rgba(0,0,0,0.3)"/><circle cx="6" cy="5" r="4.5" fill="rgba(0,0,0,0.3)"/>';
  }
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><g transform="translate(40,40)">${inner}</g></svg>`;
}

function renderStrains(state) {
  const owned = eco.ownedStrains(state);
  const sig = owned.map((s) => s.id).join(',');
  if (sig !== lastRoster) {
    els['strains'].innerHTML = owned
      .map((s) => `<button class="strain" data-id="${s.id}" style="--c:${s.color}" aria-label="${s.name}">${strainVirionSvg(s.id)}<span class="strain-lv"></span></button>`)
      .join('');
    lastRoster = sig;
  }
  for (const s of owned) {
    const badge = els['strains'].querySelector(`.strain[data-id="${s.id}"] .strain-lv`);
    if (badge) badge.textContent = 'Lv.' + ((state.strains || {})[s.id] || 1);
  }
}

export function openLab(state) {
  buildLabList(state);
  els['lab-overlay'].classList.remove('hidden');
}

export function openSettings(state) {
  buildStats(state);
  els['set-code'].value = '';
  els['set-msg'].textContent = '';
  els['settings-overlay'].classList.remove('hidden');
}

function fmtPlaytime(ms) {
  const sec = Math.floor((ms || 0) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h) return `${h}時間${m}分`;
  return m ? `${m}分${sec % 60}秒` : `${sec % 60}秒`;
}

function buildStats(state) {
  const tier = TIERS[state.tierIndex];
  let achN = 0;
  for (const a of ACHIEVEMENTS) if ((state.achievements || {})[a.id]) achN++;
  const rows = [
    ['累計感染数', short(state.totalProduced || 0)],
    ['総タップ数', short(state.taps || 0)],
    ['アウトブレイク', `${state.outbreaks || 0} 回`],
    ['ゴールデン捕獲', short(state.goldens || 0)],
    ['変異', `${state.prestiges || 0} 回`],
    ['変異株 DNA', short(state.dna || 0)],
    ['到達ステージ', `${state.tierIndex + 1} ・ ${tier.name}`],
    ['所有株', `${eco.ownedStrains(state).length} / ${STRAINS.length}`],
    ['実績', `${achN} / ${ACHIEVEMENTS.length}`],
    ['プレイ時間', fmtPlaytime(state.playMs)],
  ];
  els['set-stats'].innerHTML = rows
    .map(([k, v]) => `<div class="stat-row"><span>${k}</span><span class="stat-v">${v}</span></div>`)
    .join('');
}

export function showExport(code) {
  els['set-code'].value = code;
  els['set-code'].select();
  try {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
  } catch {
    // clipboard may be blocked — the textarea is selected for manual copy
  }
  settingsMsg('コードをコピーしました（下のテキストも選択済み）', true);
}

export function getImportCode() {
  return els['set-code'].value;
}

export function settingsMsg(text, ok = true) {
  els['set-msg'].textContent = text;
  els['set-msg'].style.color = ok ? '#7fe0a8' : 'var(--accent)';
}

export function openDnaLab(state) {
  buildPerkList(state);
  els['dnalab-overlay'].classList.remove('hidden');
}

export function refreshDnaLab(state) {
  if (!els['dnalab-overlay'].classList.contains('hidden')) buildPerkList(state);
}

function buildPerkList(state) {
  els['dnalab-dna'].textContent = `所持 変異株(DNA): ${short(state.dna || 0)}`;
  els['dnalab-list'].innerHTML = PERKS.map((p) => {
    const lvl = (state.perks || {})[p.id] || 0;
    const maxed = lvl >= p.maxLevel;
    const can = eco.canBuyPerk(state, p.id);
    const costLabel = maxed ? 'MAX' : `${short(eco.perkCost(state, p.id))} DNA`;
    return `<div class="lab-row"><div class="lab-ic" style="color:#b89cff">${p.icon}</div>`
      + `<div class="lab-mid"><div class="lab-name">${p.name} <span style="color:#b89cff">Lv.${lvl}/${p.maxLevel}</span></div>`
      + `<div class="lab-sub">${p.desc}</div></div>`
      + `<button class="lab-act synth" data-id="${p.id}"${can ? '' : ' disabled'}>${costLabel}</button></div>`;
  }).join('');
}

export function refreshLab(state) {
  if (!els['lab-overlay'].classList.contains('hidden')) buildLabList(state);
}

function buildLabList(state) {
  const next = eco.nextStrain(state);
  els['lab-list'].innerHTML = STRAINS.map((s) => {
    const level = (state.strains || {})[s.id] || 0;
    if (level >= 1) {
      const cost = eco.strainLevelCost(state, s.id);
      const can = eco.canLevelStrain(state, s.id);
      return `<div class="lab-row"><div class="lab-ic" style="color:${s.color}">${s.icon}</div>`
        + `<div class="lab-mid"><div class="lab-name">${s.name} <span style="color:${s.color}">Lv.${level}</span></div>`
        + `<div class="lab-sub">${TRAIT_LABEL[s.trait] || ''}</div></div>`
        + `<button class="lab-act" data-act="level" data-id="${s.id}"${can ? '' : ' disabled'}>強化 ${short(cost)}</button></div>`;
    }
    if (next && s.id === next.id) {
      const can = eco.canSynthesize(state);
      return `<div class="lab-row"><div class="lab-ic">🧬</div>`
        + `<div class="lab-mid"><div class="lab-name">新しい株を合成</div><div class="lab-sub">未知の株を作り出す</div></div>`
        + `<button class="lab-act synth" data-act="synth"${can ? '' : ' disabled'}>合成 ${short(s.synthCost)}</button></div>`;
    }
    return `<div class="lab-row locked"><div class="lab-ic">🔒</div><div class="lab-mid"><div class="lab-name">？？？</div><div class="lab-sub">？？？</div></div></div>`;
  }).join('');
}

function renderAch(state) {
  const have = state.achievements || {};
  let n = 0;
  for (const a of ACHIEVEMENTS) if (have[a.id]) n++;
  els['ach-count'].textContent = n + '/' + ACHIEVEMENTS.length;
}

export function openAchievements(state) {
  const have = state.achievements || {};
  els['ach-list'].innerHTML = ACHIEVEMENTS.map((a) => {
    const on = !!have[a.id];
    return `<div class="ach-row ${on ? 'unlocked' : 'locked'}">`
      + `<div class="ach-ic">${on ? a.icon : '🔒'}</div>`
      + `<div><div class="ach-name">${on ? a.name : '？？？'}</div><div class="ach-desc">${on ? a.desc : '？？？'}</div></div></div>`;
  }).join('');
  els['ach-overlay'].classList.remove('hidden');
}

function renderOutbreak(state, now) {
  const btn = els['outbreak-btn'];
  const active = ob.isActive(state, now);
  const canAct = ob.canActivate(state, now);
  btn.classList.toggle('active', active);
  btn.classList.toggle('ready', canAct);
  btn.disabled = !canAct;

  if (active) {
    const secs = Math.ceil(ob.outbreakRemainingMs(state, now) / 1000);
    els['outbreak-label'].textContent = `アウトブレイク中! ×${ob.outbreakMultiplier(state, now)} ・残り${secs}s`;
    els['outbreak-fill'].style.width = '100%';
  } else if (canAct) {
    els['outbreak-label'].textContent = 'アウトブレイク 発動可能!';
    els['outbreak-fill'].style.width = '100%';
  } else {
    const pct = Math.floor(ob.meterRatio(state) * 100);
    els['outbreak-label'].textContent = `アウトブレイク ${pct}%`;
    els['outbreak-fill'].style.width = pct + '%';
  }
}

function renderUpgrades(state) {
  for (const u of UPGRADES) {
    const r = rows.get(u.id);
    const level = state.upgrades[u.id] || 0;
    r.lvl.textContent = level > 0 ? 'Lv.' + level : '';

    if (!eco.isUnlocked(state, u)) {
      r.cost.textContent = '🔒 ' + TIERS[u.unlockTier].name;
      r.root.classList.add('locked');
      r.root.classList.remove('affordable');
      r.root.disabled = true;
      continue;
    }
    const cost = eco.upgradeCost(u, level);
    r.cost.textContent = short(cost);
    r.root.classList.remove('locked');
    const afford = state.balance >= cost;
    r.root.disabled = !afford;
    r.root.classList.toggle('affordable', afford);
  }
}

export function spawnFloat(amount, event, color) {
  const host = els.floats;
  const rect = host.getBoundingClientRect();
  let x = rect.width / 2;
  let y = rect.height / 2;
  if (event && typeof event.clientX === 'number') {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }
  const span = document.createElement('span');
  span.className = 'float';
  span.textContent = '+' + short(amount);
  span.style.left = x + 'px';
  span.style.top = y + 'px';
  if (color) span.style.color = color;
  host.appendChild(span);
  span.addEventListener('animationend', () => span.remove(), { once: true });
}

export function playZoom() {
  els.stage.classList.remove('zoom-anim');
  void els.stage.offsetWidth;
  els.stage.classList.add('zoom-anim');
}

export function showClear(state) {
  els['clear-stats'].innerHTML =
    `累計感染数 <b>${short(state.totalProduced)}</b><br>` +
    `スコア倍率 <b>×${eco.scoreMultiplier(state).toFixed(2)}</b><br>` +
    `全ての宇宙が沈黙した。…が、まだ増殖は止まらない。`;
  els['clear-overlay'].classList.remove('hidden');
}

export function setTicker(text) {
  if (!text) return;
  const el = els['ticker'];
  el.textContent = text;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

export function showGolden() {
  const stage = els['stage'];
  const g = els['golden'];
  const gw = 72;
  const gh = 72;
  g.style.left = (8 + Math.random() * Math.max(8, stage.clientWidth - gw - 16)) + 'px';
  g.style.top = (8 + Math.random() * Math.max(8, stage.clientHeight - gh - 16)) + 'px';
  g.classList.remove('hidden');
}

export function hideGolden() {
  els['golden'].classList.add('hidden');
}

export function showToast(msg, ms = 4500) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

export function showOfflineToast(gain) {
  showToast(`🦠 離れている間に +${short(gain)} 感染`);
}

export function showStorageWarning() {
  showToast('⚠ 進行が保存されません（プライベートモードかも）', 6000);
}
