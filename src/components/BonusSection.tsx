import type { BonusCombination } from "../types";
import type { BonusFormState } from "../utils/formState";
import type { Point } from "../types";

type Props = {
  isHikeMode: boolean;
  points: Point[];
  bonusCombinations: BonusCombination[];
  bonusForm: BonusFormState;
  setBonusForm: React.Dispatch<React.SetStateAction<BonusFormState>>;
  editingBonusId: string | null;
  completedBonusIds: Set<string>;
  onResetBonusForm: () => void;
  onUpsertBonus: () => void;
  onEditBonus: (id: string) => void;
  onDeleteBonus: (id: string) => void;
};

export function BonusSection({
  isHikeMode,
  points,
  bonusCombinations,
  bonusForm,
  setBonusForm,
  editingBonusId,
  completedBonusIds,
  onResetBonusForm,
  onUpsertBonus,
  onEditBonus,
  onDeleteBonus,
}: Props) {
  return (
    <section className="px-4 py-3 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {isHikeMode ? "Bonuses" : "Bonus combinations (from sheet)"}
        </h2>
        {!isHikeMode && editingBonusId && (
          <button
            className="text-xs text-slate-400 hover:text-slate-200 underline"
            type="button"
            onClick={onResetBonusForm}
          >
            Cancel edit
          </button>
        )}
      </div>

      {!isHikeMode && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onUpsertBonus();
          }}
        >
          <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
            <label className="text-xs self-center" htmlFor="bonus-name">
              Name
            </label>
            <input
              id="bonus-name"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              placeholder="Optional label"
              value={bonusForm.name}
              onChange={(e) =>
                setBonusForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <label className="text-xs self-center" htmlFor="bonus-score">
              Bonus
            </label>
            <input
              id="bonus-score"
              type="number"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              placeholder="e.g. 200"
              value={bonusForm.bonusScore}
              onChange={(e) =>
                setBonusForm((prev) => ({ ...prev, bonusScore: e.target.value }))
              }
            />
            <label className="text-xs self-start pt-1" htmlFor="bonus-points">
              Points
            </label>
            <select
              id="bonus-points"
              multiple
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs min-h-[60px]"
              value={bonusForm.pointIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(
                  (opt) => opt.value
                );
                setBonusForm((prev) => ({ ...prev, pointIds: selected }));
              }}
            >
              {points.length === 0 ? (
                <option disabled value="">
                  Add points first
                </option>
              ) : (
                points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name} ({p.baseScore})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
              onClick={onResetBonusForm}
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold hover:bg-sky-500"
            >
              {editingBonusId ? "Save bonus" : "Add bonus"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 max-h-40 overflow-y-auto border border-slate-800 rounded">
        {bonusCombinations.length === 0 ? (
          <div className="p-2 text-xs text-slate-500">
            {isHikeMode
              ? "No bonus combos."
              : "No bonus combos yet. Add any from your race sheet (e.g. visit points 1, 4, 9 for +200)."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-800 text-[11px]">
            {bonusCombinations.map((combo) => {
              const isCompleted = completedBonusIds.has(combo.id);
              return (
                <li
                  key={combo.id}
                  className={`px-2 py-2 ${
                    isCompleted ? "bg-emerald-900/30" : "bg-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">
                        {combo.name || combo.id}
                      </div>
                      <div className="text-xs text-slate-400">
                        Points: {combo.pointIds.join(", ")}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-emerald-300">
                        +{combo.bonusScore}
                      </div>
                      <div
                        className={`mt-1 ${
                          isCompleted
                            ? "text-emerald-300"
                            : "text-slate-500"
                        }`}
                      >
                        {isCompleted ? "Completed" : "Incomplete"}
                      </div>
                      {!isHikeMode && (
                        <div className="mt-1 space-x-1">
                          <button
                            className="text-xs text-slate-300 hover:underline"
                            type="button"
                            onClick={() => onEditBonus(combo.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs text-red-400 hover:underline"
                            type="button"
                            onClick={() => onDeleteBonus(combo.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
