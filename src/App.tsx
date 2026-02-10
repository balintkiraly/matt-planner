import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  useMap,
  Rectangle,
  FeatureGroup,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

import type {
  BonusCombination,
  Point,
  PointId,
  RaceState,
} from "./types";
import {
  calculateScore,
  calculateAreaScore,
  createRaceState,
  type SelectionBounds,
} from "./scoring";
import { loadRaceState, saveRaceState } from "./storage";
import { Marker } from "./components/Marker";

/** Color for points that are part of at least one bonus combo. */
const COMBO_POINT_COLOR = "#a855f7";

/** Green (low score) → yellow → red (high score). */
function getScoreColor(
  score: number,
  minScore: number,
  maxScore: number
): string {
  if (maxScore <= minScore) return "#94a3b8"; // single band: neutral
  const t = (score - minScore) / (maxScore - minScore);
  if (t <= 0.5) {
    const s = t * 2; // 0..1
    return interpolateHex("#22c55e", "#eab308", s);
  }
  return interpolateHex("#eab308", "#dc2626", (t - 0.5) * 2);
}
function interpolateHex(a: string, b: string, t: number): string {
  const parse = (hex: string) =>
    hex.slice(1).match(/.{2}/g)!.map((x) => parseInt(x, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Ensures map size is valid after layout (e.g. in a flex/grid). Use once inside MapContainer. */
function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/** Listens for map clicks and passes lat/lng to the parent. Must be used inside MapContainer. */
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Default map centre – replace with the actual race area as needed.
const DEFAULT_CENTER: [number, number] = [48.219, 20.405];

type PointFormState = {
  id: string;
  name: string;
  lat: string;
  lng: string;
  baseScore: string;
  task: string;
};

type BonusFormState = {
  id: string;
  name: string;
  bonusScore: string;
  pointIds: string[]; // selected point IDs as strings from the multi-select
};

function createEmptyPointForm(): PointFormState {
  return {
    id: "",
    name: "",
    lat: "",
    lng: "",
    baseScore: "",
    task: "",
  };
}

function createEmptyBonusForm(): BonusFormState {
  return {
    id: "",
    name: "",
    bonusScore: "",
    pointIds: [],
  };
}

function App() {
  // Core race configuration and progress (persisted in localStorage)
  const [points, setPoints] = useState<Point[]>(() => loadRaceState().points);
  const [bonusCombinations, setBonusCombinations] = useState<BonusCombination[]>(
    () => loadRaceState().bonusCombinations
  );
  const [visitedPointIds, setVisitedPointIds] = useState<Set<PointId>>(() => {
    const { visitedPointIds: ids } = loadRaceState();
    return new Set(ids);
  });

  // Persist to localStorage whenever race data changes
  useEffect(() => {
    saveRaceState({
      points,
      bonusCombinations,
      visitedPointIds: Array.from(visitedPointIds),
    });
  }, [points, bonusCombinations, visitedPointIds]);

  // Local UI state for forms -------------------------------------------
  const [pointForm, setPointForm] = useState<PointFormState>(
    () => createEmptyPointForm()
  );
  const [editingPointId, setEditingPointId] = useState<PointId | null>(null);

  const [bonusForm, setBonusForm] = useState<BonusFormState>(
    () => createEmptyBonusForm()
  );
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null);

  // Area selection: bounds of the drawn rectangle (null = no selection)
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(
    null
  );

  // Derived score via pure business logic ------------------------------
  const raceState: RaceState = useMemo(
    () =>
      createRaceState({
        points,
        bonusCombinations,
        visitedPointIds,
      }),
    [points, bonusCombinations, visitedPointIds]
  );

  const score = useMemo(() => calculateScore(raceState), [raceState]);

  // Score for points inside the selected area only
  const areaScore = useMemo(() => {
    if (!selectionBounds || points.length === 0)
      return null;
    return calculateAreaScore(points, bonusCombinations, selectionBounds);
  }, [points, bonusCombinations, selectionBounds]);

  // Min/max baseScore for color scale (green = low, red = high)
  const { minScore, maxScore } = useMemo(() => {
    if (points.length === 0)
      return { minScore: 0, maxScore: 0 };
    const scores = points.map((p) => p.baseScore);
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
    };
  }, [points]);

  // Which bonus combos each point belongs to (for "in combo" indicators)
  const combosByPointId = useMemo(() => {
    const map = new Map<PointId, BonusCombination[]>();
    for (const combo of bonusCombinations) {
      for (const pointId of combo.pointIds) {
        const list = map.get(pointId) ?? [];
        list.push(combo);
        map.set(pointId, list);
      }
    }
    return map;
  }, [bonusCombinations]);

  // Helpers -------------------------------------------------------------
  const resetPointForm = () => {
    setPointForm(createEmptyPointForm());
    setEditingPointId(null);
  };

  const resetBonusForm = () => {
    setBonusForm(createEmptyBonusForm());
    setEditingBonusId(null);
  };

  const upsertPoint = () => {
    // Basic validation – keep it simple but explicit.
    if (!pointForm.id.trim()) {
      alert("Point ID is required.");
      return;
    }
    if (!pointForm.name.trim()) {
      alert("Point name is required.");
      return;
    }

    const lat = Number(pointForm.lat);
    const lng = Number(pointForm.lng);
    const baseScore = Number(pointForm.baseScore);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert("Latitude and longitude must be valid numbers.");
      return;
    }
    if (!Number.isFinite(baseScore) || baseScore <= 0) {
      alert("Base score must be a positive number.");
      return;
    }

    const newPoint: Point = {
      id: pointForm.id.trim(),
      name: pointForm.name.trim(),
      lat,
      lng,
      baseScore,
      task: pointForm.task.trim(),
    };

    setPoints((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === newPoint.id);

      // Prevent accidental creation of a conflicting point ID when *creating*.
      if (existingIndex !== -1 && editingPointId === null) {
        alert(
          `A point with ID "${newPoint.id}" already exists. Use a unique ID or edit the existing point.`
        );
        return prev;
      }

      if (existingIndex === -1) {
        return [...prev, newPoint];
      }

      const next = [...prev];
      next[existingIndex] = newPoint;
      return next;
    });

    resetPointForm();
  };

  const editPoint = (pointId: PointId) => {
    const point = points.find((p) => p.id === pointId);
    if (!point) return;

    setEditingPointId(pointId);
    setPointForm({
      id: point.id,
      name: point.name,
      lat: String(point.lat),
      lng: String(point.lng),
      baseScore: String(point.baseScore),
      task: point.task,
    });
  };

  const deletePoint = (pointId: PointId) => {
    setPoints((prev) => prev.filter((p) => p.id !== pointId));

    // Ensure deleted points are removed from visited state.
    setVisitedPointIds((prev) => {
      const next = new Set(prev);
      next.delete(pointId);
      return next;
    });

    // Also clean up any bonus combinations referencing the removed point.
    setBonusCombinations((prev) =>
      prev.map((combo) => ({
        ...combo,
        pointIds: combo.pointIds.filter((id) => id !== pointId),
      }))
    );

    if (editingPointId === pointId) {
      resetPointForm();
    }
  };

  const toggleVisited = (pointId: PointId) => {
    setVisitedPointIds((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      return next;
    });
  };

  const upsertBonus = () => {
    if (!bonusForm.bonusScore.trim()) {
      alert("Bonus score is required.");
      return;
    }
    if (bonusForm.pointIds.length === 0) {
      alert("Select at least one point for the bonus combination.");
      return;
    }

    const bonusScore = Number(bonusForm.bonusScore);
    if (!Number.isFinite(bonusScore) || bonusScore <= 0) {
      alert("Bonus score must be a positive number.");
      return;
    }

    const id =
      bonusForm.id.trim() ||
      // Simple internal ID for combos when the user does not provide one.
      `bonus-${Date.now()}`;

    const newCombo: BonusCombination = {
      id,
      name: bonusForm.name.trim() || undefined,
      pointIds: [...bonusForm.pointIds],
      bonusScore,
    };

    setBonusCombinations((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === newCombo.id);
      if (existingIndex === -1) {
        return [...prev, newCombo];
      }
      const next = [...prev];
      next[existingIndex] = newCombo;
      return next;
    });

    resetBonusForm();
  };

  const editBonus = (bonusId: string) => {
    const combo = bonusCombinations.find((c) => c.id === bonusId);
    if (!combo) return;

    setEditingBonusId(bonusId);
    setBonusForm({
      id: combo.id,
      name: combo.name ?? "",
      bonusScore: String(combo.bonusScore),
      pointIds: [...combo.pointIds],
    });
  };

  const deleteBonus = (bonusId: string) => {
    setBonusCombinations((prev) => prev.filter((c) => c.id !== bonusId));
    if (editingBonusId === bonusId) {
      resetBonusForm();
    }
  };

  // When the participant clicks on the map, prefill the point form's lat/lng
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPointForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  }, []);

  // After drawing a rectangle, store bounds and remove the draw layer so we show our own Rectangle
  const handleDrawCreated = useCallback(
    (e: {
      layer: {
        getBounds: () => {
          getSouth: () => number;
          getNorth: () => number;
          getWest: () => number;
          getEast: () => number;
        };
        remove: () => void;
      };
    }) => {
      const b = e.layer.getBounds();
      setSelectionBounds({
        south: b.getSouth(),
        north: b.getNorth(),
        west: b.getWest(),
        east: b.getEast(),
      });
      e.layer.remove();
    },
    []
  );

  const clearSelection = useCallback(() => setSelectionBounds(null), []);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-50">
      <div className="grid h-full grid-cols-1 md:grid-cols-[420px_minmax(0,1fr)]">
        {/* Left pane: configuration + scoring */}
        <div className="flex flex-col border-b border-slate-800 md:border-b-0 md:border-r bg-slate-900/80 backdrop-blur">
          <header className="px-4 py-3 border-b border-slate-800">
            <h1 className="text-lg font-semibold tracking-tight">
              MATT planner
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Enter checkpoints from your race sheet, add bonus combos, then
              mark visits and track your score.
            </p>
          </header>

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
                    {score.visitedPoints.length}/{points.length}
                  </span>
                </div>
                <div>
                  Bonuses:{" "}
                  <span className="font-semibold text-slate-200">
                    {score.completedBonuses.length}/
                    {bonusCombinations.length}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Area selection: draw a rectangle on the map to see score in that zone */}
          {selectionBounds && areaScore && (
            <section className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Area selection</h2>
                <button
                  type="button"
                  className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-700"
                  onClick={clearSelection}
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
                  Base: <span className="font-semibold">{areaScore.baseScore}</span>{" "}
                  · Bonus: <span className="font-semibold text-emerald-300">+{areaScore.bonusScore}</span>
                </div>
                <div className="text-base font-bold text-emerald-400">
                  Total in area: {areaScore.totalScore}
                </div>
              </div>
            </section>
          )}

          {/* Color legend for point markers */}
          {points.length > 0 && (
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
                  style={{ backgroundColor: getScoreColor((minScore + maxScore) / 2, minScore, maxScore) }}
                  title="Mid"
                />
                <span>mid</span>
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getScoreColor(maxScore, minScore, maxScore) }}
                  title="High"
                />
                <span>high</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COMBO_POINT_COLOR }}
                  title="In a combo"
                />
                <span>purple = in a combo</span>
              </div>
            </section>
          )}

          {/* Points: enter from your race sheet */}
          <section className="px-4 py-3 border-b border-slate-800 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Points (from race sheet)</h2>
              {editingPointId && (
                <button
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                  type="button"
                  onClick={resetPointForm}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                upsertPoint();
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
                  onChange={(e) =>
                    setPointForm((prev) => ({
                      ...prev,
                      id: e.target.value,
                    }))
                  }
                />

                <label className="text-xs self-center" htmlFor="point-name">
                  Name
                </label>
                <input
                  id="point-name"
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                  placeholder="e.g. Ridge overlook"
                  value={pointForm.name}
                  onChange={(e) =>
                    setPointForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
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
                    onChange={(e) =>
                      setPointForm((prev) => ({
                        ...prev,
                        lat: e.target.value,
                      }))
                    }
                  />
                  <input
                    id="point-lng"
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                    placeholder="Lng"
                    value={pointForm.lng}
                    onChange={(e) =>
                      setPointForm((prev) => ({
                        ...prev,
                        lng: e.target.value,
                      }))
                    }
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
                    setPointForm((prev) => ({
                      ...prev,
                      baseScore: e.target.value,
                    }))
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
                  onChange={(e) =>
                    setPointForm((prev) => ({
                      ...prev,
                      task: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                  onClick={resetPointForm}
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

            <div className="mt-3 max-h-40 overflow-y-auto border border-slate-800 rounded">
              {points.length === 0 ? (
                <div className="p-2 text-xs text-slate-500">
                  No points yet. Add each checkpoint from your race sheet (ID,
                  score, task). Click the map to fill in coordinates if you have
                  a paper map.
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
                      <th className="px-2 py-1 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => {
                      const isVisited = visitedPointIds.has(point.id);
                      const combos = combosByPointId.get(point.id) ?? [];
                      return (
                        <tr
                          key={point.id}
                          className={
                            isVisited ? "bg-slate-900/70" : "bg-slate-950"
                          }
                        >
                          <td className="px-2 py-1">
                            <input
                              type="checkbox"
                              checked={isVisited}
                              onChange={() => toggleVisited(point.id)}
                            />
                          </td>
                          <td className="px-2 py-1">{point.id}</td>
                          <td className="px-2 py-1 truncate max-w-[120px]">
                            {point.name}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {point.baseScore}
                          </td>
                          <td className="px-2 py-1">
                            {combos.length > 0 ? (
                              <span
                                className="inline-flex items-center rounded bg-sky-900/70 px-1.5 py-0.5 text-[10px] text-sky-200"
                                title={combos
                                  .map(
                                    (c) =>
                                      `${c.name || c.id} (+${c.bonusScore})`
                                  )
                                  .join(", ")}
                              >
                                {combos.length} combo
                                {combos.length !== 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-right space-x-1">
                            <button
                              className="text-xs text-slate-300 hover:underline"
                              type="button"
                              onClick={() => editPoint(point.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs text-red-400 hover:underline"
                              type="button"
                              onClick={() => deletePoint(point.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Bonus combinations */}
          <section className="px-4 py-3 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Bonus combinations (from sheet)</h2>
              {editingBonusId && (
                <button
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                  type="button"
                  onClick={resetBonusForm}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                upsertBonus();
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
                    setBonusForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
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
                    setBonusForm((prev) => ({
                      ...prev,
                      bonusScore: e.target.value,
                    }))
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
                    const selected = Array.from(
                      e.target.selectedOptions
                    ).map((opt) => opt.value);
                    setBonusForm((prev) => ({
                      ...prev,
                      pointIds: selected,
                    }));
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
                  onClick={resetBonusForm}
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

            <div className="mt-3 max-h-40 overflow-y-auto border border-slate-800 rounded">
              {bonusCombinations.length === 0 ? (
                <div className="p-2 text-xs text-slate-500">
                  No bonus combos yet. Add any from your race sheet (e.g. visit
                  points 1, 4, 9 for +200).
                </div>
              ) : (
                <ul className="divide-y divide-slate-800 text-[11px]">
                  {bonusCombinations.map((combo) => {
                    const isCompleted = score.completedBonuses.some(
                      (c) => c.id === combo.id
                    );
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
                            <div className="mt-1 space-x-1">
                              <button
                                className="text-xs text-slate-300 hover:underline"
                                type="button"
                                onClick={() => editBonus(combo.id)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs text-red-400 hover:underline"
                                type="button"
                                onClick={() => deleteBonus(combo.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Right pane: map view */}
        <div className="relative">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <MapInvalidateSize />
            <TileLayer url="https://{s}.map.turistautak.hu/tiles/turistautak/{z}/{x}/{y}.png" />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Draw rectangle to select area and see score for that zone */}
            <FeatureGroup>
              <EditControl
                position="topright"
                draw={{
                  rectangle: true,
                  polyline: false,
                  polygon: false,
                  circle: false,
                  marker: false,
                }}
                onCreated={handleDrawCreated}
              />
            </FeatureGroup>

            {/* Show selection rectangle (we remove the draw layer after reading bounds) */}
            {selectionBounds && (
              <Rectangle
                bounds={[
                  [selectionBounds.south, selectionBounds.west],
                  [selectionBounds.north, selectionBounds.east],
                ]}
                pathOptions={{
                  color: "#38bdf8",
                  fillColor: "#38bdf8",
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              />
            )}

            {points.map((point) => {
              const inCombo = (combosByPointId.get(point.id) ?? []).length > 0;
              const color = inCombo
                ? COMBO_POINT_COLOR
                : getScoreColor(point.baseScore, minScore, maxScore);
              return (
                <Marker
                  key={point.id}
                  point={point}
                  isVisited={visitedPointIds.has(point.id)}
                  color={color}
                  combosContainingPoint={combosByPointId.get(point.id) ?? []}
                  onToggleVisited={toggleVisited}
                />
              );
            })}
          </MapContainer>

          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-end">
            <div className="pointer-events-auto rounded bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200 shadow-lg border border-slate-800">
              <div className="font-semibold mb-1">How to use</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Add points from your paper: ID, name, score, task. Click the
                  map to fill Lat/Lng if you have a map.
                </li>
                <li>Add bonus combos from the sheet, then mark points visited.</li>
                <li>Score and completed bonuses update automatically.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
