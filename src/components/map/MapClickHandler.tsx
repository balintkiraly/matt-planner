import { useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

type Props = {
  onMapClick: (lat: number, lng: number) => void;
};

export function MapClickHandler({ onMapClick }: Props) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
