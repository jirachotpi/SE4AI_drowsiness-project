import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout, status }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ส่วนโลโก้และสถานะระบบ */}
          <div className="flex items-center gap-4">
            <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-slate-900 tracking-tight text-decoration-none">
              Drowsiness<span className="text-blue-600">AI</span>
            </Link>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              status?.includes("✅") ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {status ? status.replace('✅ ', '') : "System Online"}
            </span>
          </div>

          {/* ส่วนเมนูด้านขวา */}
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
                <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">สถิติ</Link>
                <Link to="/camera" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">กล้อง AI</Link>
                <Link to="/history" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">ประวัติ</Link>
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