// --- frontend/src/App.jsx ---
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// นำเข้า Components และ Pages
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import WebcamCapture from './pages/WebcamCapture';
import UserManagement from './pages/UserManagement'; // นำเข้าหน้าจัดการผู้ใช้ (PB-18)

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
      <div style={{ fontFamily: 'Arial' }}>
        {/* แถบเมนูด้านบน */}
        <Navbar user={user} onLogout={handleLogout} status={status} />
        
        {/* พื้นที่แสดงผลหน้าต่างๆ */}
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            
            {/* ระบบล็อกอิน/สมัครสมาชิก */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            
            {/* หน้า Dashboard หลัก (แยกตาม Role) */}
            <Route path="/dashboard" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <div style={{ padding: "20px", border: "2px solid green", borderRadius: "10px", backgroundColor: "#e8f5e9", textAlign: "center" }}>
                <h2 style={{ color: "green" }}>🚗 Driver Dashboard</h2>
                <p>ยินดีต้อนรับ, {user.username}!</p>
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                   <WebcamCapture user={user} />
                </div>
              </div>
            } />

            {/* หน้าจัดการผู้ใช้ (Admin เท่านั้นเข้าได้) */}
            <Route path="/admin/users" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <UserManagement /> : 
              <Navigate to="/dashboard" />
            } />

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;