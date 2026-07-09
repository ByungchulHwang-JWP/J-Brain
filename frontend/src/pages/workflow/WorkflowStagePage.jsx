import { Spinner } from '../../components/common/Loader';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import WorkflowStepper from '../../components/workflow/WorkflowStepper';
import WorkflowGatePanel from '../../components/workflow/WorkflowGatePanel';
import WorkflowActionBar from '../../components/workflow/WorkflowActionBar';
import { getWorkflowSummary } from '../../api/workflow';
import FoundationStage from './stages/FoundationStage';
import KnowledgeStage from './stages/KnowledgeStage';
import IntentDesignStage from './stages/IntentDesignStage';
import QuestionCoverageStage from './stages/QuestionCoverageStage';
import TermDictionaryStage from './stages/TermDictionaryStage';
import AnswerEvidenceStage from './stages/AnswerEvidenceStage';
import ActionConnectionStage from './stages/ActionConnectionStage';
import PackValidationStage from './stages/PackValidationStage';
import RuntimeSimulationStage from './stages/RuntimeSimulationStage';
import PackBuildStage from './stages/PackBuildStage';
import DeployActivateStage from './stages/DeployActivateStage';
import OpsImprovementStage from './stages/OpsImprovementStage';
import { buildWorkflowPhases, getPhaseByLegacyStageNo, getPhaseByPhaseNo, getPhaseSubtaskMeta } from './workflowPhases';

const stageComponents = {
  1: FoundationStage,
  2: KnowledgeStage,
  3: IntentDesignStage,
  4: QuestionCoverageStage,
  5: TermDictionaryStage,
  6: AnswerEvidenceStage,
  7: ActionConnectionStage,
  8: PackValidationStage,
  9: RuntimeSimulationStage,
  10: PackBuildStage,
  11: DeployActivateStage,
  12: OpsImprovementStage,
};

const phaseStageComponents = {
  1: [1],
  2: [2, 6],
  3: [3, 4, 5],
  4: [7],
  5: [8, 9, 10],
  6: [11, 12],
};

