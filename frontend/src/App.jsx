import { useState, useEffect } from 'react'
import axios from 'axios'
import Register from './Register'
import Login from './Login'

function App() {
  const [status, setStatus] = useState("กำลังตรวจสอบ...")
  const [currentView, setCurrentView] = useState("login")
  
  // 🌟 เพิ่มตัวแปรเก็บข้อมูลคนล็อกอิน
  const [user, setUser] = useState(null); 

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/')
      .then(res => setStatus("✅ " + res.data.message))
      .catch(err => setStatus("❌ เชื่อมต่อ Backend ไม่ได้"))
  }, [])

  // ฟังก์ชัน Logout (แค่ล้างค่า user ออก)
  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
  }

  return (
    <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '20px' }}>
      <h1>🚗 SE4AI Drowsiness Project</h1>
      <p style={{ fontSize: '12px', color: '#888' }}>Server: {status}</p>
      <hr />

      {/* 👇 เงื่อนไข: ถ้ามี User (ล็อกอินแล้ว) ให้โชว์หน้า Dashboard */}
      {user ? (
        <div style={{ padding: "20px", border: "2px solid green", borderRadius: "10px" }}>
          <h2>🎉 ยินดีต้อนรับ, {user.username}!</h2>
          <p>สถานะของคุณคือ: <strong>{user.role}</strong></p>
          
          <div style={{ marginTop: "20px" }}>
             {/* ตรงนี้เดี๋ยวเราจะใส่ปุ่ม AI Detection ใน Backlog ถัดไป */}
             <button style={{ fontSize: "20px", padding: "15px", background: "orange", border: "none", cursor: "pointer" }}>
                📷 เริ่มตรวจจับความง่วง
             </button>
          </div>

          <button onClick={handleLogout} style={{ marginTop: "20px", background: "red", color: "white", padding: "10px", border: "none" }}>
            ออกจากระบบ
          </button>
        </div>
      ) : (
        // 👇 ถ้ายังไม่ล็อกอิน ให้โชว์หน้า Login/Register เหมือนเดิม
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