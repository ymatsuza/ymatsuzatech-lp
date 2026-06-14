export function tapPower(tapPowerLevel) {
  return 1 * Math.pow(1.25, tapPowerLevel);
}

export function passiveRate(totalLevels, passiveMultLevel) {
  return totalLevels * 0.1 * Math.pow(1.5, passiveMultLevel);
}

export function levelThreshold(level) {
  return 10 * Math.pow(1.5, level);
}

export function unlockCost(personCount) {
  return Math.floor(50 * Math.pow(1.6, personCount));
}

export function upgradeCost(kind, level) {
  const base = kind === "tapPower" ? 100 : 200;
  const rate = kind === "tapPower" ? 1.5 : 1.7;
  return Math.floor(base * Math.pow(rate, level));
}
