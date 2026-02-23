import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// นำเข้า Components และ Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // [NEW] นำเข้า Footer
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import WebcamCapture from './pages/WebcamCapture';
import UserManagement from './pages/UserManagement'; 
import SystemConfig from './pages/SystemConfig'; 

import './styles/App.css'; 

function App() {
  const [status, setStatus] = useState("กำลังตรวจสอบ...");
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const savedUser = localStorage.getItem('drowsiness_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    axios.get('http://127.0.0.1:8000/')
      .then(res => setStatus("✅ " + res.data.message))
      .catch(() => setStatus("❌ เชื่อมต่อ Backend ไม่ได้"));
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('drowsiness_user'); 
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial' }}>
        
        {/* [PB-13] แถบเมนูด้านบน */}
        <Navbar user={user} onLogout={handleLogout} status={status} />
        
        {/* พื้นที่แสดงผลหน้าต่างๆ */}
        <div style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            
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

            {/* --- [NEW] หน้า Placeholder สำรองไว้สำหรับเมนูใหม่ --- */}
            <Route path="/history" element={
              !user ? <Navigate to="/login" /> : 
              <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>📁 ประวัติของฉัน (Coming Soon)</h2>
                <p>หน้านี้จะถูกพัฒนาใน PB ถัดๆ ไปครับ</p>
              </div>
            } />
            
            <Route path="/settings" element={
              !user ? <Navigate to="/login" /> : 
              <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>⚙️ ตั้งค่า (Coming Soon)</h2>
                <p>หน้านี้จะถูกพัฒนาใน PB ถัดๆ ไปครับ</p>
              </div>
            } />
            {/* ---------------------------------------------------- */}

            <Route path="/admin/users" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <UserManagement /> : 
              <Navigate to="/dashboard" />
            } />

            <Route path="/admin/config" element={
              !user ? <Navigate to="/login" /> : 
              user.role === 'admin' ? <SystemConfig /> : 
              <Navigate to="/dashboard" />
            } />

          </Routes>
        </div>

        {/* [PB-13] ส่วนท้ายของเว็บ */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;