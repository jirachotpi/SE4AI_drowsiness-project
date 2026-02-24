// --- frontend/src/pages/UserManagement.jsx ---
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ฟังก์ชัน ระงับ/ปลดแบน บัญชี
  const handleToggleSuspend = async (userId, currentStatus) => {
    if (!window.confirm(`ต้องการ${currentStatus ? 'ปลดแบน' : 'ระงับ'}บัญชีนี้ใช่หรือไม่?`)) return;
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/users/${userId}/suspend`, {
        is_suspended: !currentStatus
      });
      fetchUsers(); // โหลดข้อมูลใหม่
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // ฟังก์ชัน ลบบัญชีถาวร
  const handleDelete = async (userId) => {
    if (!window.confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้ถาวร? (ประวัติทั้งหมดจะถูกลบด้วย)")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/admin/users/${userId}`);
      fetchUsers(); // โหลดข้อมูลใหม่
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบผู้ใช้งาน");
    }
  };

  // ระบบค้นหาจากชื่อ หรือ อีเมล
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 style={{ margin: 0 }}>👥 จัดการผู้ใช้งาน</h1>
        <Link to="/dashboard">
          <button style={{ background: "#3498db", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            ⬅️ กลับหน้าภาพรวม
          </button>
        </Link>
      </div>

      <div className="admin-table-container">
        {/* ช่องค้นหา */}
        <input 
          type="text" 
          placeholder="🔍 ค้นหาด้วยชื่อผู้ใช้ หรือ อีเมล..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" }}
        />

        <table className="admin-table">
          <thead>
            <tr>
              <th>ชื่อผู้ใช้ (Username)</th>
              <th>อีเมล (Email)</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: "bold" }}>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{ 
                    padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "white",
                    background: u.is_suspended ? "#e74c3c" : "#2ecc71" 
                  }}>
                    {u.is_suspended ? "🚫 ถูกระงับ" : "✅ ใช้งานปกติ"}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                    style={{ background: u.is_suspended ? "#f39c12" : "#e67e22", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", marginRight: "10px" }}
                  >
                    {u.is_suspended ? "ปลดแบน" : "ระงับบัญชี"}
                  </button>
                  <button 
                    onClick={() => handleDelete(u.id)}
                    style={{ background: "#c0392b", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}
                  >
                    ลบทิ้ง
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: "center", color: "#888" }}>ไม่พบข้อมูลผู้ใช้งาน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;