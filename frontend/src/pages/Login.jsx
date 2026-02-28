// --- frontend/src/pages/Login.jsx ---
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // 💡 อย่าลืมเรียกใช้ useNavigate
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
      const response = await axios.post("http://127.0.0.1:8000/api/login", formData);
      localStorage.setItem("drowsiness_user", JSON.stringify(response.data));
      onLoginSuccess(response.data);
      
      // 💡 [NEW] ตรวจสอบ Role เพื่อพาไปหน้าที่ถูกต้อง
      if (response.data.role === "admin") {
        navigate("/dashboard"); // ถ้าเป็นแอดมิน ไปหน้าแดชบอร์ด
      } else {
        navigate("/camera"); // ถ้าเป็นคนขับรถ (user) ไปหน้ากล้อง
      }

    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-cover bg-center bg-no-repeat overflow-hidden"
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
          <img src="/Facial-recognition-technology1-2-1.jpg" alt="Login Background" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          <div className="absolute bottom-12 left-10 text-white pr-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-3 drop-shadow-md">SE4AI Drowsiness</h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              ระบบผู้ช่วยอัจฉริยะตรวจจับความง่วงแบบเรียลไทม์ <br/>เข้าสู่ระบบเพื่อเริ่มต้นการทำงานและดูสถิติการขับขี่ของคุณ
            </p>
          </div>
        </div>

        {/* ฝั่งขวา - ฟอร์มเข้าสู่ระบบ */}
        <div className="p-10 md:p-14 bg-white flex flex-col justify-center relative">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">ยินดีต้อนรับกลับเข้าสู่ระบบ</h2>
            <p className="text-slate-500 font-medium">โปรดกรอกข้อมูลของท่านเพื่อดำเนินการต่อ</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-3 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <input
                  name="username"
                  type="text"
                  required
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  placeholder="กรอกชื่อผู้ใช้งานของท่าน"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสผ่าน (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  placeholder="กรอกรหัสผ่านของท่าน"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-white font-bold text-lg shadow-lg hover:shadow-blue-600/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? "กำลังดำเนินการ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="text-slate-500 mt-10 text-center font-medium">
            ยังไม่มีบัญชีผู้ใช้งาน?{" "}
            <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 underline-offset-4 hover:underline transition-all">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;