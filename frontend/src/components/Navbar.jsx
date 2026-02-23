// --- frontend/src/components/Navbar.jsx ---
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout, status }) {
  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 30px', 
      backgroundColor: '#2c3e50', 
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      
      {/* โลโก้ด้านซ้าย */}
      <div>
        <h2 style={{ margin: 0 }}>
          <Link to={user ? "/dashboard" : "/"} style={{ color: 'white', textDecoration: 'none' }}>
            🚗 Drowsiness AI
          </Link>
        </h2>
        {/* ป้องกัน Error กรณี status ไม่มีค่า */}
        <small style={{ color: status?.includes("✅") ? '#2ecc71' : '#e74c3c' }}>
          {status || "✅ ระบบพร้อมใช้งาน"}
        </small>
      </div>

      {/* เมนูด้านขวา */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* เงื่อนไข: ถ้ายังไม่ล็อกอิน */}
        {!user ? (
          <>
            <Link to="/" style={linkStyle}>🏠 หน้าแรก</Link>
            <Link to="/login" style={linkStyle}>🔑 เข้าสู่ระบบ</Link>
            <Link to="/register" style={registerBtnStyle}>📝 สมัครสมาชิก</Link>
          </>
        ) : (
          /* เงื่อนไข: ถ้าล็อกอินแล้ว */
          <>
            <span style={{ color: '#f39c12', fontWeight: 'bold', marginRight: '10px' }}>
              👤 {user.username}
            </span>
            
            {/* [UPDATED] เพิ่มลิงก์หน้า Dashboard กราฟสถิติ และเปลี่ยน path กล้อง */}
            <Link to="/dashboard" style={linkStyle}>📊 สถิติภาพรวม</Link>
            <Link to="/camera" style={linkStyle}>🎥 กล้องตรวจจับ</Link>
            <Link to="/history" style={linkStyle}>📁 ประวัติของฉัน</Link>
            <Link to="/profile" style={linkStyle}>👤 ข้อมูลส่วนตัว</Link>
            
            <button onClick={onLogout} style={logoutBtnStyle}>
              🚪 ออกจากระบบ
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

// สไตล์ปุ่มและลิงก์ต่างๆ เพื่อความสวยงาม
const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '16px',
  transition: 'color 0.3s'
};

const registerBtnStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  textDecoration: 'none',
  padding: '8px 15px',
  borderRadius: '5px',
  fontWeight: 'bold'
};

const logoutBtnStyle = {
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  padding: '8px 15px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '16px'
};

export default Navbar;