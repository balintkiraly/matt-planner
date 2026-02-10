import { useCallback, useEffect, useMemo, useState } from "react";
import type { BonusCombination, Point, PointId } from "../types";
import {
  calculateScore,
  calculateAreaScore,
  createRaceState,
  type SelectionBounds,
  type AreaScoreResult,
} from "../scoring";
import { loadRaceState, saveRaceState } from "../storage";
import {
  createEmptyPointForm,
  createEmptyBonusForm,
  type PointFormState,
  type BonusFormState,
} from "../utils/formState";
import type { ScoreBreakdown } from "../types";

export type RaceStateApi = {
  // Data
  points: Point[];
  bonusCombinations: BonusCombination[];
  visitedPointIds: Set<PointId>;
  score: ScoreBreakdown;
  areaScore: AreaScoreResult | null;
  minScore: number;
  maxScore: number;
  combosByPointId: Map<PointId, BonusCombination[]>;
  // Form state
  pointForm: PointFormState;
  setPointForm: React.Dispatch<React.SetStateAction<PointFormState>>;
  editingPointId: PointId | null;
  bonusForm: BonusFormState;
  setBonusForm: React.Dispatch<React.SetStateAction<BonusFormState>>;
  editingBonusId: string | null;
  // Area selection
  selectionBounds: SelectionBounds | null;
  setSelectionBounds: React.Dispatch<React.SetStateAction<SelectionBounds | null>>;
  isSelectingArea: boolean;
  setIsSelectingArea: React.Dispatch<React.SetStateAction<boolean>>;
  // Mode
  isHikeMode: boolean;
  setIsHikeMode: React.Dispatch<React.SetStateAction<boolean>>;
  // Actions
  resetPointForm: () => void;
  resetBonusForm: () => void;
  upsertPoint: () => void;
  editPoint: (id: PointId) => void;
  deletePoint: (id: PointId) => void;
  toggleVisited: (id: PointId) => void;
  upsertBonus: () => void;
  editBonus: (id: string) => void;
  deleteBonus: (id: string) => void;
  handleMapClick: (lat: number, lng: number) => void;
  handleAreaSelected: (bounds: SelectionBounds) => void;
  clearSelection: () => void;
};

