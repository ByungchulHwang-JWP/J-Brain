import { Spinner } from '../../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkflowActionBar from '../../components/workflow/WorkflowActionBar';
import ConfirmModal from '../../components/common/ConfirmModal';
import { createWorkflowDraftPack, getWorkflowSummary } from '../../api/workflow';
import { createDiscoveryRun, getDiscoverySummary } from '../../api/intentFactory';
import { buildWorkflowPhases, getPhaseByLegacyStageNo } from './workflowPhases';

const stagePath = (projectId, stage) => `/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/${stage}`;

const WorkflowDashboardV2 = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('');
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [discoverySummary, setDiscoverySummary] = useState({});
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      navigate('/admin/workflow/projects', { replace: true });
      return;
    }

    localStorage.setItem('jbrain-workflow-project-id', projectId);

    const load = async () => {
      setMessage('');
      try {
        setSummary(await getWorkflowSummary(projectId));
        try {
          const discovery = await getDiscoverySummary(projectId);
          setDiscoverySummary(discovery.summary || {});
        } catch (discoveryErr) {
          console.error(discoveryErr);
          setDiscoverySummary({});
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
          localStorage.removeItem('jbrain-workflow-project-id');
          navigate('/admin/workflow/projects', {
            replace: true,
            state: { notice: '프로젝트가 없습니다. 먼저 프로젝트를 생성하거나 선택해 주세요.' },
          });
          return;
        }
        setMessage('워크플로우 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    };
    load();
  }, [navigate, projectId]);

  const phases = useMemo(() => buildWorkflowPhases(summary || {}), [summary]);
  const currentPhase = useMemo(() => {
    if (!summary) return phases[0];
    const phaseByCurrent = getPhaseByLegacyStageNo(summary.current_stage);
    return phases.find((phase) => Number(phase.stage) === Number(phaseByCurrent.stage)) || phases.find((phase) => phase.status !== 'done') || phases[0];
  }, [phases, summary]);

  if (!summary) {
    return (
      <div className="inner workflow-page">
        <div className="workflow-empty-state" style={{display:'flex', flexDirection:'column', alignItems:'center'}}><Spinner size={32} color="var(--color-primary)" style={{marginBottom: 16}} />워크플로우 대시보드를 확인하고 있습니다.</div>
      </div>
    );
  }

  const doneCount = phases.filter((phase) => phase.status === 'done').length;
  const issueCount = phases.reduce((total, phase) => total + (phase.checks || []).filter((check) => check.status !== 'done').length, 0);
  const nextPhase = phases.find((phase) => phase.status !== 'done') || currentPhase;
  const recentActivities = [
    { title: `${currentPhase?.name || '현재 단계'} 상태 확인`, meta: summary.next_action?.label || '워크플로우 대시보드', stage: currentPhase?.name || '-', user: 'System', time: '방금 전' },
    { title: `Source ${summary.metrics.source_count || 0}건 / Intent ${summary.metrics.intent_count || 0}건 집계`, meta: 'Workflow API 기준', stage: '상태 집계', user: 'System', time: '자동' },
    { title: `Active Pack ${summary.active_pack_version || '-'}`, meta: `Draft ${summary.draft_pack_version || '-'}`, stage: 'Pack 상태', user: 'System', time: '자동' },
  ];
  const risks = phases
    .filter((phase) => phase.status === 'warning' || phase.status === 'locked' || (phase.checks || []).some((check) => check.status !== 'done'))
    .slice(0, 3)
    .map((phase) => ({
      title: phase.status === 'locked' ? `${phase.name} 진입 대기` : `${phase.name} 완료 조건 확인`,
      meta: phase.locked_reason || `${phase.progress}% 진행`,
      impact: phase.status === 'locked' ? '다음 단계 대기' : '품질 검증 지연',
      action: phase.next_actions?.[0]?.label || '단계 화면 확인',
      phase,
    }));

  const stageTone = (stage) => {
    if (stage.status === 'done') return 'done';
    if (Number(stage.stage) === Number(currentPhase?.stage)) return 'current';
    if (stage.status === 'locked') return 'locked';
    return 'blocked';
  };

  const pillTone = (stage) => {
    if (stage.status === 'done') return 'green';
    if (Number(stage.stage) === Number(currentPhase?.stage)) return 'blue';
    if (stage.status === 'locked') return 'amber';
    return 'amber';
  };

  const stageStatusLabel = (stage) => {
    if (stage.status === 'done') return '완료';
    if (Number(stage.stage) === Number(currentPhase?.stage)) return '진행 중';
    if (stage.status === 'locked') return '대기';
    return '확인 필요';
  };

  const handleCreateDraft = async () => {
    setMessage('');
    setDraftLoading(true);
    try {
      await createWorkflowDraftPack(projectId, { reason: 'workflow_dashboard' });
      setMessage('DB 기준 Draft Pack 생성 요청이 완료되었습니다. Pack Build 단계에서 상세 내용을 확인하세요.');
      setDraftConfirmOpen(false);
    } catch (err) {
      console.error(err);
      setMessage('Draft Pack 생성 요청에 실패했습니다.');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleDiscoveryRun = async () => {
    setDiscoveryLoading(true);
    setMessage('');
    try {
      const run = await createDiscoveryRun(projectId, 'new');
      setDiscoverySummary(run.summary || {});
      setMessage('신규 자료 분석이 완료되었습니다. 새 Source 기준 후보가 기존 검토 후보에 병합되며, 후보 검토 화면에서 승인 또는 제외 처리해 주세요.');
    } catch (err) {
      console.error(err);
      setMessage(`Auto Discovery 실행에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const canBuildPack = Number(summary.current_stage || 0) >= 10;
  const currentStageUrl = stagePath(projectId, currentPhase?.stage || 1);
  const recommendedAction = summary.next_action;

  return (
    <div className="inner workflow-page workflow-dashboard-v3">
      <section className="workflow-topbar panel">
        <div>
          <div className="breadcrumb" style={{ padding: 0 }}>
            <span>대시보드</span> {'>'} <span>구축 워크플로우</span>
          </div>
          <h2>구축 워크플로우 대시보드</h2>
        </div>
        <div className="workflow-project-select">
          <span className="workflow-pill blue">현재 프로젝트</span>
          <button className="workflow-select-box" type="button" onClick={() => navigate('/admin/workflow/projects')}>
            {summary.project_name} · Draft {summary.draft_pack_version || '-'}
          </button>
        </div>
      </section>

      {message && <div className="workflow-message">{message}</div>}

      <section className="workflow-hero">
        <div className="workflow-hero-main">
          <div>
            <div className="workflow-hero-title">
              {summary.project_name} Pack 구축이 {currentPhase?.stage || 1}단계에서 진행 중입니다
            </div>
            <div className="workflow-hero-desc">
              {doneCount > 0 ? `${doneCount}개 단계가 완료되었습니다. ` : ''}
              현재는 {currentPhase?.name || '프로젝트 준비'} 단계이며, 완료 조건을 해결하면 {nextPhase?.name || '다음'} 단계로 이동할 수 있습니다.
            </div>
          </div>
          <div className="workflow-hero-stats">
            <div><span>전체 진행률</span><strong>{summary.overall_progress}%</strong></div>
            <div><span>완료 단계</span><strong>{doneCount}/6</strong></div>
            <div><span>현재 단계</span><strong>{currentPhase?.stage || 1}단계</strong></div>
            <div><span>남은 이슈</span><strong>{issueCount}건</strong></div>
          </div>
        </div>
        <div className="panel workflow-next-card">
          <span className="workflow-pill blue">AI 추천 다음 작업</span>
          <h3>{summary.next_action?.label || `${currentPhase?.name || '현재 단계'} 확인`}</h3>
          <p>{summary.next_action?.description || '현재 단계의 완료 조건과 연결 화면을 확인하세요.'}</p>
          <button className="btn-primary" type="button" onClick={() => navigate(stagePath(projectId, currentPhase?.stage || 1))}>
            {currentPhase?.stage || 1}단계 {currentPhase?.name || '단계'} 열기
          </button>
        </div>
      </section>

      <section className="workflow-main-grid-v3">
        <div className="panel workflow-stage-board">
          <div className="workflow-board-head">
            <div>
              <h3>6단계 구축 워크플로우</h3>
              <p>유사 작업을 묶은 상위 단계 카드입니다. 단계 안에서는 필요한 세부 작업을 탭으로 확인합니다.</p>
            </div>
            <span className="workflow-pill amber">현재: {currentPhase?.name || '-'}</span>
          </div>
          <div className="workflow-stage-grid-v3">
            {phases.map((stage) => (
              <button
                key={stage.stage}
                type="button"
                className={`workflow-stage-tile ${stageTone(stage)}`}
                onClick={() => stage.can_enter && navigate(stagePath(projectId, stage.stage))}
                disabled={!stage.can_enter}
              >
                <span className="workflow-stage-no">{String(stage.stage).padStart(2, '0')}</span>
                <strong>{stage.name}</strong>
                <p>{stage.description || `${stage.name} 단계의 주요 작업을 확인합니다.`}</p>
                {Number(stage.progress) > 0 && Number(stage.progress) < 100 && (
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${stage.progress}%` }}></div></div>
                )}
                <div className="workflow-stage-footer">
                  <span className={`workflow-pill ${pillTone(stage)}`}>{stageStatusLabel(stage)}</span>
                  <small>{stage.status === 'locked' ? '잠금' : `${stage.progress}%`}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="workflow-panel-stack">
          <div className="panel workflow-check-panel">
            <h3>현재 단계 체크</h3>
            {(currentPhase?.checks || []).map((check) => (
              <div className="workflow-check-row" key={check.key}>
                <span className={`workflow-dot ${check.status === 'done' ? 'done' : 'todo'}`}>{check.status === 'done' ? '✓' : '!'}</span>
                <strong>{check.label}</strong>
                <span className={`workflow-pill ${check.status === 'done' ? 'green' : 'amber'}`}>{check.status === 'done' ? '완료' : `${check.count || 0}건`}</span>
              </div>
            ))}
            {(!currentPhase?.checks || currentPhase.checks.length === 0) && (
              <div className="workflow-empty-state compact">현재 단계 체크 조건이 없습니다.</div>
            )}
          </div>
          <div className="panel workflow-check-panel">
            <h3>프로젝트 상태</h3>
            <div className="workflow-check-row"><span className="workflow-dot info">i</span><strong>기준 Pack</strong><span className="workflow-pill blue">Draft {summary.draft_pack_version || '-'}</span></div>
            <div className="workflow-check-row"><span className="workflow-dot info">i</span><strong>Active Pack</strong><span className="workflow-pill blue">{summary.active_pack_version || '-'}</span></div>
            <div className="workflow-check-row"><span className="workflow-dot done">✓</span><strong>외부 LLM/API 없음</strong><span className="workflow-pill green">확인</span></div>
          </div>
          <div className="panel workflow-check-panel">
            <h3>자동 후보 생성</h3>
            <div className="workflow-check-row"><span className="workflow-dot info">i</span><strong>전체 후보</strong><span className="workflow-pill blue">{discoverySummary.total || 0}건</span></div>
            <div className="workflow-check-row"><span className="workflow-dot done">✓</span><strong>승인 후보</strong><span className="workflow-pill green">{discoverySummary.approved || 0}건</span></div>
            <div className="workflow-action-buttons">
              <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/discovery/candidates`)}>
                후보 검토
              </button>
              <button className="btn-primary" type="button" onClick={handleDiscoveryRun} disabled={discoveryLoading}>
                {discoveryLoading ? '분석 중...' : '신규 자료 분석'}
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="workflow-subgrid">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div><h3>최근 작업 이력</h3><p>워크플로우 단계별 주요 변경을 확인합니다.</p></div>
            <span className="workflow-pill blue">최근 3건</span>
          </div>
          <table>
            <thead><tr><th>작업</th><th>단계</th><th>사용자</th><th>시간</th></tr></thead>
            <tbody>
              {recentActivities.map((item) => (
                <tr key={`${item.title}-${item.stage}`}>
                  <td><div className="name">{item.title}</div><div className="meta">{item.meta}</div></td>
                  <td>{item.stage}</td><td>{item.user}</td><td>{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div><h3>리스크 및 차단 요소</h3><p>다음 단계 이동을 막는 항목을 우선순위로 표시합니다.</p></div>
            <span className="workflow-pill red">주의 {risks.length}건</span>
          </div>
          <table>
            <thead><tr><th>리스크</th><th>영향</th><th>권장 조치</th></tr></thead>
            <tbody>
              {risks.length === 0 ? (
                <tr><td colSpan="3">현재 차단 요소가 없습니다.</td></tr>
              ) : risks.map((risk) => (
                <tr key={risk.title}>
                  <td><div className="name">{risk.title}</div><div className="meta">{risk.meta}</div></td>
                  <td>{risk.impact}</td>
                  <td>{risk.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WorkflowActionBar note="운영자는 이 대시보드에서 현재 프로젝트의 진행 상태를 확인하고 각 단계의 메인 화면으로 이동합니다.">
        {canBuildPack && (
          <button className="btn-secondary" type="button" onClick={() => setDraftConfirmOpen(true)}>새 Draft Pack 시작</button>
        )}
        <button className="btn-secondary" type="button" onClick={() => navigate('/admin/workflow/projects')}>프로젝트 변경</button>
        <button
          className="btn-primary"
          type="button"
          onClick={() => navigate(canBuildPack ? '/admin/packs/builder' : currentStageUrl)}
        >
          {canBuildPack ? 'Pack Build로 이동' : `${currentPhase?.stage || 1}단계 ${currentPhase?.name || '현재 단계'} 열기`}
        </button>
        {!canBuildPack && recommendedAction?.path && (
          <button className="btn-secondary" type="button" onClick={() => navigate(recommendedAction.path)}>
            {recommendedAction.label}
          </button>
        )}
      </WorkflowActionBar>

      <ConfirmModal
        open={draftConfirmOpen}
        title="새 Draft Pack을 시작할까요?"
        description="현재 DB에 저장된 Intent, Entity, FAQ, Action 정보를 기준으로 Pack Draft를 생성합니다. 기존 Active Pack에는 영향을 주지 않습니다."
        confirmLabel="Draft 시작"
        cancelLabel="취소"
        loading={draftLoading}
        onConfirm={handleCreateDraft}
        onCancel={() => setDraftConfirmOpen(false)}
      />
    </div>
  );
};

export default WorkflowDashboardV2;
