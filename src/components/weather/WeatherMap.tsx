import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WeatherMapProps {
  lat: number;
  lon: number;
  accent: string;
  onPick: (lat: number, lon: number) => void;
}

// Inline SVG marker (no external assets, avoids Leaflet's broken default-icon paths)
function buildMarkerIcon(accent: string): L.DivIcon {
  const html = `
    <div style="position:relative;width:28px;height:36px;transform:translate(-50%,-100%);">
      <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${accent}"/>
        <circle cx="14" cy="14" r="5" fill="#ffffff"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "weather-pin",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  });
}

const WeatherMap = ({ lat, lon, accent, onPick }: WeatherMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const marker = L.marker([lat, lon], { icon: buildMarkerIcon(accent) }).addTo(map);
    markerRef.current = marker;

    map.on("click", (e) => {
      onPick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync coords / accent
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lon]);
    marker.setIcon(buildMarkerIcon(accent));
    map.flyTo([lat, lon], Math.max(map.getZoom(), 7), { duration: 0.7 });
  }, [lat, lon, accent]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default WeatherMap;
