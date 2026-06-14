// Tiny WebAudio SFX — synthesized, no asset files. The AudioContext is created
// lazily on the first sound (after a user gesture) to satisfy autoplay rules.

let ctx = null;
let muted = false;

function ac() {
  if (ctx == null) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = false; // unsupported — give up quietly
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx || null;
}

export function setMuted(m) { muted = !!m; }
export function isMuted() { return muted; }

function blip({ freq = 440, dur = 0.08, type = 'sine', gain = 0.06, slideTo = null }) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const playTap = (freq = 180) => blip({ freq: freq + Math.random() * 30, dur: 0.05, type: 'triangle', gain: 0.035 });
export const playBuy = () => { blip({ freq: 520, dur: 0.07, type: 'square', gain: 0.045 }); blip({ freq: 800, dur: 0.09, type: 'square', gain: 0.035 }); };
export const playOutbreak = () => blip({ freq: 130, slideTo: 720, dur: 0.45, type: 'sawtooth', gain: 0.08 });
export const playZoom = () => blip({ freq: 280, slideTo: 1300, dur: 0.55, type: 'sine', gain: 0.07 });
export const playClear = () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip({ freq: f, dur: 0.32, type: 'sine', gain: 0.07 }), i * 130));
export const playAch = () => { blip({ freq: 660, dur: 0.1, type: 'sine', gain: 0.05 }); setTimeout(() => blip({ freq: 990, dur: 0.14, type: 'sine', gain: 0.05 }), 90); };
export const playGolden = () => [784, 988, 1318, 1568].forEach((f, i) => setTimeout(() => blip({ freq: f, dur: 0.18, type: 'triangle', gain: 0.06 }), i * 70));
