// --- frontend/src/pages/Login.jsx ---
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false); // เพิ่มสถานะ Loading

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // เริ่มโหลด
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login", formData);
      
      // บันทึกข้อมูลลงเครื่อง
      localStorage.setItem('drowsiness_user', JSON.stringify(response.data));
      onLoginSuccess(response.data);
    } catch (error) {
      alert("❌ " + (error.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ"));
    } finally {
      setIsLoading(false); // จบการโหลด
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">เข้าสู่ระบบ (Login)</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" name="username" className="form-control" 
              placeholder="กรอกชื่อผู้ใช้" onChange={handleChange} required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" name="password" className="form-control" 
              placeholder="กรอกรหัสผ่าน" onChange={handleChange} required 
            />
          </div>
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
        <div className="auth-link">
          ยังไม่มีบัญชีใช่ไหม? <Link to="/register">สมัครสมาชิกที่นี่</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;