// --- frontend/src/pages/Dashboard.jsx ---
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

function Dashboard({ user }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [period, setPeriod] = useState("7d");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); 

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !user.username) return;
      
      try {
        setLoading(true);
        const res = await axios.get(`http://127.0.0.1:8000/api/logs/stats?user_id=${user.username}&period=${period}&m=${selectedMonth}&y=${currentYear}`);
        setChartData(res.data);
      } catch (err) {
        console.error("ไม่สามารถดึงข้อมูลสถิติได้:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, period, selectedMonth, currentYear]); 

  const getButtonStyle = (currentPeriod) => ({
    padding: "8px 24px",
    margin: "0 6px",
    borderRadius: "24px",
    border: period === currentPeriod ? "1px solid #2563eb" : "1px solid #e5e7eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    backgroundColor: period === currentPeriod ? "#2563eb" : "#f9fafb",
    color: period === currentPeriod ? "#ffffff" : "#4b5563",
    transition: "all 0.2s ease-in-out",
    boxShadow: period === currentPeriod ? "0 2px 4px rgba(37, 99, 235, 0.2)" : "none"
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "30px 20px", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", color: "#1f2937", marginBottom: "25px", fontWeight: "600" }}>
        สถิติความง่วงของคุณ
      </h2>
      
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <button style={getButtonStyle("7d")} onClick={() => setPeriod("7d")}>7 วันล่าสุด</button>
        <button style={getButtonStyle("month")} onClick={() => setPeriod("month")}>รายเดือน (1-12)</button>
        <button style={getButtonStyle("year")} onClick={() => setPeriod("year")}>ภาพรวม 1 ปี</button>
      </div>

      {period === "month" && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px", alignItems: "center" }}>
          <span style={{ marginRight: "12px", fontWeight: "500", color: "#374151", fontSize: "15px" }}>เลือกเดือน:</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "1px solid #d1d5db", 
              fontSize: "15px", 
              cursor: "pointer",
              color: "#1f2937",
              backgroundColor: "#ffffff",
              outline: "none"
            }}
          >
            {[...Array(12).keys()].map(i => (
              <option key={i+1} value={i+1}>เดือนที่ {i+1}</option>
            ))}
          </select>
        </div>
      )}
      
      <div style={{ 
        backgroundColor: "#ffffff", 
        padding: "25px", 
        borderRadius: "16px", 
        border: "1px solid #f3f4f6",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        height: "450px"
      }}>
        {loading ? (
           <div style={{ textAlign: "center", paddingTop: "150px", color: "#6b7280", fontSize: "15px" }}>
             กำลังโหลดข้อมูลกราฟ...
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "#6b7280" }} 
                angle={period === "month" ? -45 : 0} 
                textAnchor={period === "month" ? "end" : "middle"} 
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={false}
                dy={period === "month" ? 10 : 5}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }} 
                cursor={{ fill: "#f9fafb" }}
              />
              <Legend wrapperStyle={{ paddingTop: "15px" }} />
              
              {/* แก้ไขให้รองรับ 3 สถานะ และปรับสี/ชื่อให้ตรงกับหน้า History */}
              <Bar dataKey="drowsy" name="เริ่มวูบ" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="deep_sleep" name="หลับใน" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="staring" name="หลับใน (ตาค้าง)" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default Dashboard;