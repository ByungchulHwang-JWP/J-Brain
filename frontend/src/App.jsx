import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/Layout/AdminLayout';

// 기존 페이지 연동
import WorkspaceList from './pages/WorkspaceList';
import SourceList from './pages/SourceList';
import SourceNew from './pages/SourceNew';
import SourceDetail from './pages/SourceDetail';
import SourcePreview from './pages/SourcePreview';
import IndexJobList from './pages/IndexJobList';
import IndexJobNew from './pages/IndexJobNew';
import IndexJobDetail from './pages/IndexJobDetail';
import RetrievalTest from './pages/RetrievalTest';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import PromptList from './pages/PromptList';
import LogList from './pages/LogList';
import UserList from './pages/UserList';
import PermissionMap from './pages/PermissionMap';

// 향후 개발할 빈 페이지들 렌더링용 임시 컴포넌트
const Placeholder = ({ title }) => (
  <div className="inner">
    <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
      <h2 style={{ fontWeight: 600 }}>{title}</h2>
    </div>
    <div className="table-area" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
      준비 중인 화면입니다.
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* 대시보드 */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stats" element={<Stats />} />
        
        {/* 지식 관리 */}
        <Route path="workspaces" element={<WorkspaceList />} />
        <Route path="sources" element={<SourceList />} />
        <Route path="sources/new" element={<SourceNew />} />
        <Route path="sources/:id" element={<SourceDetail />} />
        <Route path="sources/:id/preview" element={<SourcePreview />} />
        
        {/* 인덱싱 작업 관리 */}
        <Route path="jobs" element={<IndexJobList />} />
        <Route path="jobs/new" element={<IndexJobNew />} />
        <Route path="jobs/:id" element={<IndexJobDetail />} />
        
        {/* 테스트/프롬프트 */}
        <Route path="prompt/test" element={<RetrievalTest />} />
        <Route path="prompt" element={<PromptList />} />
        <Route path="logs" element={<LogList />} />
        
        {/* 권한 관리 */}
        <Route path="users" element={<UserList />} />
        <Route path="permissions" element={<PermissionMap />} />
      </Route>
    </Routes>
  );
};

export default App;
