"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWebSocket } from "../../contexts/WebSocketContext";
import axios from "axios";

interface Notification {
  id: number;
  title: string;
  description: string;
  driverName: string;
  time: string;
  read: boolean;
}

export default function Header() {
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const { subscribe } = useWebSocket();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [driverNames, setDriverNames] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น."
      );
      setDateStr(
        now.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch users for mapping names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/users");
        if (response.data && Array.isArray(response.data)) {
          const namesMap: Record<string, string> = {};
          response.data.forEach((u: any) => {
            namesMap[u.userId] = u.name;
          });
          setDriverNames(namesMap);
        }
      } catch (error) {
        console.error("Error fetching users for header:", error);
      }
    };
    fetchUsers();
  }, []);

  // Subscribe to WebSocket
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data && data.type === "issue") {
        setNotifications((prev) => [
          {
            id: Date.now(),
            title: data.title || "แจ้งปัญหา",
            description: data.description || "-",
            driverName: driverNames[data.userId] || data.userId || "Unknown",
            time: data.reportedAt 
              ? new Date(data.reportedAt).toLocaleTimeString("th-TH") 
              : new Date().toLocaleTimeString("th-TH"),
            read: false,
          },
          ...prev,
        ]);
      }
    });
    return unsubscribe;
  }, [subscribe, driverNames]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname.startsWith("/tracking")) return "แผนที่ติดตามสถานะเรียลไทม์";
    if (pathname.startsWith("/history")) return "ประวัติการเดินทาง";
    if (pathname.startsWith("/plan")) return "สร้างแผนงาน (Dispatch)";
    return "Treesukon TMS";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowDropdown(false);
  };

  return (
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 z-10 flex-shrink-0 relative">
      <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>

      <div className="flex items-center gap-6">
        
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="cursor-pointer text-gray-500 hover:text-primary transition relative p-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <i className="fa-solid fa-bell text-xl"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">การแจ้งเตือนปัญหา</h3>
                {notifications.length > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-brand hover:underline font-medium">
                    อ่านทั้งหมด
                  </button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    ไม่มีการแจ้งเตือนใหม่
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition ${!notif.read ? "bg-red-50/30" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${!notif.read ? "font-bold text-red-600" : "font-medium text-gray-700"}`}>
                          <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400">{notif.time}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notif.description}</p>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <i className="fa-regular fa-user"></i> {notif.driverName}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-2 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={clearNotifications}
                    className="w-full py-1.5 text-xs text-gray-500 hover:text-red-500 transition font-medium text-center rounded hover:bg-gray-100"
                  >
                    ลบการแจ้งเตือนทั้งหมด
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200"></div>
        
        <div className="text-sm text-right">
          <p className="text-gray-500">{dateStr}</p>
          <p className="font-semibold text-primary">{timeStr}</p>
        </div>
      </div>
    </header>
  );
}
