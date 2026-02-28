// --- frontend/src/pages/AdminDashboard.jsx ---
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function AdminDashboard({ user, onLogout }) {
  const [logs, setLogs] = useState([]); 
  const [stats, setStats] = useState({ total_users: 0, total_logs: 0, today_alerts: 0, deep_sleep_today: 0, staring_today: 0 });
  const [loading, setLoading] = useState(true);

  // ระบบ Pagination และ Filter วันที่
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); // ค่าเริ่มต้นคือวันนี้ (YYYY-MM-DD)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // แสดงหน้าละ 15 บรรทัด

  const fetchData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/logs"),
        axios.get("http://127.0.0.1:8000/api/admin/stats")
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute:'2-digit', second:'2-digit'
    });
  };

  // 1. กรองข้อมูลเฉพาะวันที่เลือก
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp).toLocaleDateString('en-CA');
    return logDate === selectedDate;
  });

  // 2. คำนวณการแบ่งหน้า (Pagination)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div 
      className="min-h-[100vh] bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row overflow-hidden relative"
      style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginTop: "-2rem", marginBottom: "-2rem" }}
    >
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div><h1 className="text-lg font-bold text-white tracking-wide">Admin <span className="text-blue-500">Panel</span></h1></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/dashboard" className="block"><button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-blue-600 text-white shadow-md">ภาพรวมระบบ</button></Link>
          <Link to="/admin/users" className="block"><button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-slate-800 hover:text-white">จัดการผู้ใช้งาน</button></Link>
          <Link to="/admin/config" className="block"><button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-slate-800 hover:text-white">ตั้งค่าระบบ AI</button></Link>
        </nav>
        <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">{user?.username?.charAt(0).toUpperCase() || "A"}</div>
            <div className="text-sm"><p className="font-bold text-white">{user?.username || "Admin"}</p><p className="text-xs text-slate-500">Super Administrator</p></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors font-medium text-sm">
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-2xl font-bold text-slate-800">ภาพรวมระบบ (Dashboard)</h2>
          {loading && <span className="text-sm font-medium text-slate-400 flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div> กำลังอัปเดต...</span>}
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8 max-w-7xl mx-auto">
            
            {/* Stats Cards (5 คอลัมน์) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ผู้ใช้งานทั้งหมด</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.total_users} <span className="text-sm font-medium text-slate-400">คน</span></h3>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-500">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ประวัติทั้งหมด</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.total_logs} <span className="text-sm font-medium text-slate-400">รายการ</span></h3>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-amber-500">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เริ่มง่วง (วันนี้)</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.today_alerts - stats.deep_sleep_today - (stats.staring_today || 0)} <span className="text-sm font-medium text-slate-400">ครั้ง</span></h3>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-rose-500">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">หลับใน (วันนี้)</p>
                <h3 className="text-2xl font-black text-rose-600">{stats.deep_sleep_today} <span className="text-sm font-medium text-slate-400">ครั้ง</span></h3>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-purple-500">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ตาค้าง (วันนี้)</p>
                <h3 className="text-2xl font-black text-purple-600">{stats.staring_today || 0} <span className="text-sm font-medium text-slate-400">ครั้ง</span></h3>
              </div>
            </div>

            {/* System Logs Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
                   ประวัติการแจ้งเตือน
                 </h3>
                 
                 {/* ตัวกรองวันที่ */}
                 <div className="flex items-center gap-2">
                   <label className="text-sm font-bold text-slate-500">เลือกวันที่:</label>
                   <input 
                     type="date" 
                     value={selectedDate}
                     onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                     className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                       <th className="px-6 py-4 font-bold">เวลา (Timestamp)</th>
                       <th className="px-6 py-4 font-bold">รหัสผู้ใช้ (User ID)</th>
                       <th className="px-6 py-4 font-bold">เหตุการณ์ (Event)</th>
                       <th className="px-6 py-4 font-bold text-center">ระยะเวลา (s)</th>
                       <th className="px-6 py-4 font-bold text-center">ค่า EAR</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {loading && logs.length === 0 ? (
                       <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">กำลังโหลดข้อมูล...</td></tr>
                     ) : currentLogs.length > 0 ? (
                       currentLogs.map((log) => (
                         <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(log.timestamp)}</td>
                           <td className="px-6 py-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">{log.user_id.charAt(0).toUpperCase()}</div>
                             {log.user_id}
                           </td>
                           <td className="px-6 py-4">
                             {log.event_type === "deep_sleep" ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> หลับใน</span>
                             ) : log.event_type === "staring" ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> ตาค้าง</span>
                             ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ง่วง/วูบ</span>
                             )}
                           </td>
                           <td className="px-6 py-4 text-sm font-mono text-center text-slate-500">
                             {/* แปลงจาก ms เป็นวินาที */ }
                             {log.duration_ms ? (log.duration_ms / 1000).toFixed(1) + ' s' : '-'}
                           </td>
                           <td className="px-6 py-4 text-sm font-mono text-center">
                              <span className={`px-2 py-1 rounded border ${parseFloat(log.ear_value) < 0.2 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                {log.ear_value || "-"}
                              </span>
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">ไม่พบประวัติการแจ้งเตือนในวันที่เลือก</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
               
               {/* Pagination Controls */}
               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
                  <span>แสดงหน้า {currentPage} จาก {totalPages} (ทั้งหมด {filteredLogs.length} รายการ)</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevPage} 
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ก่อนหน้า
                    </button>
                    <button 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ถัดไป
                    </button>
                  </div>
               </div>

            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;