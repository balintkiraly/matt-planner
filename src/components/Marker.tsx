import { CircleMarker, Popup } from "react-leaflet";
import type { BonusCombination, Point } from "../types";

export type MarkerProps = {
  point: Point;
  isVisited: boolean;
  /** Hex color for the circle (e.g. by score: green = low, red = high). */
  color: string;
  /** Bonus combinations that include this point. */
  combosContainingPoint: BonusCombination[];
  onToggleVisited?: (id: Point["id"]) => void;
};

export const Marker = ({
  point,
  isVisited,
  color,
  combosContainingPoint,
  onToggleVisited,
}: MarkerProps) => {
  const { id, lat, lng, name, baseScore, task } = point;

  const handleClick = () => {
    if (onToggleVisited) {
      onToggleVisited(id);
    }
  };

  return (
    <CircleMarker
      center={[lat, lng]}
      pathOptions={{
        fillColor: color,
        color: isVisited ? "#22c55e" : "#1e293b",
        fillOpacity: 0.85,
        weight: isVisited ? 3 : 2,
      }}
      radius={10}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="space-y-1 text-sm">
          <div className="font-semibold">
            {id} — {name}
          </div>
          <div>Base score: {baseScore}</div>
          {combosContainingPoint.length > 0 && (
            <div className="text-xs text-sky-600">
              In combo{combosContainingPoint.length !== 1 ? "s" : ""}:{" "}
              {combosContainingPoint
                .map((c) => `${c.name || c.id} (+${c.bonusScore})`)
                .join(", ")}
            </div>
          )}
          <div className="text-xs text-gray-600">{task}</div>
          <div
            className={`mt-1 text-xs font-medium ${
              isVisited ? "text-green-600" : "text-red-600"
            }`}
          >
            {isVisited ? "Visited" : "Not visited"}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
};
