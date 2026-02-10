type Props = {
  onDismiss: () => void;
};

export function HowToBubble({ onDismiss }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-end z-[1000]">
      <div className="pointer-events-auto rounded bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200 shadow-lg border border-slate-800 max-w-md">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="font-semibold">How to use</div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Add points from your paper: ID, name, score, task. Click the map to
            fill Lat/Lng if you have a map.
          </li>
          <li>Add bonus combos from the sheet, then mark points visited.</li>
          <li>
            <strong>Setup</strong>: add/edit points and combos; &quot;Select
            area&quot; to see score in a zone.
          </li>
          <li>
            <strong>Hike</strong>: only mark visits and see score; no edit/delete.
          </li>
          <li>Score and completed bonuses update automatically.</li>
        </ul>
      </div>
    </div>
  );
}
