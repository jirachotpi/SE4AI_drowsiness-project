// --- frontend/src/pages/Dashboard.jsx ---
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

function Dashboard({ user }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [period, setPeriod] = useState("7d");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); 

  useEffect(() => {
    // ย้ายฟังก์ชันเข้ามาใน useEffect เพื่อป้องกันปัญหา Dependency ของ React
    const fetchStats = async () => {
      if (!user || !user.username) return;

      try {
        setLoading(true);
        setError(null);
        
        // ใช้ Environment Variable แทนการ Hardcode (มี Fallback เป็น localhost)
        const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
        
        // ใช้ params ของ axios เพื่อให้อ่านง่ายและจัดการ URL ได้ดีขึ้น
        const res = await axios.get(`${apiUrl}/api/logs/stats`, {
          params: {
            user_id: user.username,
            period: period,
            m: selectedMonth,
            y: currentYear
          }
        });
        setChartData(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("ไม่สามารถโหลดข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, period, selectedMonth, currentYear]); 

  const getButtonStyle = (currentPeriod) => ({
    padding: "10px 24px",
    margin: "0 8px",
    borderRadius: "8px",
    border: "1px solid",
    borderColor: period === currentPeriod ? "#2563eb" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    backgroundColor: period === currentPeriod ? "#eff6ff" : "#ffffff",
    color: period === currentPeriod ? "#1d4ed8" : "#4b5563",
    transition: "all 0.2s ease-in-out",
    boxShadow: period === currentPeriod ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none"
  });

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 20px", fontFamily: "sans-serif" }}>
      
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ color: "#111827", fontSize: "24px", fontWeight: "600", margin: "0 0 8px 0" }}>
          สถิติความง่วงของคุณ
        </h2>
        <p style={{ color: "#6b7280", margin: "0", fontSize: "14px" }}>
          ติดตามและวิเคราะห์พฤติกรรมการหลับในและอาการวูบของคุณ
        </p>
      </div>
      
      <div style={{ display: "flex", marginBottom: "24px", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <button style={getButtonStyle("7d")} onClick={() => setPeriod("7d")}>
          7 วันล่าสุด
        </button>
        <button style={getButtonStyle("month")} onClick={() => setPeriod("month")}>
          รายเดือน
        </button>
        <button style={getButtonStyle("year")} onClick={() => setPeriod("year")}>
          ภาพรวม 1 ปี
        </button>

        {period === "month" && (
          <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
            <span style={{ marginRight: "12px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>
              เลือกเดือน:
            </span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ 
                padding: "8px 16px", 
                borderRadius: "8px", 
                border: "1px solid #d1d5db", 
                fontSize: "14px", 
                backgroundColor: "white",
                color: "#111827",
                cursor: "pointer",
                outline: "none"
              }}
            >
              {[...Array(12).keys()].map(i => (
                <option key={i+1} value={i+1}>เดือนที่ {i+1}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div style={{ 
        backgroundColor: "#ffffff", 
        padding: "24px", 
        borderRadius: "12px", 
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        height: "450px",
        position: "relative"
      }}>
        {loading && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#6b7280" }}>
            กำลังโหลดข้อมูล...
          </div>
        )}

        {error && !loading && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#dc2626", backgroundColor: "#fef2f2", padding: "12px 24px", borderRadius: "8px", border: "1px solid #f87171" }}>
            {error}
          </div>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#6b7280" }}>
            ไม่มีข้อมูลในข่วงเวลานี้
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "#6b7280" }} 
                angle={period === "month" ? -45 : 0} 
                textAnchor={period === "month" ? "end" : "middle"}
                dy={period === "month" ? 15 : 10}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                cursor={{ fill: "#f3f4f6" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey="drowsy" name="วูบ (ครั้ง)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="deep_sleep" name="หลับใน (ครั้ง)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default Dashboard;