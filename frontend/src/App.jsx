import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/Layout/AdminLayout';

// 기존 페이지 연동
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import SourceList from './pages/SourceList';
import SourceNew from './pages/SourceNew';
import SourceDetail from './pages/SourceDetail';
import SourcePreview from './pages/SourcePreview';
import IndexJobList from './pages/IndexJobList';
import IndexJobNew from './pages/IndexJobNew';
import IndexJobDetail from './pages/IndexJobDetail';
import RetrievalTest from './pages/RetrievalTest';
import ProjectQA from './pages/ProjectQA';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import PromptList from './pages/PromptList';
import LogList from './pages/LogList';
import UserList from './pages/UserList';
import PermissionMap from './pages/PermissionMap';
import ShellPage from './components/common/ShellPage';
import IntentList from './pages/intent-factory/IntentList';
import IntentDetail from './pages/intent-factory/IntentDetail';
import EntityList from './pages/intent-factory/EntityList';
import FaqList from './pages/intent-factory/FaqList';
import ActionList from './pages/intent-factory/ActionList';
import LlmAssist from './pages/intent-factory/LlmAssist';
import PackBuilder from './pages/packs/PackBuilder';
import PackValidation from './pages/packs/PackValidation';
import PackRepository from './pages/packs/PackRepository';
import PackVersions from './pages/packs/PackVersions';
import PackDeployment from './pages/packs/PackDeployment';
import ActionTest from './pages/runtime/ActionTest';
import WidgetPreview from './pages/runtime/WidgetPreview';
import RealtimeMonitoring from './pages/operations/RealtimeMonitoring';
import UnansweredAnalysis from './pages/operations/UnansweredAnalysis';
import ImprovementRequests from './pages/operations/ImprovementRequests';
import PackImprovementHistory from './pages/operations/PackImprovementHistory';

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
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ShellPage title="프로젝트 등록" eyebrow="프로젝트 준비" description="신규 고객 프로젝트와 서비스 식별자를 등록하는 화면입니다." />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="project-settings/service" element={<ShellPage title="고객사/서비스 정보" eyebrow="프로젝트 준비" description="고객사, 서비스, 폐쇄망 배포 환경 정보를 관리하는 화면입니다." />} />
        <Route path="project-settings/integration-map" element={<ShellPage title="메뉴/화면/API 정보 관리" eyebrow="프로젝트 준비" description="챗봇 Action과 연결할 고객 시스템 메뉴, 화면, API 정보를 관리하는 화면입니다." />} />
        <Route path="sources" element={<SourceList />} />
        <Route path="sources/new" element={<SourceNew />} />
        <Route path="sources/:id" element={<SourceDetail />} />
        <Route path="sources/:id/preview" element={<SourcePreview />} />
        <Route path="knowledge/sources" element={<SourceList />} />
        <Route path="knowledge/sources/new" element={<SourceNew />} />
        <Route path="knowledge/jobs" element={<IndexJobList />} />
        <Route path="knowledge/search-test" element={<RetrievalTest />} />
        <Route path="knowledge/preview" element={<ShellPage title="문서 Preview" eyebrow="지식 자료 관리" description="Source 상세 화면에서 문서 Chunk, Entity, Relation, Evidence Preview를 확인합니다." />} />
        
        {/* 인덱싱 작업 관리 */}
        <Route path="jobs" element={<IndexJobList />} />
        <Route path="jobs/new" element={<IndexJobNew />} />
        <Route path="projects/:projectId/jobs/:jobId" element={<IndexJobDetail />} />
        
        {/* 테스트/프롬프트 */}
        <Route path="prompt/test" element={<RetrievalTest />} />
        <Route path="qa" element={<ProjectQA />} />
        <Route path="projects/:id/qa" element={<ProjectQA />} />
        <Route path="prompt" element={<PromptList />} />
        <Route path="logs" element={<LogList />} />

        {/* Intent Factory */}
        <Route path="intent-factory/intents" element={<IntentList />} />
        <Route path="intent-factory/intents/new" element={<IntentDetail mode="new" />} />
        <Route path="intent-factory/intents/:intentId" element={<IntentDetail mode="edit" />} />
        <Route path="intent-factory/entities" element={<EntityList />} />
        <Route path="intent-factory/synonyms" element={<EntityList mode="synonyms" />} />
        <Route path="intent-factory/faqs" element={<FaqList />} />
        <Route path="intent-factory/actions" element={<ActionList />} />
        <Route path="intent-factory/llm-assist" element={<LlmAssist />} />

        {/* Pack 제작/배포 */}
        <Route path="packs/builder" element={<PackBuilder />} />
        <Route path="packs/validation" element={<PackValidation />} />
        <Route path="packs/repository" element={<PackRepository />} />
        <Route path="packs/versions" element={<PackVersions />} />
        <Route path="packs/deployment" element={<PackDeployment />} />

        {/* Runtime 테스트 */}
        <Route path="runtime/qa" element={<ProjectQA />} />
        <Route path="runtime/intent-match" element={<RetrievalTest />} />
        <Route path="runtime/action-test" element={<ActionTest />} />
        <Route path="runtime/widget-preview" element={<WidgetPreview />} />

        {/* 운영 및 개선 */}
        <Route path="operations/realtime" element={<RealtimeMonitoring />} />
        <Route path="operations/stats" element={<Stats />} />
        <Route path="operations/unanswered" element={<UnansweredAnalysis />} />
        <Route path="operations/improvement-requests" element={<ImprovementRequests />} />
        <Route path="operations/pack-history" element={<PackImprovementHistory />} />
        
        {/* 권한 관리 */}
        <Route path="users" element={<UserList />} />
        <Route path="permissions" element={<PermissionMap />} />
        <Route path="system/settings" element={<ShellPage title="시스템 설정" eyebrow="시스템 관리" description="플랫폼 공통 설정을 관리하는 화면입니다." />} />
      </Route>
    </Routes>
  );
};

export default App;
