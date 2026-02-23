// --- frontend/src/pages/History.jsx ---
import React, { useState, useEffect } from "react";
import axios from "axios";

function History({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.username) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // เปลี่ยนไปส่ง query เป็น user_id ตามชื่อใน Backend
      const res = await axios.get(`http://127.0.0.1:8000/api/logs?user_id=${user.username}`);
      setLogs(res.data);
      setError(null);
    } catch (err) {
      setError("ไม่สามารถดึงข้อมูลประวัติได้ หรือยังไม่มีข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // แมปคำและสีให้ตรงกับ event_type ใน Database ("drowsy" หรือ "deep_sleep")
  const getEventBadgeStyle = (event_type) => {
    switch (event_type) {
      case "deep_sleep":
        return { text: "หลับใน (Deep Sleep)", style: { backgroundColor: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" } };
      case "drowsy":
        return { text: "วูบ (Drowsy)", style: { backgroundColor: "#fff3e0", color: "#ef6c00", border: "1px solid #ffcc80" } };
      default:
        return { text: event_type || "ไม่ทราบ", style: { backgroundColor: "#f5f5f5", color: "#616161", border: "1px solid #e0e0e0" } };
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "50px" }}>กำลังโหลดประวัติ...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", backgroundColor: "white", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", color: "#2c3e50" }}>📁 ประวัติการง่วงนอนของคุณ</h2>

      {error && <div style={{ color: "#c62828", textAlign: "center", marginBottom: "15px" }}>⚠️ {error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#7f8c8d" }}>พบข้อมูลทั้งหมด {logs.length} รายการ</p>
        <button 
          onClick={toggleSortOrder}
          style={{ padding: "8px 15px", backgroundColor: "#34495e", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          ⏱️ เรียงวันที่: {sortOrder === "desc" ? "ใหม่ไปเก่า ⬇️" : "เก่าไปใหม่ ⬆️"}
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2", color: "#333" }}>
            <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>วันที่ - เวลา</th>
            <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>เหตุการณ์</th>
            <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>ระยะเวลา (วินาที)</th>
            <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>ค่า EAR</th>
          </tr>
        </thead>
        <tbody>
          {sortedLogs.length > 0 ? (
            sortedLogs.map((log) => {
              const badge = getEventBadgeStyle(log.event_type);
              return (
                <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>
                    {new Date(log.timestamp).toLocaleString("th-TH")}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ 
                      padding: "5px 10px", 
                      borderRadius: "20px", 
                      fontWeight: "bold",
                      fontSize: "14px",
                      ...badge.style 
                    }}>
                      {badge.text}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    {log.duration_ms ? (log.duration_ms / 1000).toFixed(1) + " s" : "-"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {log.ear_value ? log.ear_value.toFixed(2) : "-"}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}>
                ไม่มีประวัติการง่วงนอน (ยอดเยี่ยมมาก!)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default History;