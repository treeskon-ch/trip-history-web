"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

interface HistoryMapModalProps {
  jobId: string;
  driverName: string;
  timeStr: string;
  distance?: number;
  onClose: () => void;
}

export default function HistoryMapModal({
  jobId,
  driverName,
  timeStr,
  distance = 0,
  onClose,
}: HistoryMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Playback State
  const playbackState = useRef({
    isPlaying: false,
    currentIndex: 0,
    timer: null as NodeJS.Timeout | null,
    denseCoords: [] as [number, number][],
    vehicleMarker: null as L.Marker | null,
  });

  // Generate dense route
  const generateDenseRoute = (waypoints: [number, number][], stepsPerSegment = 30) => {
    let dense: [number, number][] = [];
    if (waypoints.length < 2) return waypoints; // Fallback if not enough points

    for (let i = 0; i < waypoints.length - 1; i++) {
      let p1 = waypoints[i];
      let p2 = waypoints[i + 1];
      for (let j = 0; j < stepsPerSegment; j++) {
        dense.push([
          p1[0] + (p2[0] - p1[0]) * (j / stepsPerSegment),
          p1[1] + (p2[1] - p1[1]) * (j / stepsPerSegment),
        ]);
      }
    }
    dense.push(waypoints[waypoints.length - 1]);
    return dense;
  };

  useEffect(() => {
    if (!mapRef.current) return;
    
    let isMounted = true;

    // Initialize Map
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([13.8, 100.6], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    setMapInstance(map);

    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/trips/${jobId}/route`);
        if (!response.ok) throw new Error("Failed to fetch route");
        
        const data = await response.json();
        if (!isMounted) return; // Prevent updating destroyed map

        let routeCoords: [number, number][] = [];
        
        if (data && data.length > 0) {
          routeCoords = data.map((loc: any) => [loc.lat, loc.lng]);
        } else {
          // If no data, use a fallback empty route
          console.warn("No route data found for this trip");
          return;
        }

        const denseCoords = generateDenseRoute(routeCoords, 50);
        playbackState.current.denseCoords = denseCoords;

        // Draw Line
        const routePolyline = L.polyline(routeCoords, {
          color: "#156d35",
          weight: 5,
          opacity: 0.8,
          dashArray: "10, 10",
          lineJoin: "round",
        }).addTo(map);

        // Markers
        const startIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color:#9ca3af; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [16, 16],
        });

        const endIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color:#156d35; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:10px;"><i class="fa-solid fa-flag-checkered"></i></div>`,
          iconSize: [22, 22],
        });

        L.marker(routeCoords[0], { icon: startIcon }).addTo(map).bindPopup("<b>จุดเริ่มต้น</b>");
        L.marker(routeCoords[routeCoords.length - 1], { icon: endIcon })
          .addTo(map)
          .bindPopup("<b>จุดสิ้นสุด</b>");

        // Vehicle Marker
        const vehicleIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color:#007bff; width:28px; height:28px; border-radius:50%; border:3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; z-index: 1000;"><i class="fa-solid fa-truck"></i></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const vehicleMarker = L.marker(denseCoords[0], { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
        playbackState.current.vehicleMarker = vehicleMarker;

        map.fitBounds(routePolyline.getBounds(), { padding: [50, 50], maxZoom: 16 });
      } catch (error) {
        console.error("Error fetching trip route:", error);
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
      stopPlayback();
      map.remove();
    };
  }, [jobId]);

  const updatePlaybackUI = (updateSlider = true) => {
    const state = playbackState.current;
    if (!state.vehicleMarker || state.denseCoords.length === 0) return;

    const currentPos = state.denseCoords[state.currentIndex];
    state.vehicleMarker.setLatLng(currentPos);

    if (updateSlider) {
      const percent = (state.currentIndex / (state.denseCoords.length - 1)) * 100;
      setProgress(percent);
    }
  };

  const stopPlayback = () => {
    if (playbackState.current.timer) {
      clearInterval(playbackState.current.timer);
    }
    playbackState.current.isPlaying = false;
    playbackState.current.currentIndex = 0;
    setIsPlaying(false);
    updatePlaybackUI();
  };

  const togglePlay = () => {
    const state = playbackState.current;

    if (state.isPlaying) {
      if (state.timer) clearInterval(state.timer);
      state.isPlaying = false;
      setIsPlaying(false);
    } else {
      if (state.currentIndex >= state.denseCoords.length - 1) {
        state.currentIndex = 0;
      }

      state.isPlaying = true;
      setIsPlaying(true);

      state.timer = setInterval(() => {
        state.currentIndex++;

        if (state.currentIndex >= state.denseCoords.length) {
          stopPlayback();
          return;
        }

        updatePlaybackUI();
      }, 50);
    }
  };

  const seekPlayback = (percent: number) => {
    const state = playbackState.current;
    if (state.denseCoords.length === 0) return;

    const targetIndex = Math.floor((percent / 100) * (state.denseCoords.length - 1));
    state.currentIndex = targetIndex;
    setProgress(percent);
    updatePlaybackUI(false);
  };

  const handleClose = () => {
    stopPlayback();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[90] flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white w-11/12 max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-primary text-xl">
              <i className="fa-solid fa-route"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">เส้นทางย้อนหลัง: {jobId}</h3>
              <p className="text-sm text-gray-500">
                <i className="fa-regular fa-user mr-1"></i> {driverName} <span className="mx-2">|</span>{" "}
                <i className="fa-regular fa-clock mr-1"></i> {timeStr}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-500 transition text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Map Container */}
        <div ref={mapRef} className="flex-1 w-full bg-gray-200 z-0"></div>

        {/* Modal Footer Info (Playback Controls) */}
        <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
          {/* Top info */}
          <div className="flex justify-between items-center text-sm font-medium text-gray-700">
            <span className="flex items-center gap-2">
              <i className="fa-regular fa-calendar text-lg"></i> 
              {timeStr}
            </span>
            <span>
              ระยะทางรวม: {distance.toFixed(1)} กม.
            </span>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between gap-4 mt-1">
            {/* Feature Toggles */}
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow hover:bg-blue-600 transition">
                <i className="fa-solid fa-car"></i>
              </button>
              <button className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow hover:bg-blue-600 transition">
                <i className="fa-solid fa-route"></i>
              </button>
            </div>

            {/* Playback Buttons */}
            <div className="flex gap-2 items-center mx-4">
              <button
                onClick={stopPlayback}
                className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
              >
                <i className="fa-solid fa-stop text-sm"></i>
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-md transition text-lg"
              >
                {isPlaying ? (
                  <i className="fa-solid fa-pause"></i>
                ) : (
                  <i className="fa-solid fa-play ml-1"></i>
                )}
              </button>
            </div>

            {/* Progress Slider */}
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => seekPlayback(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-bold text-gray-500 w-6 text-right">x1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
