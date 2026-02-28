// --- frontend/src/pages/History.jsx ---
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function History({ user }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 💡 [NEW] State สำหรับ Pagination และ Date Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const itemsPerPage = 10; // กำหนดจำนวนรายการต่อหน้า

  // ดึงข้อมูลประวัติจาก API ของจริง
  useEffect(() => {
    if (!user || !user.username) {
        setIsLoading(false);
        return; 
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`http://127.0.0.1:8000/api/logs?user_id=${user.username}`);
        
        if (res.data && res.data.length > 0) {
            setLogs(res.data);
        } else {
            setLogs([]); 
        }
        setError(null);
      } catch (err) {
        console.error("ไม่สามารถดึงข้อมูลประวัติได้:", err);
        setError("ไม่สามารถดึงข้อมูลประวัติได้ หรือยังไม่มีข้อมูล");
        setLogs([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // 💡 [NEW] รีเซ็ตกลับไปหน้า 1 เสมอเมื่อมีการเปลี่ยนตัวกรองวันที่
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // 💡 [NEW] กรองข้อมูลตามวันที่ (Date Filter)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเพื่อเทียบเฉพาะวัน

      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (logDate < sDate) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0, 0, 0, 0);
        if (logDate > eDate) return false;
      }
      return true;
    });
  }, [logs, startDate, endDate]);

  // 💡 [NEW] จัดกลุ่มข้อมูลสำหรับกราฟ และเพิ่ม "ตาค้าง"
  const chartData = useMemo(() => {
    // นำข้อมูลที่กรองแล้วมาสร้างกราฟ และเรียงลำดับจากเก่าไปใหม่ (เพื่อแสดงในกราฟซ้ายไปขวา)
    const sortedForChart = [...filteredLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return sortedForChart.reduce((acc, log) => {
      if (!log.timestamp) return acc;
      
      const dateObj = new Date(log.timestamp);
      const dateStr = dateObj.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
      
      const existing = acc.find(item => item.date === dateStr);
      if (existing) {
        if (log.event_type === "deep_sleep") existing.deep_sleep += 1;
        else if (log.event_type === "staring") existing.staring += 1; // นับตาค้าง
        else existing.drowsy += 1;
      } else {
        acc.push({
          date: dateStr,
          drowsy: log.event_type === "drowsy" ? 1 : 0,
          deep_sleep: log.event_type === "deep_sleep" ? 1 : 0,
          staring: log.event_type === "staring" ? 1 : 0, // เริ่มนับตาค้าง
        });
      }
      return acc;
    }, []);
  }, [filteredLogs]);

  // 💡 [NEW] คำนวณข้อมูลสำหรับ Pagination (เลือกเฉพาะข้อมูลที่จะโชว์ในหน้านั้นๆ)
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // เรียงใหม่สุดขึ้นก่อน
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage) || 1;
  const currentTableData = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ฟังก์ชันจัดรูปแบบวันที่ให้สวยงาม
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute:'2-digit', second:'2-digit' 
    });
  };

  // 💡 [NEW] คอมโพเนนต์ป้ายกำกับ (Badge) รองรับตาค้าง (สีแดง)
  const EventBadge = ({ type }) => {
    if (type === "deep_sleep") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-pulse"></span>
          หลับใน (Deep Sleep)
        </span>
      );
    }
    if (type === "staring") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
          ตาค้าง (Staring)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        เริ่มวูบ (Drowsy)
      </span>
    );
  };

  // 💡 [NEW] คอมโพเนนต์ Tooltip รองรับตาค้าง
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 z-50">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">{`วันที่ ${label}`}</p>
          {payload.map((entry, index) => {
            let labelName = "เริ่มวูบ";
            if (entry.name === "deep_sleep") labelName = "หลับใน";
            if (entry.name === "staring") labelName = "ตาค้าง";
            
            return (
              <p key={index} className="text-sm font-medium flex justify-between gap-4 my-1" style={{ color: entry.color }}>
                <span>{labelName} :</span>
                <span>{entry.value} ครั้ง</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* ส่วนหัวหน้าเว็บ */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          รายงานประวัติและสถิติการขับขี่
        </h1>
        <p className="text-gray-500 font-medium">ภาพรวมพฤติกรรมและความปลอดภัยของผู้ใช้งาน: <span className="font-bold text-gray-700">{user?.username || "Guest"}</span></p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >

          {/* แจ้งเตือน Error ถ้ามี */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" /></svg>
              {error}
            </div>
          )}

          {/* ส่วนตัวกรองวันที่ (Date Filter) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-sm font-bold text-gray-600 mb-1">ตั้งแต่วันที่</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-sm font-bold text-gray-600 mb-1">ถึงวันที่</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ล้างตัวกรอง
            </button>
          </div>

          {/* ส่วนกราฟสรุปผล (Analytics Dashboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* กล่องสถิติย่อย */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">เหตุการณ์ทั้งหมด</p>
                  <h3 className="text-3xl font-black text-gray-800">{filteredLogs.length}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125-1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">ตาค้าง (แดง)</p>
                  <h3 className="text-3xl font-black text-red-600">{filteredLogs.filter(l => l.event_type === "staring").length}</h3>
                </div>
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" /></svg>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">หลับใน (ม่วง)</p>
                  <h3 className="text-3xl font-black text-purple-600">{filteredLogs.filter(l => l.event_type === "deep_sleep").length}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
                </div>
              </div>
            </div>

            {/* กราฟแท่ง (Bar Chart) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6">ความถี่ของอาการง่วงแยกตามวัน</h3>
              <div className="w-full h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}/>
                      <Bar dataKey="drowsy" name="เริ่มวูบ" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={30} stackId="a" />
                      <Bar dataKey="deep_sleep" name="หลับใน" fill="#a855f7" radius={[0, 0, 0, 0]} maxBarSize={30} stackId="a" />
                      <Bar dataKey="staring" name="ตาค้าง" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                    <p>ยังไม่มีข้อมูลสถิติเพียงพอสำหรับสร้างกราฟ</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ส่วนตารางข้อมูล (Data Table) พร้อม Pagination */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">รายละเอียดเหตุการณ์ (เรียงจากใหม่ไปเก่า)</h3>
              <span className="text-sm font-medium text-gray-500">ทั้งหมด {filteredLogs.length} รายการ</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">ลำดับ</th>
                    <th className="px-6 py-4 font-bold">วัน-เวลาที่เกิดเหตุ</th>
                    <th className="px-6 py-4 font-bold">ประเภทความเสี่ยง</th>
                    <th className="px-6 py-4 font-bold text-center">ระยะเวลา (วินาที)</th>
                    <th className="px-6 py-4 font-bold text-center">ค่า EAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTableData.map((log, index) => {
                    // คำนวณลำดับที่แท้จริง (เพื่อให้เลขเรียงถูกต้องแม้จะอยู่หน้า 2, 3...)
                    const realIndex = filteredLogs.length - ((currentPage - 1) * itemsPerPage + index);
                    
                    return (
                      <tr 
                        key={log.id || index} 
                        className="even:bg-slate-50 hover:bg-blue-50/60 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-500 group-hover:text-blue-600">
                          #{realIndex}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          <EventBadge type={log.event_type} />
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600 text-center">
                          {log.duration_ms ? (log.duration_ms / 1000).toFixed(1) + 's' : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-center">
                          {log.ear_value ? (
                            <span className={`px-2 py-1 rounded bg-gray-100 border border-gray-200 ${parseFloat(log.ear_value) < 0.2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {parseFloat(log.ear_value).toFixed(2)}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4 text-emerald-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-600 mb-1">ไม่พบประวัติการแจ้งเตือน</p>
                          <p className="text-sm">พฤติกรรมการขับขี่ของคุณอยู่ในเกณฑ์ปลอดภัย หรือไม่มีข้อมูลในช่วงวันที่เลือก</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ส่วนปุ่มเปลี่ยนหน้า (Pagination Controls) */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ก่อนหน้า
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default History;