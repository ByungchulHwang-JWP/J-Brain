import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, FileQuestion, History, ListChecks, RefreshCw, RotateCcw } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import {
  listFaqCandidates,
  listPackAuditLogs,
  listPackValidationResults,
  listRuntimePacks,
} from '../../../api/intentFactory';

const OpsImprovementStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [faqCandidates, setFaqCandidates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [candidateData, auditData, validationData, runtimeData] = await Promise.all([
          listFaqCandidates(projectId),
          listPackAuditLogs(projectId),
          listPackValidationResults(projectId),
          listRuntimePacks(projectId),
        ]);
        setFaqCandidates(candidateData.items || []);
        setAuditLogs(auditData.items || []);
        setValidationResults(validationData.items || []);
        setRuntimePacks(runtimeData.items || []);
      } catch (err) {
        console.error(err);
        setFaqCandidates([]);
        setAuditLogs([]);
        setValidationResults([]);
        setRuntimePacks([]);
        setMessage('운영 분석 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const metrics = summary.metrics || {};
  const candidateCount = faqCandidates.length || Number(metrics.faq_candidate_count || 0);
  const auditCount = auditLogs.length || Number(metrics.audit_count || 0);
  const failedValidations = validationResults.filter((item) => String(item.status || '').toLowerCase() === 'fail');
  const activePacks = runtimePacks.filter((pack) => String(pack.status || '').toLowerCase() === 'active');
  const improvementQueue = useMemo(() => faqCandidates.slice(0, 5), [faqCandidates]);
  const auditRows = useMemo(() => auditLogs.slice(0, 6), [auditLogs]);

  const workCards = [
    {
      icon: FileQuestion,
      title: '미응답 질문 분석',
      description: 'Fallback, Very Low 질문을 FAQ 후보 또는 Intent 개선 후보로 분류합니다.',
      action: '미응답 분석',
      panel: 'unanswered',
      primary: true,
    },
    {
      icon: ListChecks,
      title: '개선 요청 관리',
      description: '운영 피드백을 개선 요청으로 등록하고 Pack 반영 상태를 추적합니다.',
      action: '개선 요청',
      panel: 'requests',
    },
    {
      icon: BarChart3,
      title: '사용 통계 확인',
      description: '세션, 질문 유형, 실패율을 확인해 다음 개선 우선순위를 정합니다.',
      action: '사용 통계',
      panel: 'stats',
    },
    {
      icon: RotateCcw,
      title: '다음 Draft Pack 시작',
      description: '운영 분석 결과를 다음 Intent/FAQ/Action 보강 사이클로 넘깁니다.',
      action: '의도 설계',
      panel: 'nextDraft',
    },
  ];

  const quickPanels = {
    unanswered: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: '미응답 질문 분석',
      description: 'Runtime에서 fallback 또는 낮은 신뢰도로 기록된 질문을 분석해 개선 후보로 전환합니다.',
      items: [
        { title: '질문 원인 분류', description: 'Intent 부족, FAQ 부족, Source 근거 부족, Action 누락을 구분합니다.' },
        { title: 'FAQ/Intent 후보 전환', description: '반복되는 질문은 FAQ 또는 Intent 보강 대상으로 등록합니다.' },
        { title: '우선순위 결정', description: '발생 빈도와 업무 중요도 기준으로 다음 Draft에 반영할 항목을 고릅니다.' },
      ],
      secondaryAction: { label: '미응답 분석 열기', onClick: () => navigate('/admin/operations?tab=unanswered') },
    },
    requests: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: '개선 요청 관리',
      description: '운영 중 확인된 개선 후보를 요청 단위로 관리하고 Pack 반영 여부를 추적합니다.',
      items: [
        { title: '요청 등록', description: 'FAQ 보강, Intent 보강, Action 수정 등 개선 유형을 지정합니다.' },
        { title: '검토 상태 관리', description: '신규, 검토 중, 완료 상태로 운영 피드백 처리를 추적합니다.' },
        { title: 'Pack 반영 연결', description: '다음 Draft Pack에서 어떤 항목으로 반영할지 연결합니다.' },
      ],
      secondaryAction: { label: '개선 요청 관리 열기', onClick: () => navigate('/admin/operations?tab=improvements') },
    },
    stats: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: '사용 통계 확인',
      description: '챗봇 사용량, 실패율, 질문 유형을 분석해 운영 개선 우선순위를 정합니다.',
      items: [
        { title: '질문 유형 분석', description: '조회, 문서 검색, 화면 이동 등 사용 패턴을 확인합니다.' },
        { title: '실패율 추적', description: 'Very Low, fallback, 검증 실패 비율을 추적합니다.' },
        { title: '개선 효과 확인', description: '새 Pack 반영 후 응답률과 신뢰도 변화를 비교합니다.' },
      ],
      secondaryAction: { label: '사용 통계 열기', onClick: () => navigate('/admin/operations?tab=metrics') },
    },
    nextDraft: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: '다음 Draft Pack 시작',
      description: '운영 분석 결과를 다음 구축 사이클로 돌려 Intent, FAQ, Action을 보강합니다.',
      items: [
        { title: '개선 후보 확정', description: '반영할 미응답, FAQ 후보, Action 개선 요청을 확정합니다.' },
        { title: '의도 설계로 환류', description: '새 Intent 또는 Example 보강이 필요한 항목은 의도 설계 단계로 이동합니다.' },
        { title: '재검증 준비', description: '보강 후 Pack 검증과 Runtime 시뮬레이션을 다시 수행합니다.' },
      ],
      secondaryAction: { label: '의도 설계로 이동', onClick: () => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/3`) },
    },
  };

  const readiness = [
    { label: 'Active Pack 운영', done: activePacks.length > 0, meta: `${activePacks.length}건` },
    { label: '개선 후보 수집', done: candidateCount > 0, meta: `${candidateCount}건` },
    { label: '검증 실패 추적', done: failedValidations.length === 0, meta: failedValidations.length > 0 ? `${failedValidations.length}건 FAIL` : '대기 없음' },
    { label: '감사 로그', done: auditCount > 0, meta: `${auditCount}건` },
  ];

  return (
    <section className="workflow-ops-stage">
      <div className="workflow-ops-hero panel">
        <div>
          <span className="workflow-pill blue">6단계 배포 및 운영 개선</span>
          <h3>운영 피드백을 다음 Pack 개선 사이클로 연결</h3>
          <p>
            Active Pack 운영 중 발생한 미응답, 낮은 신뢰도, 검증 실패, 배포 이력을 분석해
            다음 Draft Pack에 반영할 개선 후보를 정리합니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setActivePanel('unanswered')}>
          <Activity size={16} /> 미응답 분석 열기
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>FAQ 후보</span><strong>{candidateCount}건</strong><small>미응답 전환 대상</small></div>
        <div className="panel workflow-status-card"><span>검증 실패</span><strong>{failedValidations.length}건</strong><small>재검토 필요</small></div>
        <div className="panel workflow-status-card"><span>Active Pack</span><strong>{activePacks.length}건</strong><small>운영 중 버전</small></div>
        <div className="panel workflow-status-card"><span>감사 로그</span><strong>{auditCount}건</strong><small>운영/배포 이력</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>운영 개선 작업</h3>
              <p>사용 로그와 미응답을 기반으로 다음 개선 사이클을 시작합니다.</p>
            </div>
            <span className="workflow-pill amber">Continuous Improvement</span>
          </div>
          <div className="workflow-work-card-grid">
            {workCards.map((card) => {
              const Icon = card.icon;
              return (
                <button className={`workflow-work-card ${card.primary ? 'primary' : ''}`} key={card.title} type="button" onClick={() => setActivePanel(card.panel)}>
                  <span className="workflow-work-icon"><Icon size={18} /></span>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <small>{card.action} <ArrowRight size={13} /></small>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel workflow-status-card">
          <div className="workflow-section-title"><span>운영 전환 상태</span></div>
          <div className="workflow-foundation-checks">
            {readiness.map((item) => (
              <div className="workflow-foundation-check" key={item.label}>
                <span className={`workflow-dot ${item.done ? 'done' : 'todo'}`}>{item.done ? '✓' : '!'}</span>
                <div><strong>{item.label}</strong><small>{item.meta}</small></div>
              </div>
            ))}
          </div>
          <div className="workflow-inline-note">
            {stage?.locked_reason || '운영 개선 후보가 정리되면 2단계 지식 준비 또는 3단계 의도 설계로 되돌아가 다음 Pack을 보강합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>개선 후보 큐</h3>
              <p>FAQ 후보로 전환된 미응답 질문입니다.</p>
            </div>
            <FileQuestion size={20} />
          </div>
          <table>
            <thead><tr><th>질문</th><th>카테고리</th><th>Source</th><th>상태</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4">개선 후보를 불러오는 중입니다.</td></tr>
              ) : improvementQueue.length === 0 ? (
                <tr><td colSpan="4">등록된 개선 후보가 없습니다.</td></tr>
              ) : improvementQueue.map((item) => (
                <tr key={item.candidate_id || item.faq_id || item.question}>
                  <td><div className="name">{item.question || item.source_question || '-'}</div><div className="meta">{item.answer || item.reason || 'FAQ 후보'}</div></td>
                  <td>{item.category || '-'}</td>
                  <td>{item.source_id || '-'}</td>
                  <td><span className="badge warning">{item.status || 'candidate'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel workflow-stage-guide">
          <div className="workflow-board-head">
            <div>
              <h3>다음 개선 사이클</h3>
              <p>운영 분석 결과를 다시 구축 워크플로우로 환류합니다.</p>
            </div>
            <RefreshCw size={18} />
          </div>
          <div className="workflow-guide-steps">
            <div><strong>1</strong><span>미응답/불만 질문 분류</span></div>
            <div><strong>2</strong><span>Intent/FAQ/Action 개선 위치 결정</span></div>
            <div><strong>3</strong><span>새 Draft Pack 생성</span></div>
            <div><strong>4</strong><span>검증 후 재배포</span></div>
          </div>
          <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/3`)}>
            의도 설계 단계로 돌아가기 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="panel workflow-table-card">
        <div className="workflow-board-head">
          <div>
            <h3>최근 운영/배포 이력</h3>
            <p>Pack Import, 승인, 활성화, Rollback 등 운영 추적 이력입니다.</p>
          </div>
          <History size={20} />
        </div>
        <table>
          <thead><tr><th>Operation</th><th>Pack</th><th>Status</th><th>Message</th><th>Created</th></tr></thead>
          <tbody>
            {auditRows.length === 0 ? (
              <tr><td colSpan="5">운영 이력이 없습니다.</td></tr>
            ) : auditRows.map((log, index) => (
              <tr key={`${log.operation}-${log.created_at}-${index}`}>
                <td>{log.operation}</td>
                <td>{log.pack_id ? `${log.pack_id} v${log.pack_version}` : '-'}</td>
                <td><span className="badge active">{log.status}</span></td>
                <td>{log.message || '-'}</td>
                <td>{log.created_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WorkflowQuickPanel
        open={Boolean(activePanel)}
        {...(quickPanels[activePanel] || {})}
        primaryAction={{ label: '현재 단계에서 계속하기', onClick: () => setActivePanel(null) }}
        onClose={() => setActivePanel(null)}
      />
    </section>
  );
};

export default OpsImprovementStage;
