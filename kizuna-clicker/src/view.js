import { format, formatDecimal } from "./format.js";
import { tapPower, passiveRate, unlockCost, upgradeCost, levelThreshold } from "./economy.js";
import { totalLevels, renamePerson, residentCount, boostActive } from "./state.js";
import { HUES, EYES, MOUTHS, TOPS, cyclePart } from "./avatar.js";

const PERSON_SIZE = 72;
const stage = document.getElementById("stage");
const els = new Map(); // id -> { root, avatarEl, fill, meterText, nameLabel, lastLevel, lastAff }

function tierOf(level) { return level < 3 ? 1 : level < 8 ? 2 : 3; }

function avatarInnerHtml() {
  return (
    '<div class="top"></div>' +
    '<div class="face"><div class="eyes"></div><div class="mouth"></div></div>'
  );
}

function applyAvatar(avatarEl, av) {
  avatarEl.style.setProperty("--hue", String(HUES[av.hue]));
  avatarEl.querySelector(".top").dataset.style = TOPS[av.top];
  avatarEl.querySelector(".eyes").dataset.style = EYES[av.eyes];
  avatarEl.querySelector(".mouth").dataset.style = MOUTHS[av.mouth];
}

function createPersonEl(p) {
  const w = Math.max(0, stage.clientWidth - PERSON_SIZE);
  const h = Math.max(0, stage.clientHeight - PERSON_SIZE);
  const root = document.createElement("div");
  root.className = "person";
  root.dataset.id = String(p.id);
  root.innerHTML =
    '<div class="avatar">' + avatarInnerHtml() + "</div>" +
    '<div class="meter"><div class="meter-fill"></div><div class="meter-text"></div></div>' +
    '<div class="name-label"></div>';
  const avatarEl = root.querySelector(".avatar");
  applyAvatar(avatarEl, p.avatar);
  const nameLabel = root.querySelector(".name-label");
  nameLabel.textContent = p.name;
  if (p.x == null) p.x = Math.random() * w;
  if (p.y == null) p.y = Math.random() * h;
  if (p.vx == null) p.vx = (Math.random() * 2 - 1) * 18;
  if (p.vy == null) p.vy = (Math.random() * 2 - 1) * 18;
  p.bob = Math.random() * Math.PI * 2;
  stage.appendChild(root);
  els.set(p.id, {
    root, avatarEl,
    fill: root.querySelector(".meter-fill"),
    meterText: root.querySelector(".meter-text"),
    nameLabel, lastLevel: -1, lastAff: -1,
  });
}

// Create elements for present people; remove elements for those who left.
export function syncPeople(state) {
  const present = new Set();
  for (const p of state.people) {
    if (!p.present) continue;
    present.add(p.id);
    if (!els.has(p.id)) createPersonEl(p);
  }
  for (const [id, e] of els) {
    if (!present.has(id)) { e.root.remove(); els.delete(id); }
  }
}

export function refreshIdentity(person) {
  const e = els.get(person.id);
  if (!e) return;
  applyAvatar(e.avatarEl, person.avatar);
  e.nameLabel.textContent = person.name;
}

function updateMeter(e, p) {
  const next = levelThreshold(p.level);
  const prev = p.level === 0 ? 0 : levelThreshold(p.level - 1);
  const frac = Math.max(0, Math.min(1, (p.affection - prev) / (next - prev)));
  e.fill.style.width = (frac * 100).toFixed(1) + "%";
  e.meterText.textContent = "Lv." + p.level + " · " + format(p.affection);
}

export function stepPositions(state, dt) {
  const w = Math.max(0, stage.clientWidth - PERSON_SIZE);
  const h = Math.max(0, stage.clientHeight - PERSON_SIZE);
  for (const p of state.people) {
    const e = els.get(p.id);
    if (!e) continue;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
    if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx); }
    if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
    if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
    p.bob += dt * 2;
    const bobY = Math.sin(p.bob) * 4;
    e.root.style.transform = `translate(${p.x}px, ${p.y + bobY}px)`;
    if (e.lastLevel !== p.level) {
      e.lastLevel = p.level;
      e.root.dataset.tier = String(tierOf(p.level));
    }
    if (e.lastAff !== p.affection) {
      e.lastAff = p.affection;
      updateMeter(e, p);
    }
  }
}

export function spawnTapFx(personId, amount) {
  const e = els.get(personId);
  if (!e) return;
  const r = e.root.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const cx = r.left - s.left + r.width / 2;
  const cy = r.top - s.top + r.height / 2;
  const heart = document.createElement("div");
  heart.className = "heart-particle";
  heart.textContent = "❤️";
  heart.style.left = cx + "px";
  heart.style.top = cy + "px";
  const txt = document.createElement("div");
  txt.className = "float-text";
  txt.textContent = "+" + formatDecimal(amount);
  txt.style.left = cx + "px";
  txt.style.top = (cy - 10) + "px";
  stage.append(heart, txt);
  setTimeout(() => { heart.remove(); txt.remove(); }, 950);
}

export function spawnLevelUpFx(personId) {
  const e = els.get(personId);
  if (!e) return;
  const ring = document.createElement("div");
  ring.className = "levelup-ring";
  e.root.appendChild(ring);
  setTimeout(() => ring.remove(), 620);
}

export function showBubble(personId, text, isEvent = false) {
  const e = els.get(personId);
  if (!e) return;
  const old = e.root.querySelector(".speech-bubble");
  if (old) old.remove();
  const b = document.createElement("div");
  b.className = "speech-bubble" + (isEvent ? " event" : "");
  b.textContent = text;
  e.root.appendChild(b);
  setTimeout(() => b.remove(), 4200);
}

