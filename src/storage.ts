import type { BonusCombination, Point, PointId } from "./types";

const STORAGE_KEY = "matt-planner-race";

export type PersistedRaceState = {
  points: Point[];
  bonusCombinations: BonusCombination[];
  visitedPointIds: PointId[];
};

const DEFAULT: PersistedRaceState = {
  points: [],
  bonusCombinations: [],
  visitedPointIds: [],
};

function isPoint(p: unknown): p is Point {
  return (
    p !== null &&
    typeof p === "object" &&
    typeof (p as Point).id === "string" &&
    typeof (p as Point).name === "string" &&
    typeof (p as Point).lat === "number" &&
    typeof (p as Point).lng === "number" &&
    typeof (p as Point).baseScore === "number" &&
    typeof (p as Point).task === "string"
  );
}

function isBonusCombination(c: unknown): c is BonusCombination {
  return (
    c !== null &&
    typeof c === "object" &&
    typeof (c as BonusCombination).id === "string" &&
    Array.isArray((c as BonusCombination).pointIds) &&
    typeof (c as BonusCombination).bonusScore === "number"
  );
}

/** Load race state from localStorage. Returns default if missing or invalid. */
export function loadRaceState(): PersistedRaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return { ...DEFAULT };

    const data = JSON.parse(raw) as unknown;
    if (data === null || typeof data !== "object") return { ...DEFAULT };

    const points = Array.isArray(data.points)
      ? data.points.filter(isPoint)
      : DEFAULT.points;
    const bonusCombinations = Array.isArray(data.bonusCombinations)
      ? data.bonusCombinations.filter(isBonusCombination)
      : DEFAULT.bonusCombinations;
    const visitedPointIds = Array.isArray(data.visitedPointIds)
      ? data.visitedPointIds.filter((id): id is PointId => typeof id === "string")
      : DEFAULT.visitedPointIds;

    return { points, bonusCombinations, visitedPointIds };
  } catch {
    return { ...DEFAULT };
  }
}

/** Save race state to localStorage. */
export function saveRaceState(state: PersistedRaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or other storage errors
  }
}
