import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard({ user, onLogout }) {
  const [logs, setLogs] = useState([]); // เก็บข้อมูล Log ที่ดึงมาจาก DB
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูล Log
  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/logs");
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLoading(false);
    }
  };

  // ดึงข้อมูลทันทีเมื่อหน้าเว็บโหลด
  useEffect(() => {
    fetchLogs();
    
    // (Optional) ตั้งเวลาให้ดึงข้อมูลใหม่ทุกๆ 5 วินาที (Auto Refresh)
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* Header ส่วนบน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
            <h1 style={{ margin: 0, color: "#2c3e50" }}>👮‍♂️ Admin Dashboard</h1>
            <p style={{ color: "#7f8c8d" }}>ยินดีต้อนรับ: <strong>{user.username}</strong></p>
        </div>
        <button 
            onClick={onLogout}
            style={{ padding: "10px 20px", background: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
            ออกจากระบบ
        </button>
      </div>

      {/* ตารางแสดงข้อมูล */}
      <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>📋 ประวัติเหตุการณ์ล่าสุด (Real-time DB)</h3>
            <button onClick={fetchLogs} style={{ padding: "5px 10px", background: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                🔄 รีเฟรชข้อมูล
            </button>
        </div>

        {loading ? (
            <p>กำลังโหลดข้อมูล...</p>
        ) : logs.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>ยังไม่มีประวัติการง่วงนอน</p>
        ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#ecf0f1", color: "#2c3e50", textAlign: "left" }}>
                        <th style={{ padding: "12px", borderBottom: "2px solid #bdc3c7" }}>เวลา (Time)</th>
                        <th style={{ padding: "12px", borderBottom: "2px solid #bdc3c7" }}>ผู้ใช้งาน (User)</th>
                        <th style={{ padding: "12px", borderBottom: "2px solid #bdc3c7" }}>เหตุการณ์</th>
                        <th style={{ padding: "12px", borderBottom: "2px solid #bdc3c7" }}>ระยะเวลา (ms)</th>
                        <th style={{ padding: "12px", borderBottom: "2px solid #bdc3c7" }}>ค่า EAR</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "12px" }}>
                                {new Date(log.timestamp).toLocaleString("th-TH")}
                            </td>
                            <td style={{ padding: "12px", fontWeight: "bold" }}>{log.user_id}</td>
                            <td style={{ padding: "12px" }}>
                                <span style={{
                                    padding: "5px 10px",
                                    borderRadius: "15px",
                                    fontSize: "12px",
                                    color: "white",
                                    backgroundColor: log.event_type === "deep_sleep" ? "#c0392b" : "#f39c12"
                                }}>
                                    {log.event_type === "deep_sleep" ? "😴 หลับใน" : "🥱 ง่วง/วูบ"}
                                </span>
                            </td>
                            <td style={{ padding: "12px" }}>{log.duration_ms} ms</td>
                            <td style={{ padding: "12px" }}>{log.ear_value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

    </div>
  );
}

export default AdminDashboard;