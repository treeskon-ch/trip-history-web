"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

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

  const getPageTitle = () => {
    if (pathname.startsWith("/tracking")) return "แผนที่ติดตามสถานะเรียลไทม์";
    if (pathname.startsWith("/history")) return "ประวัติการเดินทาง";
    if (pathname.startsWith("/plan")) return "สร้างแผนงาน (Dispatch)";
    return "Treesukon TMS";
  };

  return (
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 z-10 flex-shrink-0">
      <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer text-gray-500 hover:text-primary transition">
          <i className="fa-solid fa-bell text-xl"></i>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">
            3
          </span>
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
