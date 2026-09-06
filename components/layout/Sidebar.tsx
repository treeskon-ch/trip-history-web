"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "ติดตามสถานะ (Tracking)",
      path: "/tracking",
      icon: "fa-solid fa-map-location-dot",
    },
    {
      name: "ประวัติการเดินทาง",
      path: "/history",
      icon: "fa-solid fa-clock-rotate-left",
    },
    /*
    {
      name: "สร้างแผนงาน (Dispatch)",
      path: "/plan",
      icon: "fa-solid fa-calendar-plus",
    },
    */
    {
      name: "คู่มือ API",
      path: "/api-docs",
      icon: "fa-solid fa-book",
    }
  ];

  return (
    <aside className="w-64 bg-white shadow-xl z-20 flex flex-col h-full flex-shrink-0 relative">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 text-brand">
          <div className="grid grid-cols-3 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Treesukon<span className="text-gray-700">TMS</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary w-full text-left ${
                isActive ? "active" : ""
              }`}
            >
              <i className={`${item.icon} w-6 text-lg`}></i>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Profile */}
      {/*
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <img
            src="https://ui-avatars.com/api/?name=Admin+User&background=156d35&color=fff"
            alt="User Avatar"
            className="w-10 h-10 rounded-full shadow-sm"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">Admin Dispatcher</p>
            <p className="text-xs text-gray-500">ศูนย์กระจายสินค้า กทม.</p>
          </div>
        </div>
      </div>
      */}
    </aside>
  );
}
