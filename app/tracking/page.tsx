"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import MainLayout from "../../components/layout/MainLayout";
import { DriverLocation } from "../../components/map/TrackingMap";
import { useWebSocket } from "../../contexts/WebSocketContext";

const TrackingMap = dynamic(() => import("../../components/map/TrackingMap"), {
  ssr: false,
});

export default function TrackingPage() {
  const [activeDrivers, setActiveDrivers] = useState<Record<string, DriverLocation>>({});
  const [driverNames, setDriverNames] = useState<Record<string, string>>({});
  const driverNamesRef = useRef<Record<string, string>>({});
  const { subscribe } = useWebSocket();

  // 1. Fetch Users to map userId to name
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`/api/users`);
        const namesMap: Record<string, string> = {};
        
        // ตรวจสอบก่อนว่ามีข้อมูลและเป็น Array ค่อยทำการวนลูป
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((u: any) => {
            namesMap[u.userId] = u.name;
          });
        }
        
        setDriverNames(namesMap);
        driverNamesRef.current = namesMap;
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // 2. Connect to WebSocket for real-time locations
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (!data || !data.userId) return;
      if (data.type === "issue") return; // Ignored here, handled in Header

      setActiveDrivers((prev) => ({
        ...prev,
        [data.userId]: {
          ...data,
          name: driverNamesRef.current[data.userId] || "Unknown Driver",
        },
      }));
    });

    return unsubscribe;
  }, [subscribe]);

  const driverCount = Object.keys(activeDrivers).length;

  return (
    <MainLayout>
      <div className="flex-1 w-full h-full relative">
        {/* Map Container */}
        <div className="w-full h-full z-0 absolute inset-0">
          <TrackingMap activeDrivers={activeDrivers} />
        </div>

        {/* Overlay Panel (Active Drivers) */}
        <div className="absolute top-6 left-6 w-80 glass-panel rounded-2xl shadow-xl flex flex-col max-h-[calc(100vh-8rem)] z-[5]">
          <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/50 rounded-t-2xl">
            <h3 className="font-semibold text-primary">
              <i className="fa-solid fa-truck-fast mr-2"></i>รถที่กำลังวิ่ง ({driverCount})
            </h3>
            <button
              className="text-gray-400 hover:text-primary transition"
              onClick={() => setActiveDrivers({})}
              title="Clear map"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div className="overflow-y-auto p-2 flex-1">
            {driverCount === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">ไม่มีรถที่กำลังวิ่งในขณะนี้</p>
            ) : (
              Object.values(activeDrivers).map((driver) => {
                const initial = driver.name ? driver.name.charAt(0) : "D";
                const isRunning = driver.speed > 0;
                
                return (
                  <div
                    key={driver.userId}
                    className="bg-white p-3 rounded-xl shadow-sm mb-2 border border-gray-100 cursor-pointer hover:border-brand transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            isRunning
                              ? "bg-green-100 text-primary"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{driver.name || "Unknown Driver"}</p>
                          <p className="text-[10px] text-gray-500">{driver.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                          isRunning
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isRunning ? "กำลังวิ่ง" : "จอดนิ่ง"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2 mt-2">
                      <i
                        className={`fa-solid fa-location-arrow ${
                          isRunning ? "text-brand" : "text-yellow-500"
                        }`}
                      ></i>
                      <span className="truncate">
                        ความเร็ว: {driver.speed.toFixed(1)} กม./ชม.
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
