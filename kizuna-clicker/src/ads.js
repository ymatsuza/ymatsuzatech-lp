// Thin ad layer. On native (Capacitor) it drives AdMob via the runtime-injected
// `window.Capacitor.Plugins.AdMob` (no bundler needed). On the web it no-ops, and
// the rewarded call resolves true so the game stays fully playable in a browser.
//
// These are Google's official TEST ad unit IDs. Replace with your own AdMob unit
// IDs (and the App ID in android/app/src/main/AndroidManifest.xml) before release.
const BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
const REWARD_ID = "ca-app-pub-3940256099942544/5224354917";

function admob() {
  return globalThis.Capacitor && globalThis.Capacitor.Plugins
    ? globalThis.Capacitor.Plugins.AdMob
    : null;
}

export function isNative() {
  const C = globalThis.Capacitor;
  if (!C) return false;
  return typeof C.isNativePlatform === "function"
    ? C.isNativePlatform()
    : C.platform && C.platform !== "web";
}

export async function initAds() {
  const AdMob = admob();
  if (!isNative() || !AdMob) return;
  try {
    await AdMob.initialize({ initializeForTesting: true });
  } catch (e) {
    console.warn("[ads] init failed:", e);
  }
}

export async function showBanner() {
  const AdMob = admob();
  if (!isNative() || !AdMob) return false;
  try {
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: "ADAPTIVE_BANNER",
      position: "BOTTOM_CENTER",
      margin: 0,
      isTesting: true,
    });
    return true;
  } catch (e) {
    console.warn("[ads] banner failed:", e);
    return false;
  }
}

// Show a rewarded video. Resolves true if the reward was earned.
export async function showRewarded() {
  const AdMob = admob();
  if (!isNative() || !AdMob) return true; // web/dev: grant the reward directly
  let rewarded = false;
  let sub = null;
  try {
    sub = await AdMob.addListener("onRewardedVideoAdReward", () => { rewarded = true; });
    await AdMob.prepareRewardVideoAd({ adId: REWARD_ID, isTesting: true });
    await AdMob.showRewardVideoAd();
    return rewarded;
  } catch (e) {
    console.warn("[ads] rewarded failed:", e);
    return false;
  } finally {
    if (sub && typeof sub.remove === "function") {
      try { await sub.remove(); } catch {}
    }
  }
}
