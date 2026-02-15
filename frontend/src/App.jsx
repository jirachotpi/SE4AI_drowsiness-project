import { useState, useEffect } from 'react'
import axios from 'axios'
import Register from './Register'
import Login from './Login'
import AdminDashboard from './AdminDashboard' // <--- เพิ่มตัวนี้

function App() {
  const [status, setStatus] = useState("กำลังตรวจสอบ...")
  const [currentView, setCurrentView] = useState("login")
  const [user, setUser] = useState(null); 

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/')
      .then(res => setStatus("✅ " + res.data.message))
      .catch(err => setStatus("❌ เชื่อมต่อ Backend ไม่ได้"))
  }, [])

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
  }

  // --- 👇 ส่วนที่ทำหน้าที่ "แยก Role" ---
  const renderLoggedInView = () => {
    if (user.role === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    } else {
      // หน้าจอสำหรับ User (คนขับรถ)
      return (
        <div style={{ padding: "20px", border: "2px solid green", borderRadius: "10px", backgroundColor: "#e8f5e9" }}>
          <h2 style={{ color: "green" }}>🚗 Driver Dashboard</h2>
          <p>ยินดีต้อนรับ, {user.username}!</p>
          <p>สถานะ: <strong>ผู้ขับขี่ทั่วไป</strong></p>
          
          <div style={{ marginTop: "20px", padding: "30px", border: "1px dashed green" }}>
             <h3>[พื้นที่สำหรับกล้อง Webcam]</h3>
             <p>(จะมาใน Backlog-05)</p>
             <button style={{ fontSize: "20px", padding: "15px", background: "orange", border: "none", cursor: "pointer" }}>
                📷 เริ่มตรวจจับความง่วง
             </button>
          </div>

          <button onClick={handleLogout} style={{ marginTop: "20px", background: "red", color: "white", padding: "10px", border: "none" }}>
            ออกจากระบบ
          </button>
        </div>
      );
    }
  }
  // ------------------------------------

  return (
    <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '20px' }}>
      <h1>SE4AI Project</h1>
      <p style={{ fontSize: '12px', color: '#888' }}>Server: {status}</p>
      <hr />

      {user ? (
        renderLoggedInView() // ถ้าล็อกอินแล้ว ให้ฟังก์ชันเลือกหน้าจอให้
      ) : (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <button onClick={() => setCurrentView("login")} style={{ marginRight: "10px", padding: "10px", fontWeight: currentView === "login" ? "bold" : "normal" }}>เข้าสู่ระบบ</button>
            <button onClick={() => setCurrentView("register")} style={{ padding: "10px", fontWeight: currentView === "register" ? "bold" : "normal" }}>สมัครสมาชิก</button>
          </div>

          {currentView === "login" ? (
            <Login onLoginSuccess={setUser} /> 
          ) : (
            <Register />
          )}
        </div>
      )}

    </div>
  )
}

export default App