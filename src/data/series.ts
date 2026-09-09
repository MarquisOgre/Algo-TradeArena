/** Deterministic pseudo-random series generator for simulated (paper) data. */
export function series(seed: number, length = 40, drift = 0.4, vol = 2.2, start = 100) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < length; i++) {
    v = v + drift + (rand() - 0.5) * vol;
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}
