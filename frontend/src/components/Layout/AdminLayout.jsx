import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../ChatWidget';

const THEMES = [
  { key: 'light', icon: '☀️', label: 'Pearl White' },
  { key: 'dark',  icon: '🌙', label: 'AG Dark' },
];

const WORKFLOW_PHASE_MENUS = [
  { id: 'workflow-phase-1', title: '1. 프로젝트 준비', url: '/admin/workflow/projects/:projectId/stages/1' },
  { id: 'workflow-phase-2', title: '2. 지식 준비', url: '/admin/workflow/projects/:projectId/stages/2' },
  { id: 'workflow-phase-3', title: '3. 의도 설계', url: '/admin/workflow/projects/:projectId/stages/3' },
  { id: 'workflow-phase-4', title: '4. 실행 연결', url: '/admin/workflow/projects/:projectId/stages/4' },
  { id: 'workflow-phase-5', title: '5. Pack 검증/빌드', url: '/admin/workflow/projects/:projectId/stages/5' },
  { id: 'workflow-phase-6', title: '6. 배포 및 운영 개선', url: '/admin/workflow/projects/:projectId/stages/6' },
];

const normalizeWorkflowMenus = (menuGroups = []) => menuGroups.map((group) => {
  if (group.title !== '구축 워크플로우') return group;

  const dashboard = (group.children || []).find((child) => child.url === '/admin/workflow') || {
    id: 'workflow-dashboard',
    title: '워크플로우 대시보드',
    url: '/admin/workflow',
  };

  return {
    ...group,
    title: '구축 워크플로우',
    children: [dashboard, ...WORKFLOW_PHASE_MENUS],
  };
});

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef(null);
  const [menus, setMenus] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem('jbrain-theme') || 'light');

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jbrain-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    mainContentRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        if (!token) return navigate('/login');

        const res = await axios.get('/api/v1/auth/menus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMenus(normalizeWorkflowMenus(res.data));
        
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

  const currentWorkflowProjectId = () => localStorage.getItem('jbrain-workflow-project-id') || '';

  const resolveMenuUrl = (url) => {
    if (!url) return url;
    if (url.includes(':projectId') && !currentWorkflowProjectId()) {
      return '/admin/workflow/projects';
    }
    return url.replace(':projectId', encodeURIComponent(currentWorkflowProjectId()));
  };

  const isMenuActive = (url) => {
    const resolvedUrl = resolveMenuUrl(url);
    if (!resolvedUrl) return false;
    if (location.pathname === resolvedUrl) return true;
    if (url.includes(':projectId')) {
      const pattern = url
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(':projectId', '[^/]+');
      return new RegExp(`^${pattern}(/.*)?$`).test(location.pathname);
    }
    return resolvedUrl !== '/admin' && location.pathname.startsWith(resolvedUrl + '/');
  };

  const handleMenuClick = (url) => {
    const resolvedUrl = resolveMenuUrl(url);
    if (resolvedUrl) navigate(resolvedUrl);
  };

  const menuIcons = {
    'icon-dashboard': '📊',
    'icon-project': '🧭',
    'icon-knowledge': '📚',
    'icon-intent': '🧠',
    'icon-pack': '📦',
    'icon-runtime': '💬',
    'icon-operations': '📈',
    'icon-folder': '📁',
    'icon-chat': '💬',
    'icon-settings': '⚙️',
    'icon-workflow': '🧭',
    'icon-system': '⚙️',
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
                          isMenuActive(child.url) ? 'active' : ''
                        }`}
                        onClick={() => handleMenuClick(child.url)}
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

        <div className="content" ref={mainContentRef}>
          <Outlet />
        </div>
      </div>

      <footer className="footer">Copyright © 2026 JWP J-Brain. All rights reserved.</footer>
      
      <ChatWidget />
    </>
  );
};

export default AdminLayout;
