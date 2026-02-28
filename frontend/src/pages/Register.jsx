// --- frontend/src/pages/Register.jsx ---
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  // 1. เพิ่มฟิลด์ใหม่ใน State (department, phone, age, gender)
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    password: "",
    department: "", 
    phone: "", 
    age: "", 
    gender: "" 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      // ส่ง formData ทั้งหมดไปยัง Backend
      const response = await axios.post("http://127.0.0.1:8000/api/register", formData);
      alert("ลงทะเบียนสำเร็จ: " + response.data.message); 
      navigate("/login");
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "เกิดข้อผิดพลาดในการลงทะเบียน โปรดลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ 
        backgroundImage: "url('/os-x-mountain-lion-3840x2160-24076.jpg')",
        width: "100vw",
        minHeight: "calc(100vh - 60px)", 
        marginLeft: "calc(-50vw + 50%)", 
        marginTop: "-2rem", 
        marginBottom: "-2rem" 
      }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>

      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        
        {/* ฝั่งซ้าย - รูปภาพประกอบ */}
        <div className="hidden md:block relative">
          <img src="/Gemini_Generated_Image_.png" alt="Register Background" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          <div className="absolute bottom-12 left-10 text-white pr-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-3 drop-shadow-md">เข้าร่วมกับเรา</h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              ยกระดับความปลอดภัยในการเดินทางของคุณ <br/>ด้วยระบบผู้ช่วยวิเคราะห์และตรวจจับความง่วงอัจฉริยะ
            </p>
          </div>
        </div>

        {/* ฝั่งขวา - ฟอร์มสมัครสมาชิก */}
        <div className="p-8 md:p-12 bg-white flex flex-col justify-center relative">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">สร้างบัญชีใหม่</h2>
            <p className="text-slate-500 font-medium">กรุณากรอกข้อมูลเพื่อลงทะเบียนเข้าสู่ระบบ</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-3 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อผู้ใช้งาน</label>
                <input name="username" type="text" required onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="Username" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label>
                <input name="email" type="email" required onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="mail@example.com" />
              </div>
            </div>

            {/* แผนก & เบอร์โทร (เพิ่มใหม่) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">แผนก/ฝ่าย</label>
                <input name="department" type="text" onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="เช่น ไอที, ขนส่ง" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input name="phone" type="tel" onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="08XXXXXXXX" />
              </div>
            </div>

            {/* อายุ & เพศ (เพิ่มใหม่) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">อายุ</label>
                <input name="age" type="number" onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="ปี" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">เพศ</label>
                <select name="gender" onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="">ระบุเพศ</option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
              <input name="password" type="password" required onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="อย่างน้อย 6 ตัวอักษร" />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-white font-bold text-lg shadow-lg transition-all disabled:opacity-70 mt-4"
            >
              {isLoading ? "กำลังดำเนินการ..." : "ยืนยันการลงทะเบียน"}
            </button>
          </form>

          <p className="text-slate-500 mt-8 text-center font-medium">
            มีบัญชีผู้ใช้งานอยู่แล้วใช่หรือไม่?{" "}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;