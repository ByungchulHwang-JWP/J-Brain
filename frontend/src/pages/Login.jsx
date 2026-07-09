import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { consumeAuthSessionMessage } from '../api/httpClient';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const LoginContent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const navigate = useNavigate();

  const isDevMode = import.meta.env.MODE === 'development' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // 저장된 테마 적용
  useEffect(() => {
    const saved = localStorage.getItem('jbrain-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    setSessionMessage(consumeAuthSessionMessage() || '');
  }, []);

  const handleMockLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/v1/auth/login/mock', {
        email,
        password: password || 'dummy_password'
      });
      
      const { access_token } = response.data;
      localStorage.setItem('ai_access_token', access_token);
      navigate('/admin/workflow');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || '로그인에 실패했습니다.';
      toast.error(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const response = await axios.post('/api/v1/auth/login/google', {
        token: token
      });
      
      const { access_token } = response.data;
      localStorage.setItem('ai_access_token', access_token);
      navigate('/admin/workflow');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || '구글 로그인에 실패했습니다.';
      toast.error(msg);
    }
  };

  const handleGoogleError = () => {
    toast.error('구글 로그인 호출에 실패했습니다.');
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--color-bg-base)',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--color-bg-surface)',
        width: '480px', borderRadius: '16px',
        padding: '60px 48px',
        boxShadow: 'var(--color-shadow-lg)',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="logo-text" style={{ justifyContent: 'center', marginBottom: '24px', fontSize: '24px' }}>
            <span className="logo-symbol" style={{ width: '28px', height: '28px' }}></span>
            JWINPARTNERS
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>
            지식 챗봇 관리자
          </h2>
          <p style={{ marginTop: '16px', fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            관리자 계정으로 로그인하여<br />J-Brain 시스템을 관리하세요.
          </p>
          {sessionMessage && (
            <div
              style={{
                marginTop: '18px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                color: '#9a3412',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {sessionMessage}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
            />
          </div>

          {isDevMode && (
            <>
              <div style={{ 
                display: 'flex', alignItems: 'center', 
                color: 'var(--color-text-muted)', fontSize: '14px', margin: '8px 0' 
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ padding: '0 12px' }}>또는 (Dev Only)</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <form onSubmit={handleMockLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="email" 
                  placeholder="테스트 이메일 주소" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: '52px', fontSize: '16px', borderRadius: '10px', width: '100%', marginTop: '8px' }}
                >
                  Mock 로그인
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
};

export default Login;