export function useRaceState(): RaceStateApi {
  const [points, setPoints] = useState<Point[]>(() => loadRaceState().points);
  const [bonusCombinations, setBonusCombinations] = useState<BonusCombination[]>(
    () => loadRaceState().bonusCombinations
  );
  const [visitedPointIds, setVisitedPointIds] = useState<Set<PointId>>(() => {
    const { visitedPointIds: ids } = loadRaceState();
    return new Set(ids);
  });

  useEffect(() => {
    saveRaceState({
      points,
      bonusCombinations,
      visitedPointIds: Array.from(visitedPointIds),
    });
  }, [points, bonusCombinations, visitedPointIds]);

  const [pointForm, setPointForm] = useState<PointFormState>(() =>
    createEmptyPointForm()
  );
  const [editingPointId, setEditingPointId] = useState<PointId | null>(null);
  const [bonusForm, setBonusForm] = useState<BonusFormState>(() =>
    createEmptyBonusForm()
  );
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [isHikeMode, setIsHikeMode] = useState(false);

  const raceState = useMemo(
    () =>
      createRaceState({
        points,
        bonusCombinations,
        visitedPointIds,
      }),
    [points, bonusCombinations, visitedPointIds]
  );
  const score = useMemo(() => calculateScore(raceState), [raceState]);
  const areaScore = useMemo(() => {
    if (!selectionBounds || points.length === 0) return null;
    return calculateAreaScore(points, bonusCombinations, selectionBounds);
  }, [points, bonusCombinations, selectionBounds]);
  const { minScore, maxScore } = useMemo(() => {
    if (points.length === 0) return { minScore: 0, maxScore: 0 };
    const scores = points.map((p) => p.baseScore);
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
    };
  }, [points]);
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

  const resetPointForm = useCallback(() => {
    setPointForm(createEmptyPointForm());
    setEditingPointId(null);
  }, []);
  const resetBonusForm = useCallback(() => {
    setBonusForm(createEmptyBonusForm());
    setEditingBonusId(null);
  }, []);

  const upsertPoint = useCallback(() => {
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
      if (existingIndex !== -1 && editingPointId === null) {
        alert(`A point with ID "${newPoint.id}" already exists. Use a unique ID or edit the existing point.`);
        return prev;
      }
      if (existingIndex === -1) return [...prev, newPoint];
      const next = [...prev];
      next[existingIndex] = newPoint;
      return next;
    });
    resetPointForm();
  }, [pointForm, editingPointId, resetPointForm]);

  const editPoint = useCallback((pointId: PointId) => {
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
  }, [points]);

  const deletePoint = useCallback((pointId: PointId) => {
    setPoints((prev) => prev.filter((p) => p.id !== pointId));
    setVisitedPointIds((prev) => {
      const next = new Set(prev);
      next.delete(pointId);
      return next;
    });
    setBonusCombinations((prev) =>
      prev.map((combo) => ({
        ...combo,
        pointIds: combo.pointIds.filter((id) => id !== pointId),
      }))
    );
    setEditingPointId((id) => {
      if (id === pointId) {
        setPointForm(createEmptyPointForm());
        return null;
      }
      return id;
    });
  }, []);

  const toggleVisited = useCallback((pointId: PointId) => {
    setVisitedPointIds((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) next.delete(pointId);
      else next.add(pointId);
      return next;
    });
  }, []);

  const upsertBonus = useCallback(() => {
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
    const id = bonusForm.id.trim() || `bonus-${Date.now()}`;
    const newCombo: BonusCombination = {
      id,
      name: bonusForm.name.trim() || undefined,
      pointIds: [...bonusForm.pointIds],
      bonusScore,
    };
    setBonusCombinations((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === newCombo.id);
      if (existingIndex === -1) return [...prev, newCombo];
      const next = [...prev];
      next[existingIndex] = newCombo;
      return next;
    });
    resetBonusForm();
  }, [bonusForm, resetBonusForm]);

  const editBonus = useCallback((bonusId: string) => {
    const combo = bonusCombinations.find((c) => c.id === bonusId);
    if (!combo) return;
    setEditingBonusId(bonusId);
    setBonusForm({
      id: combo.id,
      name: combo.name ?? "",
      bonusScore: String(combo.bonusScore),
      pointIds: [...combo.pointIds],
    });
  }, [bonusCombinations]);

  const deleteBonus = useCallback((bonusId: string) => {
    setBonusCombinations((prev) => prev.filter((c) => c.id !== bonusId));
    setEditingBonusId((id) => (id === bonusId ? null : id));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPointForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  }, []);

  const handleAreaSelected = useCallback((bounds: SelectionBounds) => {
    setSelectionBounds(bounds);
    setIsSelectingArea(false);
  }, []);

  const clearSelection = useCallback(() => setSelectionBounds(null), []);

  return {
    points,
    bonusCombinations,
    visitedPointIds,
    score,
    areaScore,
    minScore,
    maxScore,
    combosByPointId,
    pointForm,
    setPointForm,
    editingPointId,
    bonusForm,
    setBonusForm,
    editingBonusId,
    selectionBounds,
    setSelectionBounds,
    isSelectingArea,
    setIsSelectingArea,
    isHikeMode,
    setIsHikeMode,
    resetPointForm,
    resetBonusForm,
    upsertPoint,
    editPoint,
    deletePoint,
    toggleVisited,
    upsertBonus,
    editBonus,
    deleteBonus,
    handleMapClick,
    handleAreaSelected,
    clearSelection,
  };
}
