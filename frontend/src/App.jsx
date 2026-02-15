import { useState, useEffect } from 'react'
import axios from 'axios'
import Register from './Register'
import Login from './Login'
import AdminDashboard from './AdminDashboard'
import WebcamCapture from './WebcamCapture'

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

  const renderLoggedInView = () => {
    if (user.role === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    } else {
      return (
        <div style={{ padding: "20px", border: "2px solid green", borderRadius: "10px", backgroundColor: "#e8f5e9" }}>
          <h2 style={{ color: "green" }}>🚗 Driver Dashboard</h2>
          <p>ยินดีต้อนรับ, {user.username}!</p>
          
          {/* 👇 แก้ไขตรงนี้ครับ */}
          <div style={{ marginTop: "20px" }}>
             <WebcamCapture user={user} />
          </div>

          <button onClick={handleLogout} style={{ marginTop: "20px", background: "red", color: "white", padding: "10px", border: "none", cursor: "pointer" }}>
            ออกจากระบบ
          </button>
        </div>
      );
    }
  }

  return (
    <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '20px' }}>
      <h1>SE4AI Project</h1>
      <p style={{ fontSize: '12px', color: '#888' }}>Server: {status}</p>
      <hr />

      {user ? (
        renderLoggedInView()
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