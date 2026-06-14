import * as State from "./state.js";
import { tapPower } from "./economy.js";
import { pickAmbient, eventLineFor, fillTemplate, milestonesCrossed } from "./stories.js";
import { initAds, showBanner, showRewarded } from "./ads.js";
import {
  syncPeople, stepPositions, spawnTapFx, spawnLevelUpFx, showBubble, showToast,
  renderHud, renderShop, showOfflinePopup, bindUi, openProfile, bindProfile,
  renderReward, bindReward,
} from "./view.js";

const state = State.load();
const offlineGain = State.applyOfflineProgress(state);

syncPeople(state);
renderHud(state);
renderShop(state);
renderReward(state);
showOfflinePopup(offlineGain);

// Ads: native only. On web these no-op and the rewarded button grants the boost directly.
initAds()
  .then(() => showBanner())
  .then((shown) => { if (shown) document.body.classList.add("has-banner"); });

bindUi({
  onTapPerson(id) {
    const p = state.people.find((x) => x.id === id);
    if (!p) return;
    const before = p.level;
    const power = tapPower(state.upgrades.tapPowerLevel);
    State.tapPerson(state, id, State.heartsMultiplier(state));
    spawnTapFx(id, power);
    if (p.level > before) {
      spawnLevelUpFx(id);
      for (const lv of milestonesCrossed(before, p.level)) {
        const line = eventLineFor(lv);
        if (!line) continue;
        const text = fillTemplate(line, p.name);
        State.logStory(p, text);
        showBubble(id, text, true);
      }
    }
    renderHud(state);
    renderShop(state);
  },
  onUnlock() {
    if (State.tryUnlockPerson(state)) {
      syncPeople(state);
      renderHud(state);
      renderShop(state);
    }
  },
  onUpgrade(kind) {
    if (State.tryBuyUpgrade(state, kind)) {
      renderHud(state);
      renderShop(state);
    }
  },
  onOpenProfile(id) {
    const p = state.people.find((x) => x.id === id);
    if (p) openProfile(p);
  },
});

bindProfile({ onChange() { State.save(state); } });

bindReward({
  async onWatch() {
    const ok = await showRewarded();
    if (!ok) return;
    State.activateBoost(state);
    State.save(state);
    showToast("ハート2倍! " + State.BOOST_SECONDS + "秒");
    renderReward(state);
  },
});

let last = performance.now();
let sinceSave = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  State.tick(state, dt, State.heartsMultiplier(state));
  stepPositions(state, dt);
  renderHud(state);
  renderShop(state);
  renderReward(state);
  sinceSave += dt;
  if (sinceSave > 3) { State.save(state); sinceSave = 0; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener("visibilitychange", () => { if (document.hidden) State.save(state); });
addEventListener("beforeunload", () => State.save(state));

// Ambient: a random person mutters a dry one-liner now and then; it also joins their story.
function ambientTick() {
  if (state.people.length === 0) return;
  const p = state.people[Math.floor(Math.random() * state.people.length)];
  const text = fillTemplate(pickAmbient(), p.name);
  State.logStory(p, text);
  showBubble(p.id, text, false);
}
setTimeout(ambientTick, 3000);
setInterval(ambientTick, 9000);

// Population: people drift in and out over time. Nurture a visitor to settle them in.
function populationTick() {
  const { left, arrived } = State.stepPopulation(state);
  if (left.length === 0 && arrived.length === 0) return;
  syncPeople(state);
  for (const p of arrived) {
    State.logStory(p, p.name + "がふらっとやってきた。");
    showBubble(p.id, "やあ", false);
  }
  for (const p of left) {
    State.logStory(p, p.name + "は、ふらっと帰っていった。また来るかも。");
  }
  if (arrived.length) showToast(arrived[0].name + " がやってきた");
  else if (left.length) showToast(left[0].name + " が帰っていった");
  renderShop(state);
  State.save(state);
}
setInterval(populationTick, 25000);
