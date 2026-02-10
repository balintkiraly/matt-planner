import type {
  BonusCombination,
  Point,
  PointId,
  RaceState,
  ScoreBreakdown,
} from "./types";

/**
 * Calculate the current score for a race state.
 *
 * This function is pure and side‑effect free:
 *  - It does not mutate the provided state.
 *  - It derives the score entirely from the current visitedPointIds.
 *
 * This makes it safe to call on every render or whenever state changes.
 */
export function calculateScore(state: RaceState): ScoreBreakdown {
  const { points, bonusCombinations, visitedPointIds } = state;

  // Use a Set for O(1) membership checks when evaluating bonuses.
  const visitedSet = new Set<PointId>(visitedPointIds);

  let totalBaseScore = 0;
  const visitedPoints: Point[] = [];

  for (const point of points) {
    if (visitedSet.has(point.id)) {
      totalBaseScore += point.baseScore;
      visitedPoints.push(point);
    }
  }

  let totalBonusScore = 0;
  const completedBonuses: BonusCombination[] = [];

  for (const combo of bonusCombinations) {
    // A combination is complete only if *all* of its pointIds are visited.
    const isComplete = combo.pointIds.length > 0 &&
      combo.pointIds.every((id) => visitedSet.has(id));

    if (isComplete) {
      totalBonusScore += combo.bonusScore;
      completedBonuses.push(combo);
    }
  }

  const totalScore = totalBaseScore + totalBonusScore;

  return {
    totalBaseScore,
    totalBonusScore,
    totalScore,
    visitedPoints,
    completedBonuses,
  };
}

/**
 * Convenience helper to build a RaceState from raw pieces without mutating them.
 */
export function createRaceState(args: {
  points: Point[];
  bonusCombinations: BonusCombination[];
  visitedPointIds: PointId[] | Set<PointId>;
}): RaceState {
  const { points, bonusCombinations, visitedPointIds } = args;

  // Always normalise visitedPointIds into a simple array to keep the state
  // serialisable and avoid leaking a Set into React state.
  const visitedArray = Array.isArray(visitedPointIds)
    ? [...visitedPointIds]
    : Array.from(visitedPointIds);

  return {
    points: [...points],
    bonusCombinations: [...bonusCombinations],
    visitedPointIds: visitedArray,
  };
}

/** Bounds for area selection (south/north/west/east in degrees). */
export type SelectionBounds = {
  south: number;
  north: number;
  west: number;
  east: number;
};

/** Result of scoring only the points inside a selected area. */
export type AreaScoreResult = {
  pointsInArea: Point[];
  pointIdsInArea: Set<PointId>;
  baseScore: number;
  bonusScore: number;
  completedBonusesInArea: BonusCombination[];
  totalScore: number;
};

/**
 * Calculate the total score for points that fall inside the given bounds.
 * A bonus is counted only if every point of that combination lies inside the area.
 */
export function calculateAreaScore(
  points: Point[],
  bonusCombinations: BonusCombination[],
  bounds: SelectionBounds
): AreaScoreResult {
  const { south, north, west, east } = bounds;
  const pointIdsInArea = new Set<PointId>();
  let baseScore = 0;
  const pointsInArea: Point[] = [];

  for (const point of points) {
    const inBounds =
      point.lat >= south &&
      point.lat <= north &&
      point.lng >= west &&
      point.lng <= east;
    if (inBounds) {
      pointIdsInArea.add(point.id);
      baseScore += point.baseScore;
      pointsInArea.push(point);
    }
  }

  let bonusScore = 0;
  const completedBonusesInArea: BonusCombination[] = [];

  for (const combo of bonusCombinations) {
    const allInArea =
      combo.pointIds.length > 0 &&
      combo.pointIds.every((id) => pointIdsInArea.has(id));
    if (allInArea) {
      bonusScore += combo.bonusScore;
      completedBonusesInArea.push(combo);
    }
  }

  return {
    pointsInArea,
    pointIdsInArea,
    baseScore,
    bonusScore,
    completedBonusesInArea,
    totalScore: baseScore + bonusScore,
  };
}

