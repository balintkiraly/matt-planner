import type { Point, PointId } from "../types";
import type { BonusCombination } from "../types";
import type { PointFormState } from "../utils/formState";

type Props = {
  isHikeMode: boolean;
  points: Point[];
  pointForm: PointFormState;
  setPointForm: React.Dispatch<React.SetStateAction<PointFormState>>;
  editingPointId: PointId | null;
  visitedPointIds: Set<PointId>;
  combosByPointId: Map<PointId, BonusCombination[]>;
  onResetPointForm: () => void;
  onUpsertPoint: () => void;
  onEditPoint: (id: PointId) => void;
  onDeletePoint: (id: PointId) => void;
  onToggleVisited: (id: PointId) => void;
};

export function PointsSection({
  isHikeMode,
  points,
  pointForm,
  setPointForm,
  editingPointId,
  visitedPointIds,
  combosByPointId,
  onResetPointForm,
  onUpsertPoint,
  onEditPoint,
  onDeletePoint,
  onToggleVisited,
}: Props) {
  return (
    <section className="px-4 py-3 border-b border-slate-800 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {isHikeMode ? "Points" : "Points (from race sheet)"}
        </h2>
        {!isHikeMode && editingPointId && (
          <button
            className="text-xs text-slate-400 hover:text-slate-200 underline"
            type="button"
            onClick={onResetPointForm}
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
            onUpsertPoint();
          }}
        >
          <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
            <label className="text-xs self-center" htmlFor="point-id">
              ID
            </label>
            <input
              id="point-id"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              placeholder="e.g. 1, 2, CP-3"
              value={pointForm.id}
              onChange={(e) => setPointForm((prev) => ({ ...prev, id: e.target.value }))}
            />
            <label className="text-xs self-center" htmlFor="point-name">
              Name
            </label>
            <input
              id="point-name"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              placeholder="e.g. Ridge overlook"
              value={pointForm.name}
              onChange={(e) => setPointForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <label className="text-xs self-center" htmlFor="point-lat">
              Lat / Lng
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                id="point-lat"
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                placeholder="Lat"
                value={pointForm.lat}
                onChange={(e) => setPointForm((prev) => ({ ...prev, lat: e.target.value }))}
              />
              <input
                id="point-lng"
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                placeholder="Lng"
                value={pointForm.lng}
                onChange={(e) => setPointForm((prev) => ({ ...prev, lng: e.target.value }))}
              />
            </div>
            <label className="text-xs self-center" htmlFor="point-score">
              Base score
            </label>
            <input
              id="point-score"
              type="number"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              placeholder="e.g. 10"
              value={pointForm.baseScore}
              onChange={(e) =>
                setPointForm((prev) => ({ ...prev, baseScore: e.target.value }))
              }
            />
            <label className="text-xs self-start pt-1" htmlFor="point-task">
              Task / description
            </label>
            <textarea
              id="point-task"
              rows={2}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs resize-none"
              placeholder="Copy from your paper: task or challenge to validate the visit."
              value={pointForm.task}
              onChange={(e) => setPointForm((prev) => ({ ...prev, task: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
              onClick={onResetPointForm}
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold hover:bg-emerald-500"
            >
              {editingPointId ? "Save point" : "Add point"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 max-h-40 overflow-y-auto border border-slate-800 rounded">
        {points.length === 0 ? (
          <div className="p-2 text-xs text-slate-500">
            {isHikeMode
              ? "No points loaded. Switch to Setup to add points."
              : "No points yet. Add each checkpoint from your race sheet (ID, score, task). Click the map to fill in coordinates if you have a paper map."}
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-2 py-1 text-left">Visit</th>
                <th className="px-2 py-1 text-left">ID</th>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-right">Score</th>
                <th className="px-2 py-1 text-left">Combo</th>
                {!isHikeMode && (
                  <th className="px-2 py-1 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => {
                const isVisited = visitedPointIds.has(point.id);
                const combos = combosByPointId.get(point.id) ?? [];
                return (
                  <tr
                    key={point.id}
                    className={isVisited ? "bg-slate-900/70" : "bg-slate-950"}
                  >
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={isVisited}
                        onChange={() => onToggleVisited(point.id)}
                      />
                    </td>
                    <td className="px-2 py-1">{point.id}</td>
                    <td className="px-2 py-1 truncate max-w-[120px]">
                      {point.name}
                    </td>
                    <td className="px-2 py-1 text-right">{point.baseScore}</td>
                    <td className="px-2 py-1">
                      {combos.length > 0 ? (
                        <span
                          className="inline-flex items-center rounded bg-sky-900/70 px-1.5 py-0.5 text-[10px] text-sky-200"
                          title={combos
                            .map((c) => `${c.name || c.id} (+${c.bonusScore})`)
                            .join(", ")}
                        >
                          {combos.length} combo
                          {combos.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    {!isHikeMode && (
                      <td className="px-2 py-1 text-right space-x-1">
                        <button
                          className="text-xs text-slate-300 hover:underline"
                          type="button"
                          onClick={() => onEditPoint(point.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-red-400 hover:underline"
                          type="button"
                          onClick={() => onDeletePoint(point.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
