// --- frontend/src/pages/Profile.jsx ---
import React, { useState, useEffect } from "react";
import axios from "axios";

function Profile({ user }) {
  const [profileData, setProfileData] = useState({ username: "", email: "", role: "" });
  const [formData, setFormData] = useState({ email: "", currentPassword: "", newPassword: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ย้ายฟังก์ชันมาไว้ใน useEffect เพื่อป้องกัน Error จาก React Hooks
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/users/me?username=${user.username}`);
        setProfileData(res.data);
        setFormData({ email: res.data.email || "", currentPassword: "", newPassword: "" });
        setLoading(false);
      } catch (err) {
        setMessage({ text: "❌ ไม่สามารถดึงข้อมูลได้", type: "error" });
        setLoading(false);
      }
    };

    if (user && user.username) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "กำลังบันทึก...", type: "info" });

    try {
      const payload = {
        username: user.username,
        email: formData.email,
        current_password: formData.currentPassword || null,
        new_password: formData.newPassword || null
      };

      const res = await axios.put("http://127.0.0.1:8000/api/users/me", payload);
      setMessage({ text: `✅ ${res.data.message}`, type: "success" });
      setIsEditing(false);
      
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      
      // ดึงข้อมูลใหม่หลังจากบันทึกสำเร็จ
      const updatedRes = await axios.get(`http://127.0.0.1:8000/api/users/me?username=${user.username}`);
      setProfileData(updatedRes.data);
      
    } catch (err) {
      setMessage({ 
        text: `❌ ${err.response?.data?.detail || "เกิดข้อผิดพลาดในการบันทึก"}`, 
        type: "error" 
      });
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "50px" }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", backgroundColor: "white", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", color: "#2c3e50" }}>👤 ข้อมูลส่วนตัว (Profile)</h2>

      {message.text && (
        <div style={{ padding: "10px", marginBottom: "20px", borderRadius: "5px", textAlign: "center",
          backgroundColor: message.type === "error" ? "#f8d7da" : message.type === "success" ? "#d4edda" : "#e2e3e5",
          color: message.type === "error" ? "#721c24" : message.type === "success" ? "#155724" : "#383d41"
        }}>
          {message.text}
        </div>
      )}

      {!isEditing ? (
        <div style={{ fontSize: "16px", lineHeight: "2" }}>
          <p><strong>ชื่อผู้ใช้:</strong> {profileData.username}</p>
          <p><strong>อีเมล:</strong> {profileData.email || "ยังไม่ได้ระบุ"}</p>
          <p><strong>สิทธิ์การใช้งาน:</strong> {profileData.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "ผู้ขับขี่ (Driver)"}</p>
          
          <button 
            onClick={() => setIsEditing(true)} 
            style={{ width: "100%", padding: "12px", marginTop: "20px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
            ✏️ แก้ไขข้อมูล / เปลี่ยนรหัสผ่าน
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ fontWeight: "bold" }}>อีเมล:</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
          </div>

          <div style={{ borderTop: "1px solid #eee", paddingTop: "15px", marginTop: "5px" }}>
            <p style={{ margin: "0 0 10px 0", color: "#7f8c8d", fontSize: "14px" }}>* หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้</p>
            <label style={{ fontWeight: "bold" }}>รหัสผ่านปัจจุบัน:</label>
            <input 
              type="password" 
              name="currentPassword" 
              value={formData.currentPassword} 
              onChange={handleChange} 
              placeholder="รหัสผ่านเดิม"
              style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
          </div>

          <div>
            <label style={{ fontWeight: "bold" }}>รหัสผ่านใหม่:</label>
            <input 
              type="password" 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={handleChange} 
              placeholder="รหัสผ่านใหม่"
              style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" style={{ flex: 1, padding: "12px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
              💾 บันทึก
            </button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: "12px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
              ❌ ยกเลิก
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;