// --- frontend/src/api.js ---
import axios from 'axios';

// 1. สร้าง Instance พื้นฐาน (รองรับทั้ง Local และ Vercel)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`, 
});

// 2. Interceptor ขาไป (Request): ก่อนส่งคำขอทุกครั้ง ให้ดึง Token มาแปะ Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; 
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Interceptor ขากลับ (Response): เช็คว่าถ้าโดนเตะ (401 Unauthorized) ให้ล้างค่าและเด้งไปหน้า Login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token หมดอายุหรือไม่ถูกต้อง บังคับออกจากระบบ");
      localStorage.removeItem('token'); 
      localStorage.removeItem('user');  
      window.location.href = '/login';  
    }
    return Promise.reject(error);
  }
);

export default api;