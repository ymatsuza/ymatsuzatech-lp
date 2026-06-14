// Ad reward logic (pure). The actual ad *display* lives in ui.js so the
// provider can be swapped: a dev stub now, a real AdMob rewarded ad in the
// Capacitor/Android build (see README "広告"). Reward reuses the frenzy field.

const AD_COOLDOWN_MS = 180000; // 3 minutes between rewarded ads
const AD_FRENZY = { mult: 3, durMs: 90000 }; // x3 production for 90s

export function canWatchAd(state, now) {
  return now >= (state.adCooldownUntil || 0);
}

export function adCooldownRemainingMs(state, now) {
  return Math.max(0, (state.adCooldownUntil || 0) - now);
}

export function applyAdReward(state, now) {
  return {
    ...state,
    frenzy: { activeUntil: now + AD_FRENZY.durMs, mult: AD_FRENZY.mult },
    adCooldownUntil: now + AD_COOLDOWN_MS,
  };
}
