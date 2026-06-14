// Parametric avatar: each part is an index into these option arrays.
// Simple shapes, but the combination (8 x 6 x 6 x 6 = 1728) makes each person distinct.
export const HUES = [350, 18, 42, 135, 172, 205, 262, 312];
export const EYES = ["dot", "happy", "wide", "sleepy", "wink", "cool"];
export const MOUTHS = ["smile", "small", "open", "cat", "flat", "grin"];
export const TOPS = ["none", "tuft", "antenna", "bow", "cap", "spike"];

export const PARTS = { hue: HUES, eyes: EYES, mouth: MOUTHS, top: TOPS };

// Deterministic avatar from a numeric seed (so auto-generated people are stable).
export function defaultAvatar(seed) {
  return {
    hue: seed % HUES.length,
    eyes: Math.floor(seed / 8) % EYES.length,
    mouth: Math.floor(seed / 64) % MOUTHS.length,
    top: Math.floor(seed / 512) % TOPS.length,
  };
}

// Return a new avatar with `part` moved by `dir` (+1 / -1), wrapping. Non-destructive.
export function cyclePart(avatar, part, dir) {
  const len = PARTS[part].length;
  return { ...avatar, [part]: (avatar[part] + dir + len) % len };
}
