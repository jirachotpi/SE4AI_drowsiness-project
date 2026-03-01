import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout, status }) {
  // ซ่อน Navbar ทันที ถ้าผู้ใช้คนนี้เป็น 'admin' (เพราะแอดมินมี Sidebar อยู่แล้ว)
  if (user && user.role === 'admin') {
    return null; 
  }

  // 💡 [ส่วนที่เพิ่มมา] ระบบเช็กข้อความสถานะ เพื่อกำหนดสี
  const isError = status?.includes("เชื่อมต่อไม่ได้") || status?.includes("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  const isLoading = status?.includes("กำลังตรวจสอบ");

  // 💡 [ส่วนที่เพิ่มมา] กำหนดคลาสสีของกรอบข้อความและจุดไฟ
  const statusBg = isError ? "bg-red-50 text-red-700 border-red-200" 
                 : isLoading ? "bg-amber-50 text-amber-700 border-amber-200" 
                 : "bg-emerald-50 text-emerald-700 border-emerald-200";
                 
  const dotColor = isError ? "bg-red-500" 
                 : isLoading ? "bg-amber-500 animate-pulse" 
                 : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ส่วนโลโก้และสถานะระบบ */}
          <div className="flex items-center gap-4">
            {/* โลโก้เดิมของคุณ (ไม่ได้แก้ไข) */}
            <Link to={user ? "/camera" : "/"} className="text-xl font-bold text-slate-900 tracking-tight text-decoration-none">
              Drowsiness<span className="text-blue-600">AI</span>
            </Link>
            
            {/* 💡 [ส่วนที่แก้ไข] ป้ายสถานะแบบใหม่ มีจุดไฟและเปลี่ยนสีตามคำ */}
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors duration-300 ${statusBg}`}>
              <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
              <span className="truncate max-w-[200px] md:max-w-none">
                {status || "System Online"}
              </span>
            </div>
          </div>

          {/* ส่วนเมนูด้านขวา (คงเดิม 100%) */}
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">เข้าสู่ระบบ</Link>
                <Link to="/register" className="text-sm font-medium bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                  เริ่มต้นใช้งาน
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-slate-500 border-r border-slate-200 pr-6">
                  สวัสดี, {user.username}
                </span>
                
                {/* จัดเรียงและเปลี่ยนชื่อเมนูตาม PB-30 */}
                <Link to="/camera" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">กล้อง</Link>
                <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">กราฟวิเคราะห์</Link>
                <Link to="/history" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">สถิติการใช้งาน</Link>
                <Link to="/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">โปรไฟล์</Link>
                
                <button onClick={onLogout} className="text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 px-4 py-2 rounded-lg hover:bg-rose-100 transition-colors ml-2">
                  ออกจากระบบ
                </button>
              </>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}

export default Navbar;