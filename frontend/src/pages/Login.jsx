import { useState } from "react";
import axios from "axios";

// รับ props ชื่อ onLoginSuccess มาจาก App.jsx
function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login", formData);
      
      // ✅ ถ้าผ่าน: ส่งข้อมูล user กลับไปที่ App.jsx
      onLoginSuccess(response.data);
      
    } catch (error) {
      alert("❌ " + (error.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ"));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>เข้าสู่ระบบ (Driver Login)</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" name="username" placeholder="Username" onChange={handleChange} required 
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input 
          type="password" name="password" placeholder="Password" onChange={handleChange} required 
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ padding: "10px 20px", background: "green", color: "white", border: "none", width: "100%" }}>
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}

export default Login;