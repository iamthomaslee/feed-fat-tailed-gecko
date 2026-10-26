export type BugKind = "ant" | "spider" | "mealworm" | "silkworm" | "cricket" | "fly";

export type BugInfo = {
  name: string;
  points: number;
  /** Collision radius in px */
  size: number;
  /** Relative spawn frequency */
  weight: number;
};

export const BUGS: Record<BugKind, BugInfo> = {
  ant: { name: "개미", points: 1, size: 8, weight: 30 },
  spider: { name: "거미", points: 1, size: 10, weight: 25 },
  mealworm: { name: "밀웜", points: 2, size: 10, weight: 20 },
  silkworm: { name: "누에 애벌레", points: 2, size: 12, weight: 15 },
  cricket: { name: "귀뚜라미", points: 3, size: 11, weight: 10 },
  fly: { name: "파리", points: 5, size: 9, weight: 6 },
};

export const BUG_KINDS = Object.keys(BUGS) as BugKind[];

/** Bugs worth more points move faster. */
export function bugSpeed(kind: BugKind): number {
  return 30 + BUGS[kind].points * 30; // 1pt: 60, 2pt: 90, 3pt: 120, 5pt: 180 px/s
}

export function pickRandomKind(): BugKind {
  const total = BUG_KINDS.reduce((sum, k) => sum + BUGS[k].weight, 0);
  let r = Math.random() * total;
  for (const k of BUG_KINDS) {
    r -= BUGS[k].weight;
    if (r <= 0) return k;
  }
  return "ant";
}
