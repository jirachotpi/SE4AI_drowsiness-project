// --- frontend/src/pages/AdminDashboard.jsx ---
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function AdminDashboard({ user, onLogout }) {
  // 1. State สำหรับเก็บข้อมูลจริงจาก API
  const [logs, setLogs] = useState([]); 
  const [stats, setStats] = useState({ total_users: 0, total_logs: 0, today_alerts: 0, deep_sleep_today: 0 });
  const [loading, setLoading] = useState(true);

  // 2. ฟังก์ชันดึงข้อมูลจาก Backend
  const fetchData = async () => {
    try {
      // ดึงข้อมูล 2 API พร้อมกันเพื่อความรวดเร็ว
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

  // 3. Auto-refresh ทุกๆ 5 วินาที
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  // ฟังก์ชันจัดรูปแบบวันที่ให้สวยงาม
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute:'2-digit', second:'2-digit'
    });
  };

  return (
    // ใช้ Breakout CSS เพื่อให้ Sidebar ชิดขอบจอและยืดเต็มพื้นที่
    <div 
      className="min-h-[100vh] bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row overflow-hidden relative"
      style={{ 
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)", 
        marginTop: "-2rem", 
        marginBottom: "-2rem" 
      }}
    >
      
      {/* ========================================== */}
      {/* Sidebar Navigation */}
      {/* ========================================== */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Admin <span className="text-blue-500">Panel</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* เมนู ภาพรวมระบบ (Active) */}
          <Link to="/admin/dashboard" className="block">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              ภาพรวมระบบ
            </button>
          </Link>
          
          {/* เมนู จัดการผู้ใช้ */}
          <Link to="/admin/users" className="block">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-slate-800 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              จัดการผู้ใช้งาน
            </button>
          </Link>

          {/* เมนู ตั้งค่าระบบ */}
          <Link to="/admin/config" className="block">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-slate-800 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              ตั้งค่าระบบ
            </button>
          </Link>
        </nav>

        {/* ผู้ใช้งาน & ปุ่มออกจากระบบ */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">{user?.username || "Admin"}</p>
              <p className="text-xs text-slate-500">Super Administrator</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* Main Content Area */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-2xl font-bold text-slate-800">ภาพรวมระบบ (Dashboard)</h2>
          <div className="flex items-center gap-4">
            {loading && <span className="text-sm font-medium text-slate-400 flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div> กำลังอัปเดต...</span>}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-7xl mx-auto"
          >
            {/* Stats Cards (ข้อมูลจริงจาก API) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">ผู้ใช้งานทั้งหมด</p>
                  <h3 className="text-3xl font-black text-slate-800">{stats.total_users} <span className="text-base font-medium text-slate-400">บัญชี</span></h3>
                </div>
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">แจ้งเตือนวันนี้</p>
                  <h3 className="text-3xl font-black text-slate-800">{stats.today_alerts} <span className="text-base font-medium text-slate-400">ครั้ง</span></h3>
                </div>
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" /></svg>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">หลับในอันตราย</p>
                  <h3 className="text-3xl font-black text-rose-600">{stats.deep_sleep_today} <span className="text-base font-medium text-slate-400">ครั้ง</span></h3>
                </div>
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">ประวัติระบบทั้งหมด</p>
                  <h3 className="text-3xl font-black text-slate-800">{stats.total_logs} <span className="text-base font-medium text-slate-400">รายการ</span></h3>
                </div>
                <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                </div>
              </div>

            </div>

            {/* System Logs Table (ข้อมูลจริงจาก API) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
                   ประวัติการแจ้งเตือนล่าสุด
                 </h3>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                       <th className="px-6 py-4 font-bold">เวลา (Timestamp)</th>
                       <th className="px-6 py-4 font-bold">รหัสผู้ใช้ (User ID)</th>
                       <th className="px-6 py-4 font-bold">เหตุการณ์ (Event)</th>
                       <th className="px-6 py-4 font-bold text-center">ระยะเวลา (ms)</th>
                       <th className="px-6 py-4 font-bold text-center">ค่า EAR</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {loading && logs.length === 0 ? (
                       <tr>
                         <td colSpan="5" className="px-6 py-12 text-center text-slate-500">กำลังโหลดข้อมูล...</td>
                       </tr>
                     ) : logs.length > 0 ? (
                       logs.map((log) => (
                         <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 text-sm font-medium text-slate-600">
                             {formatDate(log.timestamp)}
                           </td>
                           <td className="px-6 py-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                               {log.user_id.charAt(0).toUpperCase()}
                             </div>
                             {log.user_id}
                           </td>
                           <td className="px-6 py-4">
                             {log.event_type === "deep_sleep" ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                 <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> หลับใน
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ง่วง/วูบ
                               </span>
                             )}
                           </td>
                           <td className="px-6 py-4 text-sm font-mono text-center text-slate-500">
                             {log.duration_ms} ms
                           </td>
                           <td className="px-6 py-4 text-sm font-mono text-center">
                              <span className={`px-2 py-1 rounded border ${parseFloat(log.ear_value) < 0.2 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                {log.ear_value}
                              </span>
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan="5" className="px-6 py-12 text-center text-slate-500">ไม่พบประวัติการแจ้งเตือน</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

          </motion.div>
        </div>
      </main>

    </div>
  );
}

export default AdminDashboard;