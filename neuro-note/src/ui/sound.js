// 依存ゼロの効果音（WebAudio で音を合成。音声ファイルなし）。
// ミュート状態は localStorage に保存。
const KEY = "neuro-note:muted";

export function createSound() {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === "1"; } catch {}

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, peak, type = "sine") {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + start;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    success() { if (!muted) [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.08, 0.3, 0.1)); }, // C-E-G
    fanfare() { if (!muted) [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.5, 0.12)); },
    blip() { if (!muted) tone(880, 0, 0.07, 0.04, "triangle"); }, // 用語カード
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch {}
      return muted;
    },
  };
}