const WorkflowStagePage = () => {
  const navigate = useNavigate();
  const { projectId, stageNo = '1' } = useParams();
  const [searchParams] = useSearchParams();
  const requestedStageNo = Number(stageNo || 1);
  const requestedTabNo = Number(searchParams.get('tab') || 0);
  const selectedPhaseNo = requestedStageNo > 6
    ? getPhaseByLegacyStageNo(requestedStageNo).stage
    : getPhaseByPhaseNo(requestedStageNo).stage;
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [stepperHidden, setStepperHidden] = useState(false);
  const [activeLegacyStageNo, setActiveLegacyStageNo] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const stickySentinelRef = useRef(null);

  // Sticky 감지: sentinel이 뷰포트 밖으로 나가면 stepper를 sticky-minimized 모드로 전환
  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [summary]);

  useEffect(() => {
    if (!projectId) {
      navigate('/admin/workflow/projects', { replace: true });
      return;
    }

    const load = async () => {
      setError('');
      try {
        setSummary(await getWorkflowSummary(projectId));
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
        setError('단계 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    };
    load();
  }, [navigate, projectId]);

  const phases = useMemo(() => buildWorkflowPhases(summary || {}), [summary]);
  const phase = useMemo(
    () => phases.find((item) => Number(item.stage) === selectedPhaseNo) || phases[0],
    [phases, selectedPhaseNo]
  );
  const legacyStageNumbers = phaseStageComponents[selectedPhaseNo] || [1];
  const requestedTabStageNo = legacyStageNumbers.includes(requestedTabNo) ? requestedTabNo : null;
  const visibleLegacyStageNo = activeLegacyStageNo || requestedTabStageNo || (requestedStageNo > 6 ? requestedStageNo : legacyStageNumbers[0]);
  const stage = useMemo(
    () => summary?.stages?.find((item) => Number(item.stage) === Number(visibleLegacyStageNo)) || phase?.primaryStage || summary?.stages?.[0],
    [summary, visibleLegacyStageNo, phase]
  );
  const StageContent = stageComponents[visibleLegacyStageNo] || FoundationStage;
  const phaseChecks = phase?.checks || [];
  const completedCheckCount = phaseChecks.filter((check) => ['done', 'pass', 'completed', 'success', 'active'].includes(check.status)).length;
  const pendingCheckCount = Math.max(phaseChecks.length - completedCheckCount, 0);
  const primaryAction = stage?.next_actions?.[0] || phase?.next_actions?.[0] || null;
  const subtaskItems = (phase?.stageNumbers || []).map((legacyStageNo, index) => {
    const child = (phase?.sourceStages || []).find((s) => Number(s.stage) === Number(legacyStageNo)) || {
      stage: legacyStageNo,
      status: 'waiting',
      can_enter: false,
      name: getPhaseSubtaskMeta(selectedPhaseNo, legacyStageNo)?.title || `하위 작업 ${legacyStageNo}`,
    };
    const subtask = child.subtask || getPhaseSubtaskMeta(selectedPhaseNo, legacyStageNo) || {
      level: `${selectedPhaseNo}.${index + 1}`,
      title: child.name,
      description: child.locked_reason || '대기 중인 작업입니다.',
    };
    return { ...child, subtask };
  });
  const activeSubtask = subtaskItems.find((child) => Number(child.stage) === Number(visibleLegacyStageNo))?.subtask;

  useEffect(() => {
    const defaults = phaseStageComponents[selectedPhaseNo] || [1];
    const tabStageNo = defaults.includes(requestedTabNo) ? requestedTabNo : null;
    setActiveLegacyStageNo(tabStageNo || (requestedStageNo > 6 ? requestedStageNo : defaults[0]));
  }, [requestedStageNo, requestedTabNo, selectedPhaseNo]);

  const goStage = (targetStage) => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/${targetStage}`);

  if (!summary) {
    return (
      <div className="inner workflow-page workflow-stage-shell-v2">
        <div className="workflow-empty-state" style={{display:'flex', flexDirection:'column', alignItems:'center'}}><Spinner size={32} color="var(--color-primary)" style={{marginBottom: 16}} />워크플로우 상태를 확인하고 있습니다.</div>
      </div>
    );
  }

  return (
    <div className="inner workflow-page workflow-stage-shell-v2">
      <div className="breadcrumb">
          <span>구축 워크플로우</span> {'>'} <span>{summary.project_name}</span> {'>'} <span>{phase?.name}</span>
      </div>

      <div className="workflow-header">
        <div>
          <h2>{String(selectedPhaseNo).padStart(2, '0')}. {phase?.name}</h2>
          <p>{phase?.description || '현재 단계의 핵심 입력 항목, 완료 조건, 연결 화면을 확인합니다.'}</p>
        </div>
        <div className="workflow-header-actions">
          <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}`)}>대시보드</button>
          <button className="btn-secondary" type="button" onClick={() => setStepperHidden((prev) => !prev)}>
            {stepperHidden ? '단계 표시' : '단계 숨기기'}
          </button>
          <button className="btn-primary" type="button" onClick={() => navigate(stage?.next_actions?.[0]?.path || phase?.next_actions?.[0]?.path || '/admin/workflow/projects')}>주요 화면 이동</button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Sticky 감지용 투명 sentinel */}
      <div ref={stickySentinelRef} aria-hidden="true" style={{ height: 0, margin: 0, padding: 0 }} />

      <div className={`workflow-stage-control-strip${isSticky ? ' sticky-minimized' : ''}`}>
        {!stepperHidden && (
          <WorkflowStepper
            stages={phases}
            currentStage={selectedPhaseNo}
            subtasks={subtaskItems}
            activeSubtaskStage={visibleLegacyStageNo}
            onSubtaskClick={(child) => setActiveLegacyStageNo(Number(child.stage))}
            onStageClick={(item) => goStage(item.stage)}
            onPrev={() => goStage(Math.max(1, selectedPhaseNo - 1))}
            onNext={() => goStage(Math.min(6, selectedPhaseNo + 1))}
          />
        )}

        <WorkflowGatePanel stage={phase} checks={phase?.checks || []} />
      </div>

      {subtaskItems.length > 1 && (
        <div className="workflow-subtask-nav topology-hidden" role="tablist" aria-label={`${phase.name} 하위 작업`}>
          <div className="workflow-subtask-nav-head">
            <span>하위 작업</span>
            <strong>{phase.name} 단계에서 처리할 작업을 순서대로 확인합니다.</strong>
          </div>
          {subtaskItems.map((child) => {
            const subtask = child.subtask;
            const isActive = Number(child.stage) === Number(visibleLegacyStageNo);
            const statusLabel = child.status === 'done'
              ? '완료'
              : isActive
                ? '현재 작업'
                : child.can_enter
                  ? '이동 가능'
                  : '대기';
            return (
            <button
              key={child.stage}
              type="button"
              role="tab"
              className={`workflow-subtask-card ${isActive ? 'active' : ''} ${child.status || 'waiting'}`}
              onClick={() => setActiveLegacyStageNo(Number(child.stage))}
            >
              <span className="workflow-subtask-level">{subtask.level}</span>
              <strong className="workflow-subtask-title">{subtask.title}</strong>
              <small className="workflow-subtask-description">{subtask.description}</small>
              <span className="workflow-subtask-meta">{statusLabel}</span>
            </button>
            );
          })}
        </div>
      )}

      <div className="workflow-stage-main-zone">
        <main className="workflow-stage-primary-zone">
          <div className="workflow-stage-layout workflow-stage-layout-wide">
            <StageContent projectId={projectId} stage={stage} summary={summary} />
          </div>
        </main>

        <aside className="workflow-stage-context-zone" aria-label="현재 단계 작업 요약">
          <section className="panel workflow-stage-context-card">
            <span className="workflow-context-eyebrow">현재 작업</span>
            <h3>{activeSubtask?.title || stage?.name || phase?.name}</h3>
            <p>{activeSubtask?.description || '운영자는 현재 단계 안에서 주요 작업을 처리합니다.'}</p>
            <div className="workflow-context-stats" aria-label="완료 조건 진행 요약">
              <div>
                <span>완료 조건</span>
                <strong>{completedCheckCount}/{phaseChecks.length}</strong>
              </div>
              <div>
                <span>남은 확인</span>
                <strong>{pendingCheckCount}건</strong>
              </div>
            </div>
            <div className="workflow-context-guide">
              <strong>다음 작업</strong>
              <p>{primaryAction?.label || '현재 단계의 주요 작업을 완료한 뒤 다음 단계로 이동합니다.'}</p>
            </div>
            <button
              className="btn-secondary workflow-context-action"
              type="button"
              onClick={() => navigate(primaryAction?.path || `/admin/workflow/projects/${encodeURIComponent(projectId)}`)}
            >
              연결 화면 열기
            </button>
          </section>
        </aside>
      </div>

      <WorkflowActionBar note="각 단계의 등록/수정/상세 작업은 단계 화면 안의 Drawer/Modal 또는 보조 패널에서 먼저 처리합니다.">
        <button className="btn-secondary" type="button" onClick={() => goStage(Math.max(1, selectedPhaseNo - 1))}>이전 단계</button>
        <button className="btn-primary" type="button" onClick={() => goStage(Math.min(6, selectedPhaseNo + 1))}>다음 단계</button>
      </WorkflowActionBar>
    </div>
  );
};

export default WorkflowStagePage;
