import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../ChatWidget';

const THEMES = [
  { key: 'light', icon: '☀️', label: 'Pearl White' },
  { key: 'dark',  icon: '🌙', label: 'AG Dark' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menus, setMenus] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem('jbrain-theme') || 'light');

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jbrain-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        if (!token) return navigate('/login');

        const res = await axios.get('/api/v1/auth/menus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMenus(res.data);
        
        const initialExpanded = {};
        res.data.forEach(group => {
          initialExpanded[group.id] = true;
        });
        setExpandedGroups(initialExpanded);
      } catch (err) {
        console.error('메뉴 로드 실패:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('ai_access_token');
          navigate('/login');
        }
      }
    };
    fetchMenus();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('ai_access_token');
    navigate('/login');
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuIcons = {
    'icon-dashboard': '📊',
    'icon-folder': '📁',
    'icon-chat': '💬',
    'icon-settings': '⚙️',
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo-text">
            <span className="logo-symbol"></span>
            JWINPARTNERS
          </div>
          <select>
            <option>모든 시스템 관리 (System Admin)</option>
          </select>
        </div>
        <div className="header-right">
          <span style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--color-primary-glow)' }}>System Admin</span>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleLogout}>
            <div className="user-avatar">AD</div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-sub)' }}>로그아웃</span>
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className="lnb">
          {/* 스크롤 영역 */}
          <div className="lnb-scroll">
            {menus.map((group) => (
              <div key={group.id} className="lnb-group">
                <div className="lnb-group-title" onClick={() => toggleGroup(group.id)}>
                  <span>
                    {menuIcons[group.icon] || '▶️'} {group.title}
                  </span>
                  <span style={{ fontSize: '10px' }}>{expandedGroups[group.id] ? '▲' : '▼'}</span>
                </div>
                
                {expandedGroups[group.id] && group.children && group.children.length > 0 && (
                  <div className="lnb-sub">
                    {group.children.map((child) => (
                      <div 
                        key={child.id}
                        className={`lnb-item ${
                          location.pathname === child.url ||
                          (child.url && child.url !== '/admin' && location.pathname.startsWith(child.url + '/'))
                            ? 'active' : ''
                        }`}
                        onClick={() => navigate(child.url)}
                      >
                        {child.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 하단 테마 토글 */}
          <div className="lnb-theme-bar">
            <div className="lnb-theme-label">
              <span>🎨</span> 테마 설정
            </div>
            <div className="theme-toggle-wrap">
              {THEMES.map(t => (
                <button
                  key={t.key}
                  className={`theme-toggle-btn ${theme === t.key ? 'active' : ''}`}
                  onClick={() => setTheme(t.key)}
                  title={t.label}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="content">
          <Outlet />
        </div>
      </div>

      <footer className="footer">Copyright © 2026 JWP J-Brain. All rights reserved.</footer>
      
      <ChatWidget />
    </>
  );
};

export default AdminLayout;
