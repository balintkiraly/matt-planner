// Core domain types for the race planner.

// Unique identifier for a point on the course.
export type PointId = string;

// A single checkpoint / control point on the map.
export type Point = {
  id: PointId; // Human-visible ID like "1", "CP-4", etc.
  name: string;
  lat: number;
  lng: number;
  baseScore: number; // Score awarded when this point is visited.
  task: string; // Task/challenge description required to validate the visit.
};

// A bonus combination definition: when all pointIds are visited, award bonusScore once.
export type BonusCombination = {
  id: string; // Internal ID for editing/deleting the combo.
  name?: string; // Optional human-friendly label (e.g. "River loop").
  pointIds: PointId[]; // All points that must be visited to earn the bonus.
  bonusScore: number; // Extra score awarded once when the combo is complete.
};

// Race state tracks configuration and current progress of a team on the course.
export type RaceState = {
  points: Point[];
  bonusCombinations: BonusCombination[];
  visitedPointIds: PointId[];
};

// Detailed score breakdown returned by the scoring logic.
export type ScoreBreakdown = {
  totalBaseScore: number;
  totalBonusScore: number;
  totalScore: number;
  visitedPoints: Point[];
  completedBonuses: BonusCombination[];
};
