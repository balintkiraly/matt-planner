import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DEFAULT_CENTER } from "../constants";
import { getScoreColor } from "../utils/colors";
import { COMBO_POINT_COLOR } from "../constants";
import type { Point, PointId } from "../types";
import type { BonusCombination } from "../types";
import type { SelectionBounds } from "../scoring";
import { Marker } from "./Marker";
import {
  FitMapToPoints,
  MapInvalidateSize,
  MapClickHandler,
  MapAreaSelect,
} from "./map";
import { HowToBubble } from "./HowToBubble";

type Props = {
  isHikeMode: boolean;
  points: Point[];
  visitedPointIds: Set<PointId>;
  combosByPointId: Map<PointId, BonusCombination[]>;
  minScore: number;
  maxScore: number;
  selectionBounds: SelectionBounds | null;
  isSelectingArea: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onAreaSelected: (bounds: SelectionBounds) => void;
  onSelectingAreaChange: (value: boolean) => void;
  onToggleVisited: (id: PointId) => void;
  showHowTo: boolean;
  onDismissHowTo: () => void;
};

export function MapPane({
  isHikeMode,
  points,
  visitedPointIds,
  combosByPointId,
  minScore,
  maxScore,
  selectionBounds,
  isSelectingArea,
  onMapClick,
  onAreaSelected,
  onSelectingAreaChange,
  onToggleVisited,
  showHowTo,
  onDismissHowTo,
}: Props) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onSelectingAreaChange(!isSelectingArea)}
          className={`rounded border px-3 py-1.5 text-xs font-medium shadow ${
            isSelectingArea
              ? "border-sky-500 bg-sky-600 text-white"
              : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {isSelectingArea ? "Cancel (Esc)" : "Select area"}
        </button>
        {isSelectingArea && (
          <span className="rounded bg-slate-900/95 px-2 py-1 text-[10px] text-slate-300">
            Drag on map to draw rectangle
          </span>
        )}
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapInvalidateSize />
        <FitMapToPoints points={points} />
        <TileLayer url="https://{s}.map.turistautak.hu/tiles/turistautak/{z}/{x}/{y}.png" />
        {!isHikeMode && <MapClickHandler onMapClick={onMapClick} />}
        <MapAreaSelect
          active={isSelectingArea}
          onAreaSelected={onAreaSelected}
          onCancel={() => onSelectingAreaChange(false)}
        />
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
              onToggleVisited={onToggleVisited}
            />
          );
        })}
      </MapContainer>

      {showHowTo && <HowToBubble onDismiss={onDismissHowTo} />}
    </div>
  );
}
