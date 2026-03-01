// --- frontend/src/api.js ---
import axios from 'axios';

// 1. สร้าง Instance พื้นฐาน
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // ใส่ Base URL ของ Backend ที่นี่
});

// 2. Interceptor ขาไป (Request): ก่อนส่งคำขอทุกครั้ง ให้ดึง Token มาแปะ Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // ดึง JWT จาก LocalStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // แปะเข้า Header
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
      localStorage.removeItem('token'); // ลบทิ้ง
      localStorage.removeItem('user');  
      window.location.href = '/login';  // เด้งกลับไปหน้า Login
    }
    return Promise.reject(error);
  }
);

export default api;