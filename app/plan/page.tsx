"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/layout/MainLayout";
import axios from "axios";

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export default function PlanPage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [driverId, setDriverId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("2026-09-04");
  const [time, setTime] = useState("10:00");
  const [pickupAddress, setPickupAddress] = useState("คลังสินค้าหลัก (บางนา)");
  const [dropOffAddress, setDropOffAddress] = useState("");

  // Fetch Drivers on component mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await axios.get(`/api/users`);
        // Filter only drivers
        const driverList = response.data.filter((u: User) => u.role === "driver" || !u.role);
        setDrivers(driverList);
      } catch (error) {
        console.error("Error fetching drivers:", error);
        alert("ไม่สามารถโหลดรายชื่อพนักงานขับรถได้");
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, []);

  const savePlan = async () => {
    if (!driverId || !dropOffAddress) {
      alert("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);

    // Combine date and time to ISO String
    const startDateTime = new Date(`${date}T${time}:00Z`).toISOString();

    const payload = {
      driverId,
      description,
      startTime: startDateTime,
      pickupPoint: {
        lat: 13.6682, // Hardcoded for demo
        lng: 100.6148,
        address: pickupAddress,
      },
      dropOffPoints: [
        {
          lat: 13.8222, // Hardcoded for demo
          lng: 100.5605,
          address: dropOffAddress,
        },
      ],
    };

    try {
      await axios.post(`/api/plans`, payload);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/tracking");
      }, 1500);
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("เกิดข้อผิดพลาดในการสร้างแผนงาน");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDriverId("");
    setDescription("");
    setDate("2026-09-04");
    setTime("10:00");
    setPickupAddress("คลังสินค้าหลัก (บางนา)");
    setDropOffAddress("");
  };

  return (
    <MainLayout>
      <div className="flex-col p-8 flex-1 overflow-y-auto flex items-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-primary px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <i className="fa-solid fa-clipboard-list text-xl"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                สร้างแผนงานจัดส่งใหม่
              </h3>
              <p className="text-green-100 text-xs">
                จ่ายงานให้พนักงานขับรถผ่านแอปพลิเคชัน
              </p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Col */}
            <div className="space-y-5">
              <h4 className="font-medium text-gray-800 border-b pb-2">
                <i className="fa-solid fa-box mr-2 text-brand"></i>
                ข้อมูลสินค้าและงาน
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกพนักงานขับรถ *
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                  disabled={isLoadingDrivers}
                >
                  <option value="" disabled>
                    {isLoadingDrivers ? "กำลังโหลดรายชื่อ..." : "-- เลือกพนักงาน --"}
                  </option>
                  {drivers.map((driver) => (
                    <option key={driver.userId} value={driver.userId}>
                      {driver.name} ({driver.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่กำหนดส่ง
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เวลา (โดยประมาณ)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดสินค้า (หมายเหตุ)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition h-24 resize-none"
                  placeholder="ระบุประเภทสินค้า จำนวน หรือคำสั่งพิเศษ..."
                ></textarea>
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-5">
              <h4 className="font-medium text-gray-800 border-b pb-2">
                <i className="fa-solid fa-route mr-2 text-brand"></i>
                เส้นทางจัดส่ง
              </h4>

              <div className="relative pl-6 py-2 border-l-2 border-dashed border-gray-300 ml-3 space-y-6">
                {/* Origin */}
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-gray-400 rounded-full -left-[35px] top-2 border-4 border-white shadow"></div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จุดรับสินค้า (Origin)
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-warehouse absolute left-3 top-3 text-gray-400"></i>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:border-brand outline-none"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-brand rounded-full -left-[35px] top-2 border-4 border-white shadow"></div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จุดส่งสินค้า (Destination) *
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-location-dot absolute left-3 top-3 text-red-400"></i>
                    <input
                      type="text"
                      value={dropOffAddress}
                      onChange={(e) => setDropOffAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:border-brand outline-none"
                      placeholder="ค้นหาสถานที่ หรือระบุที่อยู่..."
                    />
                  </div>
                  <button className="mt-2 text-xs text-primary font-medium hover:underline">
                    <i className="fa-solid fa-map-pin mr-1"></i> (ระบบพิกัดจำลอง)
                  </button>
                </div>
              </div>

              {/* Mock Mini Map for selection */}
              <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden relative border border-gray-300">
                <img
                  src="https://placehold.co/600x200/e5e3df/a0a0a0?text=Mock+Map"
                  alt="Mini Map"
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition"
              disabled={isSubmitting}
            >
              ล้างข้อมูล
            </button>
            <button
              onClick={savePlan}
              disabled={isSubmitting}
              className="px-8 py-2 rounded-lg bg-primary text-white font-medium hover:bg-brand shadow-lg shadow-green-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกและจ่ายงาน"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-10 right-10 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm transition-all duration-300 z-[100] flex items-center gap-3 ${
          showToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <i className="fa-solid fa-circle-check text-brand text-lg"></i>
        <span>บันทึกแผนงานและส่งแจ้งเตือนไปยังแอปพนักงานเรียบร้อยแล้ว</span>
      </div>
    </MainLayout>
  );
}
