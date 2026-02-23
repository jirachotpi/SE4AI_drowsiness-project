// --- frontend/src/App.jsx ---
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

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

// 👇 [NEW] นำเข้าหน้าประวัติ และหน้ากราฟสถิติ
import History from './pages/History'; // (PB-15)
import Dashboard from './pages/Dashboard'; // (PB-16)

import './styles/App.css'; 

function App() {
  const [status, setStatus] = useState("กำลังตรวจสอบ...");
  
  // สร้างตัวแปร user เพื่อเก็บข้อมูลคนที่ล็อกอิน
  const [user, setUser] = useState(null); 

  useEffect(() => {
    // 1. ดึงข้อมูล User จาก LocalStorage (ถ้ามี) จะได้ไม่ต้องล็อกอินใหม่
    const savedUser = localStorage.getItem('drowsiness_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 2. เช็กสถานะ Backend
    axios.get('http://127.0.0.1:8000/')
      .then(res => setStatus("✅ " + res.data.message))
      .catch(() => setStatus("❌ เชื่อมต่อ Backend ไม่ได้"));
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('drowsiness_user'); // ล้างข้อมูลตอนกดออกจากระบบ
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial' }}>
        
        {/* แถบเมนูด้านบน */}
        <Navbar user={user} onLogout={handleLogout} status={status} />
        
        {/* พื้นที่แสดงผลหน้าต่างๆ (กำหนดให้ขยายเต็มพื้นที่ที่เหลือ) */}
        <div style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            
            {/* ระบบล็อกอิน/สมัครสมาชิก */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            
            {/* 🚨 [UPDATED] หน้า Dashboard หลัก (แสดงสถิติกราฟ หรือ Admin) */}
            <Route path="/dashboard" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <Dashboard user={user} /> /* 👈 เรียกหน้ากราฟสถิติ PB-16 ตรงนี้ */
            } />

            {/* 🚨 [NEW] หน้ากล้องตรวจจับ (ย้ายมาจาก /dashboard เดิม) */}
            <Route path="/camera" element={
              !user ? <Navigate to="/login" /> : 
              <div style={{ padding: "20px", border: "2px solid green", borderRadius: "10px", backgroundColor: "#e8f5e9", textAlign: "center" }}>
                <h2 style={{ color: "green" }}>🚗 Driver Camera</h2>
                <p>ยินดีต้อนรับ, {user.username}! (กรุณาเปิดกล้องเพื่อเริ่มตรวจจับ)</p>
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                   <WebcamCapture user={user} />
                </div>
              </div>
            } />

            {/* 🚨 [UPDATED] หน้าประวัติการใช้งาน (PB-15) */}
            <Route path="/history" element={
              !user ? <Navigate to="/login" /> : <History user={user} />
            } />

            {/* หน้าข้อมูลส่วนตัว Profile (PB-14) */}
            <Route path="/profile" element={
              !user ? <Navigate to="/login" /> : <Profile user={user} />
            } />

            {/* หน้าจัดการผู้ใช้ (Admin เท่านั้นเข้าได้) */}
            <Route path="/admin/users" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <UserManagement /> : 
              <Navigate to="/dashboard" />
            } />

            {/* หน้าตั้งค่าระบบ AI (Admin เท่านั้นเข้าได้) */}
            <Route path="/admin/config" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <SystemConfig /> : 
              <Navigate to="/dashboard" />
            } />

          </Routes>
        </div>

        {/* ส่วนท้ายของเว็บ Footer (PB-13) */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;