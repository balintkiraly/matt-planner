import type { ScoreBreakdown } from "../types";

type Props = {
  score: ScoreBreakdown;
  pointsCount: number;
  bonusCombosCount: number;
};

export function ScoreSummary({ score, pointsCount, bonusCombosCount }: Props) {
  return (
    <section className="px-4 py-3 border-b border-slate-800">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Total score
          </div>
          <div className="text-3xl font-bold">
            {score.totalScore.toLocaleString()}
          </div>
        </div>
        <div className="text-xs text-right text-slate-400 space-y-1">
          <div>
            Base:{" "}
            <span className="font-semibold text-slate-200">
              {score.totalBaseScore.toLocaleString()}
            </span>
          </div>
          <div>
            Bonus:{" "}
            <span className="font-semibold text-emerald-300">
              +{score.totalBonusScore.toLocaleString()}
            </span>
          </div>
          <div>
            Visited:{" "}
            <span className="font-semibold text-slate-200">
              {score.visitedPoints.length}/{pointsCount}
            </span>
          </div>
          <div>
            Bonuses:{" "}
            <span className="font-semibold text-slate-200">
              {score.completedBonuses.length}/{bonusCombosCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
