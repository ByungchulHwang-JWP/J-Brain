import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/Layout/AdminLayout';
import DeprecatedRouteRedirect from './components/common/DeprecatedRouteRedirect';
import { ProjectProvider } from './context/ProjectContext';

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
import WorkflowDashboard from './pages/WorkflowDashboard';
import WorkflowEntry from './pages/workflow/WorkflowEntry';
import ProjectSelectionDashboard from './pages/workflow/ProjectSelectionDashboard';
import WorkflowDashboardV2 from './pages/workflow/WorkflowDashboardV2';
import WorkflowStagePage from './pages/workflow/WorkflowStagePage';
import Stats from './pages/Stats';
import PromptList from './pages/PromptList';
import LogList from './pages/LogList';
import UserList from './pages/UserList';
import PermissionMap from './pages/PermissionMap';
import ShellPage from './components/common/ShellPage';
import IntentDetail from './pages/intent-factory/IntentDetail';
import CandidateReview from './pages/intent-factory/CandidateReview';
import IntentStudio from './pages/intent-factory/IntentStudio';
import PackLifecycleConsole from './pages/packs/PackLifecycleConsole';
import RuntimeSimulationConsole from './pages/runtime/RuntimeSimulationConsole';
import OperationsIntelligenceConsole from './pages/operations/OperationsIntelligenceConsole';
import KnowledgeCenter from './pages/knowledge/KnowledgeCenter';

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
    <ProjectProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', boxShadow: 'var(--color-shadow-lg)', borderRadius: '10px', fontSize: '14px' } }} />
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* 대시보드 */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workflow" element={<WorkflowEntry />} />
        <Route path="workflow/projects" element={<ProjectSelectionDashboard />} />
        <Route path="workflow/projects/:projectId" element={<WorkflowDashboardV2 />} />
        <Route path="workflow/projects/:projectId/discovery/candidates" element={<CandidateReview />} />
        <Route path="workflow/projects/:projectId/stages/:stageNo" element={<WorkflowStagePage />} />
        <Route path="workflow/:projectId" element={<WorkflowDashboardV2 />} />
        <Route path="workflow/:projectId/stages/:stageNo" element={<WorkflowStagePage />} />
        <Route path="workflow/legacy" element={<WorkflowDashboard />} />
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
        <Route path="knowledge" element={<KnowledgeCenter />} />
        <Route path="knowledge/sources" element={<DeprecatedRouteRedirect to="/admin/knowledge?tab=sources" />} />
        <Route path="knowledge/sources/new" element={<SourceNew />} />
        <Route path="knowledge/jobs" element={<DeprecatedRouteRedirect to="/admin/knowledge?tab=jobs" />} />
        <Route path="knowledge/search-test" element={<DeprecatedRouteRedirect to="/admin/knowledge?tab=search-test" />} />
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
        <Route path="intent-factory" element={<IntentStudio />} />
        <Route path="intent-factory/intents" element={<DeprecatedRouteRedirect to="/admin/intent-factory?tab=intents" />} />
        <Route path="intent-factory/intents/new" element={<IntentDetail mode="new" />} />
        <Route path="intent-factory/intents/:intentId" element={<IntentDetail mode="edit" />} />
        <Route path="intent-factory/entities" element={<DeprecatedRouteRedirect to="/admin/intent-factory?tab=entities" />} />
        <Route path="intent-factory/synonyms" element={<DeprecatedRouteRedirect to="/admin/intent-factory?tab=entities" />} />
        <Route path="intent-factory/faqs" element={<DeprecatedRouteRedirect to="/admin/intent-factory?tab=faqs" />} />
        <Route path="intent-factory/actions" element={<DeprecatedRouteRedirect to="/admin/intent-factory?tab=actions" />} />
        <Route path="intent-factory/llm-assist" element={<DeprecatedRouteRedirect to="/admin/intent-factory?tab=llm-assist" />} />
        <Route path="intent-factory/candidates/:projectId" element={<CandidateReview />} />

        {/* Pack 제작/배포 */}
        <Route path="packs" element={<PackLifecycleConsole />} />
        <Route path="packs/builder" element={<DeprecatedRouteRedirect to="/admin/packs?tab=build" />} />
        <Route path="packs/validation" element={<DeprecatedRouteRedirect to="/admin/packs?tab=validation" />} />
        <Route path="packs/repository" element={<DeprecatedRouteRedirect to="/admin/packs?tab=repository" />} />
        <Route path="packs/versions" element={<DeprecatedRouteRedirect to="/admin/packs?tab=repository" />} />
        <Route path="packs/deployment" element={<DeprecatedRouteRedirect to="/admin/packs?tab=repository" />} />

        {/* Runtime 테스트 */}
        <Route path="runtime" element={<RuntimeSimulationConsole />} />
        <Route path="runtime/qa" element={<DeprecatedRouteRedirect to="/admin/runtime?tab=chat" />} />
        <Route path="runtime/intent-match" element={<DeprecatedRouteRedirect to="/admin/runtime?tab=intent-match" />} />
        <Route path="runtime/action-test" element={<DeprecatedRouteRedirect to="/admin/runtime?tab=action-route" />} />
        <Route path="runtime/widget-preview" element={<DeprecatedRouteRedirect to="/admin/runtime?tab=widget-preview" />} />

        {/* 운영 및 개선 */}
        <Route path="operations" element={<OperationsIntelligenceConsole />} />
        <Route path="operations/realtime" element={<DeprecatedRouteRedirect to="/admin/operations?tab=realtime" />} />
        <Route path="operations/stats" element={<DeprecatedRouteRedirect to="/admin/operations?tab=metrics" />} />
        <Route path="operations/unanswered" element={<DeprecatedRouteRedirect to="/admin/operations?tab=unanswered" />} />
        <Route path="operations/improvement-requests" element={<DeprecatedRouteRedirect to="/admin/operations?tab=improvements" />} />
        <Route path="operations/pack-history" element={<DeprecatedRouteRedirect to="/admin/operations?tab=pack-history" />} />
        
        {/* 권한 관리 */}
        <Route path="users" element={<UserList />} />
        <Route path="permissions" element={<PermissionMap />} />
        <Route path="system/settings" element={<ShellPage title="시스템 설정" eyebrow="시스템 관리" description="플랫폼 공통 설정을 관리하는 화면입니다." />} />
      </Route>
    </Routes>
    </ProjectProvider>
  );
};

export default App;
