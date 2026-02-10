import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { Rectangle } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import type { SelectionBounds } from "../../scoring";

type Props = {
  active: boolean;
  onAreaSelected: (bounds: SelectionBounds) => void;
  onCancel?: () => void;
};

export function MapAreaSelect({ active, onAreaSelected, onCancel }: Props) {
  const map = useMap();
  const dragStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const dragEndRef = useRef<{ lat: number; lng: number } | null>(null);
  const [previewBounds, setPreviewBounds] = useState<SelectionBounds | null>(null);

  useMapEvents({
    mousedown: active
      ? (e: LeafletMouseEvent) => {
          map.dragging.disable();
          dragStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
          dragEndRef.current = null;
          setPreviewBounds(null);
        }
      : undefined,
    mousemove: active
      ? (e: LeafletMouseEvent) => {
          const start = dragStartRef.current;
          if (!start) return;
          dragEndRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
          setPreviewBounds({
            south: Math.min(start.lat, e.latlng.lat),
            north: Math.max(start.lat, e.latlng.lat),
            west: Math.min(start.lng, e.latlng.lng),
            east: Math.max(start.lng, e.latlng.lng),
          });
        }
      : undefined,
    mouseup: active
      ? () => {
          map.dragging.enable();
          const start = dragStartRef.current;
          const end = dragEndRef.current;
          if (start && end) {
            const south = Math.min(start.lat, end.lat);
            const north = Math.max(start.lat, end.lat);
            const west = Math.min(start.lng, end.lng);
            const east = Math.max(start.lng, end.lng);
            if (north - south > 0.0001 || east - west > 0.0001) {
              onAreaSelected({ south, north, west, east });
            }
          }
          dragStartRef.current = null;
          dragEndRef.current = null;
          setPreviewBounds(null);
        }
      : undefined,
  });

  useEffect(() => {
    if (!active) {
      map.dragging.enable();
      dragStartRef.current = null;
      setPreviewBounds(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel?.();
        map.dragging.enable();
        dragStartRef.current = null;
        setPreviewBounds(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, map, onCancel]);

  if (!active) return null;

  return previewBounds ? (
    <Rectangle
      bounds={[
        [previewBounds.south, previewBounds.west],
        [previewBounds.north, previewBounds.east],
      ]}
      pathOptions={{
        color: "#38bdf8",
        fillColor: "#38bdf8",
        fillOpacity: 0.2,
        weight: 2,
      }}
    />
  ) : null;
}
