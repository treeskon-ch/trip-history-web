"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";

export interface DriverLocation {
  userId: string;
  name?: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

const createDriverIcon = (text: string, color: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="driver-marker" style="width:30px; height:30px; border-color:${color}; color:${color}">${text}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

interface TrackingMapProps {
  activeDrivers: Record<string, DriverLocation>;
}

export default function TrackingMap({ activeDrivers }: TrackingMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-pan map to show all drivers
  useEffect(() => {
    if (mapInstance && Object.keys(activeDrivers).length > 0) {
      const bounds = L.latLngBounds(
        Object.values(activeDrivers).map((d) => [d.lat, d.lng])
      );
      // Pad bounds slightly so markers aren't on the exact edge
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [mapInstance, activeDrivers]);

  if (!isClient) return null;

  return (
    <MapContainer
      center={[13.7563, 100.5018]} // Center of Bangkok as default
      zoom={10}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
      ref={setMapInstance}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

      {Object.values(activeDrivers).map((driver) => {
        // Fallback initials if name is missing
        const initial = driver.name ? driver.name.charAt(0) : "D";
        const isRunning = driver.speed > 0;
        const color = isRunning ? "#156d35" : "#b45309";

        return (
          <Marker
            key={driver.userId}
            position={[driver.lat, driver.lng]}
            icon={createDriverIcon(initial, color)}
          >
            <Popup>
              <b>{driver.name || "Unknown Driver"}</b>
              <br />
              พิกัด: {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
              <br />
              ความเร็ว: {driver.speed.toFixed(1)} กม./ชม.
              <br />
              สถานะ: {isRunning ? "กำลังวิ่ง" : "จอดนิ่ง"}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
