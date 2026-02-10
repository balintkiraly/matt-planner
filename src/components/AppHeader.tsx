type Props = {
  isHikeMode: boolean;
  onSetHikeMode: (value: boolean) => void;
};

export function AppHeader({ isHikeMode, onSetHikeMode }: Props) {
  return (
    <header className="px-4 py-3 border-b border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">MATT planner</h1>
        <div className="flex rounded border border-slate-700 p-0.5">
          <button
            type="button"
            onClick={() => onSetHikeMode(false)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              !isHikeMode ? "bg-slate-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Setup
          </button>
          <button
            type="button"
            onClick={() => onSetHikeMode(true)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              isHikeMode ? "bg-slate-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Hike
          </button>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        {isHikeMode
          ? "Tracking only — mark visits, no edit/delete"
          : "Add points and combos from your race sheet"}
      </p>
    </header>
  );
}
