import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menus, setMenus] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        if (!token) return navigate('/login');

        const res = await axios.get('/api/v1/auth/menus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMenus(res.data);
        
        // 초기 확장 상태 (기본적으로 모두 열어둠)
        const initialExpanded = {};
        res.data.forEach(group => {
          initialExpanded[group.id] = true;
        });
        setExpandedGroups(initialExpanded);
      } catch (err) {
        console.error('메뉴 로드 실패:', err);
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
          <div className="logo-icon">J-Brain</div>
          <select style={{ border: 'none', outline: 'none', fontSize: '14px', fontWeight: 400, color: '#1d1d1d', cursor: 'pointer', background: 'transparent' }}>
            <option>모든 시스템 관리 (System Admin)</option>
          </select>
        </div>
        <div className="header-right">
          <span style={{ background: '#EEF4FF', color: '#3069B3', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>System Admin</span>
          <span>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleLogout}>
            <div className="user-avatar">AD</div>
            <span style={{ fontSize: '13px', fontWeight: 400 }}>로그아웃</span>
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className="lnb">
          {menus.map((group) => (
            <div key={group.id} className="lnb-group">
              <div className="lnb-group-title" onClick={() => toggleGroup(group.id)}>
                <span>
                  {menuIcons[group.icon] || '▶️'} {group.title}
                </span>
                <span>{expandedGroups[group.id] ? '∧' : '∨'}</span>
              </div>
              
              {expandedGroups[group.id] && group.children && group.children.length > 0 && (
                <div className="lnb-sub">
                  {group.children.map((child) => (
                    <div 
                      key={child.id}
                      className={`lnb-item ${location.pathname.startsWith(child.url) ? 'active' : ''}`}
                      onClick={() => navigate(child.url)}
                    >
                      {child.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="content">
          <Outlet />
        </div>
      </div>

      <footer className="footer">Copyright © 2026 JWP J-Brain. All rights reserved.</footer>
    </>
  );
};

export default AdminLayout;
