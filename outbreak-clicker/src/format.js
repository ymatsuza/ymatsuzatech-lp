// Pure number formatting for the UI. No DOM dependency.

const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/**
 * Format a non-negative number into a short human-readable string.
 * < 1000 -> floored integer. Otherwise K/M/B/T/... with 2 decimals.
 * Beyond the known units, fall back to exponential notation.
 * Bad input (NaN, Infinity, negative) -> '0'.
 */
export function short(n) {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n < 1000) return String(Math.floor(n));
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier < UNITS.length) {
    const scaled = n / 1000 ** tier;
    return scaled.toFixed(2) + UNITS[tier];
  }
  return n.toExponential(2);
}
