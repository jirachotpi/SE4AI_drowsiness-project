import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);

  // จำลองการดึงข้อมูล User ทั้งหมด (เดี๋ยวเราค่อยไปทำ API นี้ใน Backlog-10)
  // ตอนนี้ Hardcode ไว้ก่อนเพื่อให้เห็นภาพ
  useEffect(() => {
    setUsers([
      { id: 1, username: "driver01", status: "Active" },
      { id: 2, username: "driver02", status: "Drowsy" },
      { id: 3, username: user.username, status: "Admin (You)" },
    ]);
  }, [user]);

  return (
    <div style={{ padding: "20px", border: "2px solid #2196f3", borderRadius: "10px", backgroundColor: "#e3f2fd" }}>
      <h1 style={{ color: "#0d47a1" }}>👮‍♂️ Admin Dashboard</h1>
      <p>ยินดีต้อนรับผู้ดูแลระบบ: <strong>{user.username}</strong></p>
      
      <h3>รายชื่อผู้ใช้งานในระบบ (Mock Data)</h3>
      <table border="1" cellPadding="10" style={{ width: "100%", background: "white", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#ccc" }}>
            <th>Username</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.status}</td>
              <td>
                <button style={{ background: "red", color: "white", border: "none", cursor: "pointer" }}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button 
        onClick={onLogout} 
        style={{ marginTop: "20px", background: "#333", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
      >
        ออกจากระบบ Admin
      </button>
    </div>
  );
}

export default AdminDashboard;