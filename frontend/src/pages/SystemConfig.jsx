// --- frontend/src/pages/SystemConfig.jsx ---
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Admin.css"; 

function SystemConfig() {
  const [config, setConfig] = useState({
    ear_threshold: 0.2,
    drowsy_time: 2.0,
    sleep_time: 3.0
  });
  const [loading, setLoading] = useState(false);

  // ดึงค่าการตั้งค่าจาก Backend ตอนเปิดหน้า
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/admin/config");
        setConfig({
          ear_threshold: res.data.ear_threshold,
          drowsy_time: res.data.drowsy_time,
          sleep_time: res.data.sleep_time
        });
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };
    fetchConfig();
  }, []);

  // เมื่อแอดมินพิมพ์แก้ไขตัวเลข
  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: parseFloat(e.target.value) });
  };

  // กดยืนยันการบันทึก
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put("http://127.0.0.1:8000/api/admin/config", config);
      alert("✅ บันทึกการตั้งค่าระบบสำเร็จ!");
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 style={{ margin: 0 }}>⚙️ ตั้งค่าระบบ AI</h1>
        <Link to="/dashboard">
          <button style={{ background: "#3498db", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            ⬅️ กลับหน้าภาพรวม
          </button>
        </Link>
      </div>

      <div className="admin-table-container" style={{ maxWidth: "600px", margin: "0 auto", padding: "30px" }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>ค่า EAR Threshold (ระดับตาปิด)</label>
            <input 
              type="number" step="0.01" name="ear_threshold" 
              value={config.ear_threshold} onChange={handleChange} required 
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
            <small style={{ color: "#7f8c8d" }}>ค่าแนะนำ: 0.20 ถึง 0.25 (ค่าน้อย = ต้องหลับตาแน่นมากๆ ถึงจะแจ้งเตือน)</small>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>เวลาแจ้งเตือน "ง่วง/วูบ" (วินาที)</label>
            <input 
              type="number" step="0.1" name="drowsy_time" 
              value={config.drowsy_time} onChange={handleChange} required 
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
            <small style={{ color: "#7f8c8d" }}>ระยะเวลาที่ผู้ใช้หลับตาติดต่อกันก่อนที่ระบบจะเตือนว่า "ง่วง"</small>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>เวลาแจ้งเตือน "หลับใน" (วินาที)</label>
            <input 
              type="number" step="0.1" name="sleep_time" 
              value={config.sleep_time} onChange={handleChange} required 
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
            <small style={{ color: "#7f8c8d" }}>ระยะเวลาที่ผู้ใช้หลับตาติดต่อกันก่อนที่ระบบจะเตือนขั้นวิกฤต (หลับใน)</small>
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", background: "#2ecc71", color: "white", padding: "15px", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>
            {loading ? "กำลังบันทึก..." : "💾 บันทึกการตั้งค่า"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default SystemConfig;