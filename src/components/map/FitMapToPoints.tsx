import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Point } from "../../types";

export function FitMapToPoints({ points }: { points: Point[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    let south = Math.min(...lats);
    let north = Math.max(...lats);
    let west = Math.min(...lngs);
    let east = Math.max(...lngs);
    const pad = 0.002;
    if (north - south < pad) {
      south -= pad / 2;
      north += pad / 2;
    }
    if (east - west < pad) {
      west -= pad / 2;
      east += pad / 2;
    }
    map.fitBounds(L.latLngBounds([south, west], [north, east]), {
      padding: [40, 40],
      maxZoom: 16,
    });
  }, [map, points]);
  return null;
}
