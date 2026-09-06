"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../../components/layout/MainLayout";
import dynamic from "next/dynamic";

const HistoryMapModal = dynamic(() => import("../../components/map/HistoryMapModal"), {
  ssr: false,
});

interface SelectedHistory {
  jobId: string;
  driverName: string;
  timeStr: string;
  distance: number;
}

interface TripData {
  id: string;
  userId: string;
  status: string;
  startTime: string;
  endTime?: string;
  distance?: number;
  imageUrl?: string;
  driverName?: string;
}

export default function HistoryPage() {
  const [selectedHistory, setSelectedHistory] = useState<SelectedHistory | null>(null);
  const [allTrips, setAllTrips] = useState<TripData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driversList, setDriversList] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 1. Fetch all users to map driver names
        const usersRes = await axios.get("/api/users");
        if (!usersRes.data || !Array.isArray(usersRes.data)) {
          setDriversList([]);
          return;
        }
        const drivers = usersRes.data.filter((u: any) => u.role === "driver" || !u.role);
        setDriversList(drivers);
        const nameMap: Record<string, string> = {};
        drivers.forEach((d: any) => {
          nameMap[d.userId] = d.name;
        });

        // 2. Fetch trips for all drivers in parallel
        const tripPromises = drivers.map((d: any) => 
          axios.get(`/api/trips?userId=${d.userId}`).catch(() => ({ data: [] }))
        );
        
        const tripResponses = await Promise.all(tripPromises);
        
        let allTripsFetched: TripData[] = [];
        tripResponses.forEach((res, index) => {
          if (res.data && Array.isArray(res.data)) {
            const driverTrips = res.data.map((t: any) => ({
              ...t,
              driverName: nameMap[t.userId] || "Unknown Driver"
            }));
            allTripsFetched = [...allTripsFetched, ...driverTrips];
          }
        });

        // Sort by start time descending (newest first)
        allTripsFetched.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        
        setAllTrips(allTripsFetched);
        setTrips(allTripsFetched);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleSearch = async () => {
    // If dates are not fully provided, fallback to frontend filtering
    if (!startDate || !endDate) {
      let filtered = [...allTrips];

      if (selectedDriver !== "all") {
        filtered = filtered.filter(t => t.userId === selectedDriver);
      }

      if (startDate) {
        const start = new Date(startDate).getTime();
        filtered = filtered.filter(t => new Date(t.startTime).getTime() >= start);
      }

      if (endDate) {
        const end = new Date(endDate).getTime();
        filtered = filtered.filter(t => new Date(t.startTime).getTime() <= end);
      }

      setTrips(filtered);
      return;
    }

    setIsLoading(true);
    try {
      const startIso = new Date(startDate).toISOString();
      const endIso = new Date(endDate).toISOString();

      const targetDrivers = selectedDriver === "all" ? driversList : driversList.filter(d => d.userId === selectedDriver);
      
      const tripPromises = targetDrivers.map(d => 
        axios.get(`/api/history?userId=${d.userId}&start=${startIso}&end=${endIso}`).catch(() => ({ data: [] }))
      );
      
      const tripResponses = await Promise.all(tripPromises);
      
      const nameMap: Record<string, string> = {};
      driversList.forEach(d => {
        nameMap[d.userId] = d.name;
      });

      let fetchedTrips: TripData[] = [];
      tripResponses.forEach(res => {
        if (res.data && Array.isArray(res.data)) {
          const driverTrips = res.data.map((t: any) => ({
            ...t,
            driverName: nameMap[t.userId] || "Unknown Driver"
          }));
          fetchedTrips = [...fetchedTrips, ...driverTrips];
        }
      });

      fetchedTrips.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      setTrips(fetchedTrips);
    } catch (error) {
      console.error("Error fetching history with API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDistance = (dist?: number) => {
    if (dist === undefined || dist === null) return "0.0 กม.";
    return `${dist.toFixed(1)} กม.`;
  };

  return (
    <MainLayout>
      <div className="flex-col p-8 flex-1 overflow-y-auto">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">วันเวลาเริ่มต้น</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">วันเวลาสิ้นสุด</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">พนักงานขับรถ</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            >
              <option value="all">ทั้งหมด</option>
              {driversList.map(d => (
                <option key={d.userId} value={d.userId}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <button 
              onClick={handleSearch}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand transition shadow-md"
            >
              <i className="fa-solid fa-magnifying-glass mr-2"></i>ค้นหา
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium">รหัสทริป (Trip ID)</th>
                  <th className="p-4 font-medium">พนักงาน</th>
                  <th className="p-4 font-medium">วันที่เริ่ม</th>
                  <th className="p-4 font-medium">เวลาเริ่ม - จบ</th>
                  <th className="p-4 font-medium">ระยะทาง</th>
                  <th className="p-4 font-medium">สถานะ</th>
                  <th className="p-4 font-medium">เส้นทาง</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      ไม่พบประวัติการเดินทาง
                    </td>
                  </tr>
                ) : (
                  trips.map((trip) => {
                    const startDate = new Date(trip.startTime).toLocaleDateString("th-TH");
                    const timeStr = `${formatDate(trip.startTime)} - ${formatDate(trip.endTime)}`;
                    const isCompleted = trip.status === "completed";
                    
                    return (
                      <tr key={trip.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-primary">
                          {trip.id.substring(0, 12)}...
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 text-primary flex items-center justify-center text-xs">
                              {trip.driverName?.charAt(0) || "U"}
                            </div>
                            {trip.driverName}
                          </div>
                        </td>
                        <td className="p-4">{startDate}</td>
                        <td className="p-4 text-gray-500">{timeStr}</td>
                        <td className="p-4">{formatDistance(trip.distance)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs ${
                            isCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            className="text-gray-400 hover:text-primary transition"
                            onClick={() =>
                              setSelectedHistory({
                                jobId: trip.id,
                                driverName: trip.driverName || "Unknown",
                                timeStr: timeStr,
                                distance: trip.distance || 0,
                              })
                            }
                          >
                            <i className="fa-solid fa-map"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500 bg-gray-50">
            <span>แสดงทั้งหมด {trips.length} รายการ</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50" disabled>
                ก่อนหน้า
              </button>
              <button className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50" disabled>
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render Modal conditionally */}
      {selectedHistory && (
        <HistoryMapModal
          jobId={selectedHistory.jobId}
          driverName={selectedHistory.driverName}
          timeStr={selectedHistory.timeStr}
          distance={selectedHistory.distance}
          onClose={() => setSelectedHistory(null)}
        />
      )}
    </MainLayout>
  );
}
