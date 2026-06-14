function trim1(x) {
  const r = Math.floor(x * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function format(n) {
  if (!Number.isFinite(n)) return "∞";
  const abs = Math.abs(n);
  if (abs < 10000) return String(Math.floor(n));
  const units = [
    { v: 1e12, s: "兆" },
    { v: 1e8, s: "億" },
    { v: 1e4, s: "万" },
  ];
  for (const u of units) {
    if (abs >= u.v) {
      const x = n / u.v;
      return (x >= 100 ? String(Math.floor(x)) : trim1(x)) + u.s;
    }
  }
  return String(Math.floor(n));
}

// Like format(), but keeps one decimal place for small fractional values
// (e.g. tap power 1.25 → "1.3", rate 0.9 → "0.9") so upgrades are visible.
export function formatDecimal(n) {
  if (!Number.isFinite(n)) return "∞";
  if (Math.abs(n) < 10000) {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  }
  return format(n);
}
