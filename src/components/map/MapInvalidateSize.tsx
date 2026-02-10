import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Ensures map size is valid after layout (e.g. flex/grid). Use once inside MapContainer. */
export function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}
