// --- frontend/src/pages/Welcome.jsx ---
import { Link } from 'react-router-dom';

function Welcome() {
    return (
        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h1 style={{ fontSize: '3rem', color: '#2c3e50' }}>SE4AI Drowsiness Detection</h1>
            <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
                ระบบ AI ตรวจจับความง่วงและหลับใน เพื่อความปลอดภัยในการขับขี่ของคุณ
            </p>
            <div style={{ marginTop: '30px' }}>
                <Link to="/login">
                    <button style={{ padding: '15px 30px', fontSize: '1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '15px' }}>
                        เข้าสู่ระบบ
                    </button>
                </Link>
                <Link to="/register">
                    <button style={{ padding: '15px 30px', fontSize: '1rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        สมัครสมาชิก
                    </button>
                </Link>
            </div>
        </div>
    );
}
export default Welcome;