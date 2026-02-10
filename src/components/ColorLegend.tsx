import { getScoreColor } from "../utils/colors";
import { COMBO_POINT_COLOR } from "../constants";

type Props = {
  minScore: number;
  maxScore: number;
};

export function ColorLegend({ minScore, maxScore }: Props) {
  return (
    <section className="px-4 py-2 border-b border-slate-800 space-y-1.5">
      <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
        <span>Score:</span>
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: getScoreColor(minScore, minScore, maxScore) }}
          title="Low"
        />
        <span>low</span>
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0"
          style={{
            backgroundColor: getScoreColor((minScore + maxScore) / 2, minScore, maxScore),
          }}
          title="Mid"
        />
        <span>mid</span>
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: getScoreColor(maxScore, minScore, maxScore) }}
          title="High"
        />
        <span>high</span>
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: COMBO_POINT_COLOR }}
          title="In a combo"
        />
        <span>in a combo</span>
      </div>
    </section>
  );
}
