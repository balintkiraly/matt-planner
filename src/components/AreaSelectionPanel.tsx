import type { AreaScoreResult } from "../scoring";

type Props = {
  areaScore: AreaScoreResult;
  onClear: () => void;
};

export function AreaSelectionPanel({ areaScore, onClear }: Props) {
  return (
    <section className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Area selection</h2>
        <button
          type="button"
          className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-700"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-300 space-y-1">
        <div>
          Points in area:{" "}
          <span className="font-semibold">{areaScore.pointsInArea.length}</span>
        </div>
        <div>
          Base: <span className="font-semibold">{areaScore.baseScore}</span> · Bonus:{" "}
          <span className="font-semibold text-emerald-300">+{areaScore.bonusScore}</span>
        </div>
        <div className="text-base font-bold text-emerald-400">
          Total in area: {areaScore.totalScore}
        </div>
      </div>
    </section>
  );
}
