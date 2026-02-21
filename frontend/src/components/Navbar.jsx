// --- frontend/src/components/Navbar.jsx ---
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, status }) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        onLogout();
        navigate('/'); // ล็อกเอาท์แล้วกลับหน้าแรก
    };

    return (
        <nav style={{ padding: '15px 30px', background: '#1a1a1a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #3498db' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>🚗 SE4AI</Link>
                <span style={{ fontSize: '0.8rem', color: '#888', background: '#333', padding: '3px 8px', borderRadius: '10px' }}>{status}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {!user ? (
                    <>
                        <Link to="/login" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Login</Link>
                        <Link to="/register" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Register</Link>
                    </>
                ) : (
                    <>
                        <span style={{ color: '#2ecc71' }}>👤 {user.username} ({user.role})</span>
                        <Link to="/dashboard" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Dashboard</Link>
                        <button onClick={handleLogoutClick} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '5px' }}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
export default Navbar;