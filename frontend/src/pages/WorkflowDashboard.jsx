import { Spinner } from '../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useProjects from '../hooks/useProjects';
import { getPackDraft, listEntities, listIntents } from '../api/intentFactory';

const cardStyle = {
  padding: '20px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-panel-bg)',
  boxShadow: 'var(--shadow-sm)',
};

const fieldStyle = {
  minWidth: '240px',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
};

const statusStyle = {
  done: { label: '완료', className: 'active' },
  attention: { label: '확인 필요', className: 'warning' },
  pending: { label: '미완료', className: 'inactive' },
};

const WorkflowDashboard = () => {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary] = useState({
    sourceCount: 0,
    intentCount: 0,
    entityCount: 0,
    packDraftReady: false,
    packCounts: {},
  });
  const [loading, setLoading] = useState(false);

  const token = () => localStorage.getItem('ai_access_token');

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  useEffect(() => {
    if (!projectId) return;

    const fetchSummary = async () => {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token()}` };

      const [sourcesResult, intentsResult, entitiesResult, packResult] = await Promise.allSettled([
        axios.get(`/api/v1/projects/${projectId}/sources`, { headers }),
        listIntents(projectId),
        listEntities(projectId),
        getPackDraft(projectId),
      ]);

      const sourceCount = sourcesResult.status === 'fulfilled' ? (sourcesResult.value.data || []).length : 0;
      const intentItems = intentsResult.status === 'fulfilled' ? intentsResult.value.items || [] : [];
      const entityItems = entitiesResult.status === 'fulfilled' ? entitiesResult.value.items || [] : [];
      const packDraft = packResult.status === 'fulfilled' ? packResult.value : null;

      setSummary({
        sourceCount,
        intentCount: intentItems.length,
        entityCount: entityItems.length,
        packDraftReady: Boolean(packDraft?.counts?.intents),
        packCounts: packDraft?.counts || {},
      });
      setLoading(false);
    };

    fetchSummary();
  }, [projectId]);

  const steps = useMemo(() => {
    const hasProject = projects.length > 0;
    const hasSources = summary.sourceCount > 0;
    const hasIntents = summary.intentCount > 0;
    const hasEntities = summary.entityCount > 0;
    const hasPackDraft = summary.packDraftReady;

    return [
      {
        no: '01',
        title: '프로젝트 준비',
        status: hasProject ? 'done' : 'pending',
        metric: `${projects.length}개 프로젝트`,
        body: '고객사, 서비스, 폐쇄망 배포 단위가 되는 프로젝트를 준비합니다.',
        primary: { label: hasProject ? '프로젝트 관리' : '프로젝트 생성', path: '/admin/projects' },
        secondary: { label: '메뉴/화면/API 정보', path: '/admin/project-settings/integration-map' },
      },
      {
        no: '02',
        title: '지식 자료 준비',
        status: hasSources ? 'done' : 'pending',
        metric: `${summary.sourceCount}개 Source`,
        body: '고객 문서, 매뉴얼, FAQ를 Source로 등록하고 벡터화 작업을 수행합니다.',
        primary: { label: 'Source 관리', path: '/admin/knowledge/sources' },
        secondary: { label: '벡터화 작업 현황', path: '/admin/knowledge/jobs' },
      },
      {
        no: '03',
        title: 'Intent 설계',
        status: hasIntents ? 'done' : 'pending',
        metric: `${summary.intentCount}개 Intent`,
        body: '사용자 질문 의도, 예시 질문, Action 연결, Source 검색 범위를 관리합니다.',
        primary: { label: 'Intent 관리', path: `/admin/intent-factory/intents?project=${encodeURIComponent(projectId)}` },
        secondary: { label: 'FAQ 관리', path: '/admin/intent-factory/faqs' },
      },
      {
        no: '04',
        title: 'Entity/Synonym 정리',
        status: hasEntities ? 'done' : hasIntents ? 'attention' : 'pending',
        metric: `${summary.entityCount}개 Entity`,
        body: '업무 용어, 동의어, 코드값을 정리하고 Intent 실행에 필요한 Entity를 연결합니다.',
        primary: { label: 'Entity/Synonym 관리', path: '/admin/intent-factory/entities' },
        secondary: { label: 'Action 관리', path: '/admin/intent-factory/actions' },
      },
      {
        no: '05',
        title: 'Pack 제작/검증',
        status: hasPackDraft ? 'done' : hasIntents ? 'attention' : 'pending',
        metric: hasPackDraft ? `Draft Intent ${summary.packCounts.intents || 0}건` : 'Pack Draft 대기',
        body: 'DB에 정리된 Intent/Entity/Action/Source Scope를 Pack 초안으로 만들고 검증합니다.',
        primary: { label: 'Pack Builder', path: '/admin/packs/builder' },
        secondary: { label: 'Pack 검증', path: '/admin/packs/validation' },
      },
      {
        no: '06',
        title: 'Runtime 검증/운영',
        status: hasPackDraft ? 'attention' : 'pending',
        metric: '파일 Pack 기준 검증',
        body: '검증된 Pack으로 챗봇 Runtime, Intent 매칭, Action 실행 결과를 확인합니다.',
        primary: { label: '챗봇 대화 테스트', path: '/admin/runtime/qa' },
        secondary: { label: '운영 모니터링', path: '/admin/operations/realtime' },
      },
    ];
  }, [projectId, projects.length, summary]);

  const completedCount = steps.filter((step) => step.status === 'done').length;
  const nextStep = steps.find((step) => step.status !== 'done') || steps[steps.length - 1];

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>대시보드</span> {'>'} <span>구축 워크플로우</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>구축 워크플로우</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>프로젝트 준비부터 Pack 검증, Runtime 운영까지의 작업 순서를 한 화면에서 확인합니다.</p>
        </div>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={fieldStyle} disabled={projectsLoading}>
          {projects.length === 0 && <option value="">프로젝트 없음</option>}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name} ({project.id})</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={cardStyle}>
          <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>전체 진행률</div>
          <strong style={{ color: 'var(--color-primary)', fontSize: '28px' }}>{completedCount}/{steps.length}</strong>
          <div className="progress-track" style={{ marginTop: '14px' }}>
            <div className="progress-fill" style={{ width: `${Math.round((completedCount / steps.length) * 100)}%` }}></div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>다음 권장 작업</div>
          <strong style={{ color: 'var(--color-text-main)', fontSize: '20px' }}>{nextStep?.title}</strong>
          <p style={{ margin: '10px 0 0', color: 'var(--color-text-sub)', fontSize: '13px' }}>{nextStep?.body}</p>
        </div>
        <div style={cardStyle}>
          <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>Pack 준비 상태</div>
          <strong style={{ color: summary.packDraftReady ? 'var(--color-success)' : 'var(--color-text-main)', fontSize: '20px' }}>
            {summary.packDraftReady ? 'Draft 생성 가능' : 'Draft 준비 필요'}
          </strong>
          <p style={{ margin: '10px 0 0', color: 'var(--color-text-sub)', fontSize: '13px' }}>
            {loading ? <><Spinner size={14} style={{marginRight: 6}} /> 상태를 확인하고 있습니다.</> : `Intent ${summary.intentCount}건, Entity ${summary.entityCount}건, Source ${summary.sourceCount}건`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
        {steps.map((step) => {
          const status = statusStyle[step.status];
          return (
            <div key={step.no} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>{step.no}</div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-main)' }}>{step.title}</h3>
                </div>
                <span className={`badge ${status.className}`}>{status.label}</span>
              </div>
              <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '10px' }}>{step.metric}</div>
              <p style={{ minHeight: '42px', margin: '0 0 16px', color: 'var(--color-text-sub)', fontSize: '14px', lineHeight: 1.5 }}>{step.body}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" onClick={() => navigate(step.primary.path)}>{step.primary.label}</button>
                <button className="btn-secondary" onClick={() => navigate(step.secondary.path)}>{step.secondary.label}</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...cardStyle, marginTop: '18px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>운영자 메뉴 원칙</h3>
        <p style={{ margin: 0, color: 'var(--color-text-sub)', fontSize: '14px', lineHeight: 1.6 }}>
          좌측 메뉴는 업무 영역과 관리 화면 중심으로 제공하며, 등록/수정/상세/Preview 화면은 각 관리 화면의 버튼과 행 액션으로 진입합니다.
          이 구성은 운영자가 화면 목록이 아니라 구축 흐름을 기준으로 작업하도록 돕기 위한 구조입니다.
        </p>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
