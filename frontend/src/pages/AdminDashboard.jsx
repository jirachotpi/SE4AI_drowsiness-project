// --- frontend/src/pages/AdminDashboard.jsx ---
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";


function AdminDashboard({ user, onLogout }) {
  const [logs, setLogs] = useState([]); 
  const [stats, setStats] = useState({ total_users: 0, total_logs: 0, today_alerts: 0, deep_sleep_today: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // ดึงข้อมูล 2 API พร้อมกันเพื่อความรวดเร็ว
      const [logsRes, statsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/logs"),
        axios.get("http://127.0.0.1:8000/api/admin/stats")
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // อัปเดตข้อมูลทุก 5 วินาที
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-container">
      
      {/* ส่วน Header ที่มีปุ่มไปหน้าจัดการผู้ใช้, ตั้งค่าระบบ และปุ่มออกจากระบบ */}
      <div className="admin-header">
        <h1 style={{ margin: 0 }}>📊 Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          
          <Link to="/admin/config">
            <button style={{ background: "#f39c12", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              ⚙️ ตั้งค่าระบบ
            </button>
          </Link>

          <Link to="/admin/users">
            <button style={{ background: "#2ecc71", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              👥 จัดการผู้ใช้
            </button>
          </Link>
          
          <button onClick={onLogout} style={{ background: "#e74c3c", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* ส่วนแสดง Card สถิติ */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👥 ผู้ใช้งานทั้งหมด</h3>
          <p className="stat-value">{stats.total_users}</p>
        </div>
        <div className="stat-card alert">
          <h3>⚠️ แจ้งเตือนทั้งหมด (วันนี้)</h3>
          <p className="stat-value">{stats.today_alerts}</p>
        </div>
        <div className="stat-card danger">
          <h3>🚨 หลับใน (วันนี้)</h3>
          <p className="stat-value">{stats.deep_sleep_today}</p>
        </div>
        <div className="stat-card">
          <h3>📁 ประวัติทั้งหมดในระบบ</h3>
          <p className="stat-value">{stats.total_logs}</p>
        </div>
      </div>

      {/* ส่วนตาราง Log */}
      <div className="admin-table-container">
        <h2 style={{ marginTop: 0 }}>ประวัติการแจ้งเตือนล่าสุด</h2>
        {loading ? <p>กำลังโหลดข้อมูล...</p> : (
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>เวลา (Timestamp)</th>
                        <th>รหัสผู้ใช้ (User ID)</th>
                        <th>เหตุการณ์ (Event)</th>
                        <th>ระยะเวลา (Duration)</th>
                        <th>ค่า EAR</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td>{new Date(log.timestamp).toLocaleString("th-TH")}</td>
                            <td style={{ fontWeight: "bold" }}>{log.user_id}</td>
                            <td>
                                <span style={{
                                    padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "white",
                                    backgroundColor: log.event_type === "deep_sleep" ? "#e74c3c" : "#f39c12"
                                }}>
                                    {log.event_type === "deep_sleep" ? "😴 หลับใน" : "🥱 ง่วง/วูบ"}
                                </span>
                            </td>
                            <td>{log.duration_ms} ms</td>
                            <td>{log.ear_value}</td>
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