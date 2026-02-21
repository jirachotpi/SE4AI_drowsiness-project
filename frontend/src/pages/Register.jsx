// --- frontend/src/pages/Register.jsx ---
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";

function Register() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/register", formData);
      alert("✅ สมัครสมาชิกสำเร็จ: " + response.data.message);
      navigate("/login"); // สมัครเสร็จให้เด้งไปหน้า Login อัตโนมัติ
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">สมัครสมาชิก (Register)</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" name="username" className="form-control" 
              placeholder="ตั้งชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร)" onChange={handleChange} required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" name="email" className="form-control" 
              placeholder="กรอกอีเมลของคุณ" onChange={handleChange} required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" name="password" className="form-control" 
              placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" onChange={handleChange} required 
            />
          </div>
          <button type="submit" className="btn-submit" style={{ backgroundColor: "#2ecc71" }}>
            ยืนยันการสมัคร
          </button>
        </form>
        <div className="auth-link">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบที่นี่</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;