const toast = document.getElementById("toast");
let toastTimer = null;
export function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

const btnReward = document.getElementById("btn-reward");

export function renderReward(state) {
  if (!btnReward) return;
  if (boostActive(state)) {
    const left = Math.max(0, Math.ceil(((state.boostUntil || 0) - Date.now()) / 1000));
    btnReward.textContent = "✨2倍 " + left + "s";
    btnReward.classList.add("active");
  } else {
    btnReward.textContent = "📺 ハート2倍";
    btnReward.classList.remove("active");
  }
}

export function bindReward({ onWatch } = {}) {
  if (!btnReward || !onWatch) return;
  btnReward.addEventListener("click", onWatch);
}

const hudHearts = document.getElementById("hud-hearts");
const hudRate = document.getElementById("hud-rate");
const hudTap = document.getElementById("hud-tap");

export function renderHud(state) {
  hudHearts.textContent = format(state.hearts);
  hudRate.textContent = formatDecimal(passiveRate(totalLevels(state), state.upgrades.passiveMultLevel));
  hudTap.textContent = formatDecimal(tapPower(state.upgrades.tapPowerLevel));
}

const btnUnlock = document.getElementById("btn-unlock");
const btnTap = document.getElementById("btn-tap");
const btnPassive = document.getElementById("btn-passive");
const costUnlock = document.getElementById("cost-unlock");
const costTap = document.getElementById("cost-tap");
const costPassive = document.getElementById("cost-passive");

export function renderShop(state) {
  const uCost = unlockCost(residentCount(state));
  const tCost = upgradeCost("tapPower", state.upgrades.tapPowerLevel);
  const pCost = upgradeCost("passive", state.upgrades.passiveMultLevel);
  costUnlock.textContent = format(uCost);
  costTap.textContent = format(tCost);
  costPassive.textContent = format(pCost);
  btnUnlock.disabled = state.hearts < uCost;
  btnTap.disabled = state.hearts < tCost;
  btnPassive.disabled = state.hearts < pCost;
}

export function showOfflinePopup(amount) {
  if (amount <= 0) return;
  document.getElementById("offline-amount").textContent = format(amount);
  document.getElementById("offline-popup").classList.remove("hidden");
}

// ---- profile / identity editor ----
const profilePanel = document.getElementById("profile-panel");
const profileAvatarBox = document.getElementById("profile-avatar");
profileAvatarBox.innerHTML = '<div class="avatar">' + avatarInnerHtml() + "</div>";
const profileAvatarEl = profileAvatarBox.querySelector(".avatar");
const profileName = document.getElementById("profile-name");
const profileLv = document.getElementById("profile-lv");
const profileAff = document.getElementById("profile-aff");
const profileStory = document.getElementById("profile-story");
let editing = null;

function renderStoryLog(person) {
  profileStory.innerHTML = "";
  const story = Array.isArray(person.story) ? person.story : [];
  if (story.length === 0) {
    const empty = document.createElement("p");
    empty.className = "story-empty";
    empty.textContent = "まだ物語はありません";
    profileStory.appendChild(empty);
    return;
  }
  for (let i = story.length - 1; i >= 0; i--) {
    const line = document.createElement("div");
    line.className = "story-line";
    line.textContent = story[i];
    profileStory.appendChild(line);
  }
}

export function openProfile(person) {
  editing = person;
  applyAvatar(profileAvatarEl, person.avatar);
  profileName.value = person.name;
  profileLv.textContent = "Lv." + person.level;
  profileAff.textContent = format(person.affection);
  renderStoryLog(person);
  profilePanel.classList.remove("hidden");
}

export function bindProfile({ onChange } = {}) {
  const fire = () => onChange && onChange();
  profilePanel.querySelectorAll(".editor-row").forEach((row) => {
    const part = row.dataset.part;
    row.querySelector(".ed-prev").addEventListener("click", () => editPart(part, -1, fire));
    row.querySelector(".ed-next").addEventListener("click", () => editPart(part, +1, fire));
  });
  profileName.addEventListener("input", () => {
    if (!editing) return;
    renamePerson(editing, profileName.value);
    refreshIdentity(editing);
    fire();
  });
  document.getElementById("profile-close").addEventListener("click", () => {
    profilePanel.classList.add("hidden");
    editing = null;
    fire();
  });
}

function editPart(part, dir, fire) {
  if (!editing) return;
  editing.avatar = cyclePart(editing.avatar, part, dir);
  applyAvatar(profileAvatarEl, editing.avatar);
  refreshIdentity(editing);
  fire();
}

export function bindUi({ onTapPerson, onUnlock, onUpgrade, onOpenProfile }) {
  stage.addEventListener("pointerdown", (ev) => {
    const labelEl = ev.target.closest(".name-label");
    if (labelEl) {
      const personEl = labelEl.closest(".person");
      if (personEl) onOpenProfile(Number(personEl.dataset.id));
      return;
    }
    const el = ev.target.closest(".person");
    if (el) onTapPerson(Number(el.dataset.id));
  });
  btnUnlock.addEventListener("click", onUnlock);
  btnTap.addEventListener("click", () => onUpgrade("tapPower"));
  btnPassive.addEventListener("click", () => onUpgrade("passive"));
  document.getElementById("offline-close").addEventListener("click", () => {
    document.getElementById("offline-popup").classList.add("hidden");
  });
}
