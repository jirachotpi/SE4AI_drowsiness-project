// --- frontend/src/App.jsx ---
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// 💡 ลบ import axios ออก เพราะเราไม่ได้ใช้แล้ว
import api from './api'; // 💡 [NEW PB-33] นำเข้าตัวจัดการ API ที่มี Interceptor แนบ Token อัตโนมัติ

// นำเข้า Components และ Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer'; 
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import WebcamCapture from './pages/WebcamCapture';
import UserManagement from './pages/UserManagement'; 
import SystemConfig from './pages/SystemConfig'; 
import Profile from './pages/Profile'; 
import History from './pages/History'; 
import Dashboard from './pages/Dashboard'; 
import AdminAnalytics from './pages/AdminAnalytics'; 

function App() {
  // 1. ดึงข้อมูลเบื้องต้นจาก LocalStorage (เปลี่ยน Key เป็น 'user' ตามหน้า Login ใหม่)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [status, setStatus] = useState("กำลังตรวจสอบ...");
  
  // 💡 [NEW PB-33] State สำหรับรอตรวจสอบ Token กับ Backend ป้องกันการเด้งไปหน้า Login มั่วๆ
  const [isVerifying, setIsVerifying] = useState(true);

  // 2. useEffect สำหรับเช็ก Token (JWT) เมื่อผู้ใช้เปิดเว็บหรือรีเฟรชหน้า
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // ยิง API ไปเช็กตัวตน มันจะแนบ Token ไปให้อัตโนมัติโดย api.js
          const res = await api.get('/users/me'); 
          // ถ้าสำเร็จ อัปเดตข้อมูลผู้ใช้ให้สดใหม่เสมอ
          const verifiedUser = { username: res.data.username, role: res.data.role };
          setUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        } catch (error) {
          console.warn("Token หมดอายุหรือไม่ถูกต้อง บังคับออกจากระบบ");
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
      setIsVerifying(false); // ตรวจสอบเสร็จสิ้น
    };

    verifyToken();
  }, []);

  // 3. useEffect เช็กสถานะ Backend (Health Check)
useEffect(() => {
  const checkStatus = async () => {
    try {
      // 💡 เปลี่ยนจากดึง env ตรงๆ มาใช้จากตัวแปรที่เราตั้งใน api.js
      // โดยการเรียก api.defaults.baseURL 
      const response = await fetch(`${api.defaults.baseURL}/`); 
      
      // ถ้าเข้าหน้า Root (/) ของ Render ได้ มันจะคืนค่า {"message": "..."}
      const data = await response.json();
      setStatus(` ${data.message || "Drowsiness Detection API is Ready for Production!"}`);
    } catch (error) {
      console.error("Health check failed:", error);
      setStatus(" เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };
  checkStatus();
}, []);

  // 4. ฟังก์ชันออกจากระบบ 💡 [NEW PB-33] ต้องลบทั้ง token และ user
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // บังคับรีเฟรชเพื่อเคลียร์ State ทั้งหมด
  };

  // 💡 [NEW PB-33] ระหว่างรอเช็ก Token ให้แสดงหน้า Loading
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
        
        {/* แถบเมนูด้านบน */}
        <Navbar user={user} onLogout={handleLogout} status={status} />
        
        {/* พื้นที่แสดงผลหน้าต่างๆ */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-30">
          <Routes>
            <Route path="/" element={<Welcome />} />
            
            {/* ระบบล็อกอิน/สมัครสมาชิก: ถ้าเป็น User ไปหน้า /camera ถ้าเป็น Admin ไป /dashboard */}
            <Route path="/login" element={
              user ? <Navigate to={user.role === 'admin' ? "/dashboard" : "/camera"} /> : <Login onLoginSuccess={setUser} />
            } />
            <Route path="/register" element={
              user ? <Navigate to={user.role === 'admin' ? "/dashboard" : "/camera"} /> : <Register />
            } />
            
            {/* หน้า Dashboard หลัก */}
            <Route path="/dashboard" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <Dashboard user={user} />
            } />

            {/* หน้ากล้องตรวจจับ */}
            <Route path="/camera" element={
              !user ? <Navigate to="/login" /> : 
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 text-center w-full max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">ระบบกล้องวิเคราะห์ใบหน้า</h2>
                <p className="text-slate-500 mb-8">
                  ผู้ใช้งาน: <span className="font-semibold text-slate-700">{user.username}</span> (กรุณาเปิดกล้องเพื่อเริ่มการทำงาน)
                </p>
                <div className="flex justify-center w-full">
                   <WebcamCapture user={user} />
                </div>
              </div>
            } />

            {/* หน้าประวัติการใช้งาน */}
            <Route path="/history" element={
              !user ? <Navigate to="/login" /> : <History user={user} />
            } />

            {/* หน้าข้อมูลส่วนตัว Profile */}
            <Route path="/profile" element={
              !user ? <Navigate to="/login" /> : <Profile user={user} />
            } />

            {/* ========================================= */}
            {/* 🔒 โซนหน้าของ Admin */}
            {/* ========================================= */}

            {/* หน้าจัดการผู้ใช้ (Admin) */}
            <Route path="/admin/users" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <UserManagement user={user} onLogout={handleLogout} /> : 
              <Navigate to="/dashboard" />
            } />

            {/* หน้าตั้งค่าระบบ AI (Admin) */}
            <Route path="/admin/config" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <SystemConfig user={user} onLogout={handleLogout} /> : 
              <Navigate to="/dashboard" />
            } />

            {/* หน้าสถิติและกราฟ (Admin) */}
            <Route path="/admin/analytics" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <AdminAnalytics user={user} onLogout={handleLogout} /> : 
              <Navigate to="/dashboard" />
            } />

          </Routes>
        </main>

        {/* ส่วนท้ายของเว็บ */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;