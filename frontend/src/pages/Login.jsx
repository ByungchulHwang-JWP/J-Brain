import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/v1/auth/login/mock', {
        email,
        password: password || 'dummy_password'
      });
      
      const { access_token } = response.data;
      localStorage.setItem('ai_access_token', access_token);
      alert('Mock 로그인 성공!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      alert('로그인에 실패했습니다. (dev환경: 아무 이메일이나 입력하세요)');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', width: '480px', borderRadius: '16px', padding: '60px 48px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ background: '#031B4B', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontSize: '20px', fontWeight: 800, display: 'inline-block', marginBottom: '16px' }}>J-Brain</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1d1d1d' }}>제이윈파트너스 지식 챗봇 관리자</h2>
          <p style={{ marginTop: '12px', fontSize: '15px', color: '#808080', lineHeight: 1.5 }}>사내 구글 계정으로 로그인하여<br/>J-Brain 지식 챗봇 시스템을 관리하세요.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="이메일 주소 (예: admin@example.com)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
          />
          <button type="submit" style={{ height: '52px', background: '#031B4B', color: '#fff', borderRadius: '8px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            로그인 (Mock)
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
