// --- frontend/src/pages/Dashboard.jsx ---
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

function Dashboard({ user }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [period, setPeriod] = useState("7d");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); 

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !user.username) return;
      
      try {
        setLoading(true);
        const res = await axios.get(`http://127.0.0.1:8000/api/logs/stats?user_id=${user.username}&period=${period}&m=${selectedMonth}&y=${currentYear}`);
        setChartData(res.data);
      } catch (err) {
        console.error("ไม่สามารถดึงข้อมูลสถิติได้:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, period, selectedMonth, currentYear]); 

  // คำนวณยอดรวมสำหรับกล่องสถิติ
  const totals = useMemo(() => {
    return chartData.reduce((acc, curr) => ({
      drowsy: acc.drowsy + (curr.drowsy || 0),
      deep_sleep: acc.deep_sleep + (curr.deep_sleep || 0),
      staring: acc.staring + (curr.staring || 0),
    }), { drowsy: 0, deep_sleep: 0, staring: 0 });
  }, [chartData]);

  // ฟังก์ชันสร้างคลาสปุ่ม (Tailwind)
  const getButtonClass = (currentPeriod) => {
    const baseClass = "px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200 ";
    if (period === currentPeriod) {
      return baseClass + "bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-600";
    }
    return baseClass + "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100";
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          ภาพรวมพฤติกรรมการขับขี่
        </h2>
        <p className="text-gray-500 font-medium">สถิติความเสี่ยงแยกตามประเภทของคุณ <span className="font-bold text-gray-700">{user?.username || "Guest"}</span></p>
      </div>
      
      {/* ส่วนปุ่มเลือกโหมด */}
      <div className="flex justify-center mb-6 flex-wrap gap-3">
        <button className={getButtonClass("7d")} onClick={() => setPeriod("7d")}>7 วันล่าสุด</button>
        <button className={getButtonClass("month")} onClick={() => setPeriod("month")}>รายเดือน (1-12)</button>
        <button className={getButtonClass("year")} onClick={() => setPeriod("year")}>ภาพรวม 1 ปี</button>
      </div>

      {period === "month" && (
        <div className="flex justify-center mb-8 items-center gap-3">
          <span className="font-bold text-sm text-gray-600">เลือกเดือน:</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          >
            {[...Array(12).keys()].map(i => (
              <option key={i+1} value={i+1}>เดือนที่ {i+1}</option>
            ))}
          </select>
        </div>
      )}

      {/* กล่องการ์ดสถิติ (Stat Cards) - สไตล์เดียวกับ History.jsx */}
      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* การ์ดเริ่มวูบ (สีส้ม/เหลือง) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">เริ่มวูบสะสม</p>
              <h3 className="text-3xl font-black text-amber-500">
                {totals.drowsy} <span className="text-sm font-medium text-gray-500">ครั้ง</span>
              </h3>
            </div>
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
          </div>

          {/* การ์ดหลับใน (สีแดง) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">หลับในสะสม</p>
              <h3 className="text-3xl font-black text-red-600">
                {totals.deep_sleep} <span className="text-sm font-medium text-gray-500">ครั้ง</span>
              </h3>
            </div>
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
            </div>
          </div>

          {/* การ์ดหลับใน ตาค้าง (สีม่วง) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">หลับใน (ตาค้าง)</p>
              <h3 className="text-3xl font-black text-purple-600">
                {totals.staring} <span className="text-sm font-medium text-gray-500">ครั้ง</span>
              </h3>
            </div>
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            </div>
          </div>

        </div>
      )}
      
      {/* ส่วนแสดงกราฟ */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-[450px]">
        {loading ? (
           <div className="w-full h-full flex items-center justify-center">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
           </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} 
                angle={period === "month" ? -45 : 0} textAnchor={period === "month" ? "end" : "middle"} 
                axisLine={false} tickLine={false} dy={period === "month" ? 15 : 10}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "12px" }} 
                cursor={{ fill: "#f8fafc" }} 
              />
              <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "14px" }} />
              
              <Bar dataKey="drowsy" name="เริ่มวูบ" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="deep_sleep" name="หลับใน" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="staring" name="หลับใน (ตาค้าง)" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <p>ยังไม่มีข้อมูลสถิติเพียงพอสำหรับสร้างกราฟ</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;