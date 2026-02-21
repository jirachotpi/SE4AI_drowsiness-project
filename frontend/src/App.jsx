// --- frontend/src/App.jsx ---
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// นำเข้า Components และ Pages จากโฟลเดอร์ใหม่
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import WebcamCapture from './pages/WebcamCapture';

import './styles/App.css'; // เผื่อมีการใช้ CSS

function App() {
  const [status, setStatus] = useState("กำลังตรวจสอบ...");
  const [user, setUser] = useState(null); 

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/')
      .then(res => setStatus("✅ " + res.data.message))
      .catch(err => setStatus("❌ เชื่อมต่อ Backend ไม่ได้"));
  }, []);

  const handleLogout = () => {
    setUser(null);
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
            
            {/* ถ้าล็อกอินแล้วให้เด้งไปหน้า Dashboard เลย */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            
            <Route path="/dashboard" element={
              !user ? <Navigate to="/login" /> : // ถ้ายังไม่ล็อกอิน เด้งไปหน้า Login
              user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <div style={{ padding: "20px", border: "2px solid green", borderRadius: "10px", backgroundColor: "#e8f5e9", textAlign: "center" }}>
                <h2 style={{ color: "green" }}>🚗 Driver Dashboard</h2>
                <p>ยินดีต้อนรับ, {user.username}!</p>
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                   <WebcamCapture user={user} />
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;