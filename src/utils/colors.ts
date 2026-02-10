/** Interpolate between two hex colors; t in [0, 1]. */
export function interpolateHex(a: string, b: string, t: number): string {
  const parse = (hex: string) =>
    hex.slice(1).match(/.{2}/g)!.map((x) => parseInt(x, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Green (low) → yellow → red (high). Returns hex. */
export function getScoreColor(
  score: number,
  minScore: number,
  maxScore: number
): string {
  if (maxScore <= minScore) return "#94a3b8";
  const t = (score - minScore) / (maxScore - minScore);
  if (t <= 0.5) {
    return interpolateHex("#22c55e", "#eab308", t * 2);
  }
  return interpolateHex("#eab308", "#dc2626", (t - 0.5) * 2);
}
