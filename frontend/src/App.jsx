import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState("กำลังเชื่อมต่อ...")
  const [aiResult, setAiResult] = useState(null)

  // 1. ทันทีที่เข้าเว็บ ให้ไปทักทาย Backend
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/')
      .then(response => {
        setStatus(response.data.message) // เอาข้อความจาก Python มาโชว์
      })
      .catch(error => {
        setStatus("เชื่อมต่อไม่ได้! (ลืมเปิด Backend หรือเปล่า?)")
        console.error(error)
      })
  }, [])

  // 2. ฟังก์ชันกดปุ่มเพื่อจำลองการตรวจจับ
  const checkDrowsiness = () => {
    axios.get('http://127.0.0.1:8000/api/detect-mock')
      .then(response => {
        setAiResult(response.data) // เอาผลลัพธ์มาใส่ตัวแปร
      })
      .catch(error => {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล AI")
      })
  }

  return (
    <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '50px' }}>
      <h1>😴 ระบบตรวจจับความง่วง (React + FastAPI)</h1>
      
      {/* กล่องแสดงสถานะ Backend */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px auto',
        maxWidth: '600px',
        border: '2px solid #2196f3'
      }}>
        <h3>สถานะ Server:</h3>
        <p style={{ fontSize: '18px', color: '#0d47a1' }}>{status}</p>
      </div>

      <hr style={{ margin: '30px 0' }} />

      {/* ส่วนทดสอบ AI */}
      <h2>ทดสอบระบบแจ้งเตือน</h2>
      <button 
        onClick={checkDrowsiness}
        style={{
          padding: '15px 30px',
          fontSize: '20px',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        📷 ลองตรวจจับ (จำลอง)
      </button>

      {/* แสดงผลลัพธ์ถ้ามีข้อมูล */}
      {aiResult && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '2px solid red', 
          borderRadius: '10px',
          backgroundColor: '#ffebee'
        }}>
          <h2 style={{ color: 'red' }}>⚠️ {aiResult.alert_message}</h2>
          <p>ค่า EAR: <strong>{aiResult.ear_value}</strong></p>
          <p>สถานะ: <strong>{aiResult.is_drowsy ? "ง่วงนอน (Drowsy)" : "ปกติ"}</strong></p>
        </div>
      )}
    </div>
  )
}

export default App