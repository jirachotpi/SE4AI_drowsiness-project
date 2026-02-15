import { useState } from "react";
import axios from "axios";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ยิงข้อมูลไปหา Backend ที่เราทำไว้
      const response = await axios.post("http://127.0.0.1:8000/api/register", formData);
      alert("✅ สมัครสมาชิกสำเร็จ: " + response.data.message);
    } catch (error) {
      // ถ้า Error (เช่น ชื่อซ้ำ หรือรหัสสั้นไป)
      alert("❌ เกิดข้อผิดพลาด: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>สมัครสมาชิก (Driver Register)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Username:</label><br/>
          <input 
            type="text" 
            name="username" 
            onChange={handleChange} 
            required 
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Email:</label><br/>
          <input 
            type="email" 
            name="email" 
            onChange={handleChange} 
            required 
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Password:</label><br/>
          <input 
            type="password" 
            name="password" 
            onChange={handleChange} 
            required 
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px", background: "blue", color: "white", border: "none" }}>
          ยืนยันการสมัคร
        </button>
      </form>
    </div>
  );
}

export default Register;