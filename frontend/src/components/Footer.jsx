import React from 'react';

function Footer() {
  return (
    <footer style={{ 
      textAlign: 'center', 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      color: '#6c757d', 
      borderTop: '1px solid #dee2e6',
      marginTop: 'auto' 
    }}>
      <p style={{ margin: 0, fontSize: '14px' }}>
        © {new Date().getFullYear()} Driver Drowsiness Detection System. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;