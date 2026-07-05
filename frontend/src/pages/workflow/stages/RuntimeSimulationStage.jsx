import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BotMessageSquare, CheckCircle2, FileSearch, MessageSquareText, MonitorPlay, Route, ShieldCheck } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { getActivePack, listPackValidationResults, listRuntimePacks } from '../../../api/intentFactory';

const RuntimeSimulationStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [activePack, setActivePack] = useState(null);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [activeData, runtimeData, validationData] = await Promise.all([
          getActivePack(projectId),
          listRuntimePacks(projectId),
          listPackValidationResults(projectId),
        ]);
        setActivePack(activeData?.pack_id ? activeData : null);
        setRuntimePacks(runtimeData.items || []);
        setValidationResults(validationData.items || []);
      } catch (err) {
        console.error(err);
        setActivePack(null);
        setRuntimePacks([]);
        setValidationResults([]);
        setMessage('Runtime 시뮬레이션 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const latestValidation = validationResults[0] || null;
  const latestSummary = latestValidation?.summary || latestValidation?.validation_result || {};
  const passedCount = Number(latestSummary.passed_count || summary.metrics.validation_pass_count || 0);
  const totalQuestions = Number(latestSummary.total_questions || summary.metrics.validation_question_count || 0);
  const passRate = totalQuestions > 0 ? Math.round((passedCount / totalQuestions) * 100) : 0;
  const approvedPacks = runtimePacks.filter((pack) => ['approved', 'active'].includes(String(pack.status || '').toLowerCase()));
  const importedPacks = runtimePacks.filter((pack) => String(pack.status || '').toLowerCase() !== 'archived');

  const openRuntimeQA = () => {
    localStorage.setItem('jbrain-workflow-project-id', projectId);
    navigate('/admin/runtime/qa', { state: { projectId } });
  };

  const testScenarios = [
    {
      icon: MessageSquareText,
      title: '자연어 질문 응답',
      description: '사용자 질문이 Intent 후보와 Action Card로 올바르게 매칭되는지 확인합니다.',
      sample: '운영 현황 보여줘',
      panel: 'natural',
    },
    {
      icon: FileSearch,
      title: 'FAQ/Source 근거 확인',
      description: 'SEARCH_DOC 답변에서 FAQ와 문서 근거가 함께 표시되는지 확인합니다.',
      sample: 'Scope 1 기준 알려줘',
      panel: 'evidence',
    },
    {
      icon: Route,
      title: '화면 이동 Action',
      description: 'NAVIGATE Action이 허용된 Route와 메뉴 정보로 반환되는지 확인합니다.',
      sample: '문서 목록 열어줘',
      panel: 'navigation',
    },
  ];

  const quickPanels = {
    natural: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: '자연어 질문 응답 테스트',
      description: '사용자의 자연어 질문이 기대 Intent와 Action Card로 연결되는지 Runtime QA에서 확인합니다.',
      items: [
        { title: '샘플 질문', description: '운영 현황 보여줘' },
        { title: '확인 기준', description: 'Top Intent, Confidence, Action ID가 기대 결과와 맞는지 확인합니다.' },
        { title: '미응답 처리', description: '낮은 신뢰도나 미응답은 운영 개선 후보로 기록되는지 봅니다.' },
      ],
    },
    evidence: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: 'FAQ/Source 근거 확인',
      description: 'SEARCH_DOC 답변이 FAQ와 Source 문서 근거를 함께 표시하는지 확인합니다.',
      items: [
        { title: '샘플 질문', description: 'Scope 1 기준 알려줘' },
        { title: 'FAQ 근거', description: 'FAQ ID, 질문, 답변, Score가 표시되는지 확인합니다.' },
        { title: 'Source 근거', description: 'Source ID와 문서 검색 근거가 함께 표시되는지 확인합니다.' },
      ],
    },
    navigation: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: '화면 이동 Action 테스트',
      description: 'NAVIGATE Action이 허용된 Route와 메뉴 권한 기준으로 안전하게 반환되는지 확인합니다.',
      items: [
        { title: '샘플 질문', description: '문서 목록 열어줘' },
        { title: 'Action 결과', description: 'Action ID와 Route가 Pack의 허용 목록에 포함되어 있는지 확인합니다.' },
        { title: '권한/메뉴 확인', description: '폐쇄망 Runtime에서 허용된 화면만 이동 후보로 노출되어야 합니다.' },
      ],
    },
  };

  const readiness = [
    { label: 'Runtime Pack', done: importedPacks.length > 0, meta: `${importedPacks.length || summary.metrics.runtime_pack_count || 0}건` },
    { label: 'Active Pack', done: Boolean(activePack), meta: activePack ? `${activePack.pack_id} v${activePack.pack_version}` : '없음' },
    { label: '검증 결과', done: validationResults.length > 0, meta: `${validationResults.length}건` },
    { label: 'Pass율', done: passRate >= 80 && totalQuestions > 0, meta: `${passRate}%` },
  ];

  const packRows = useMemo(() => (
    runtimePacks.slice(0, 6).map((pack) => ({
      id: pack.pack_id,
      version: pack.pack_version,
      status: pack.status,
      approval_status: pack.approval_status || '-',
      imported_at: pack.imported_at || pack.created_at || '-',
    }))
  ), [runtimePacks]);

  return (
    <section className="workflow-runtime-stage">
      <div className="workflow-runtime-hero panel">
        <div>
          <span className="workflow-pill blue">5단계 Pack 검증/빌드</span>
          <h3>Active 후보 Pack Runtime QA</h3>
          <p>
            검증된 파일 Pack을 실제 Runtime QA 화면에서 질문, 응답, 근거, Intent 진단, Action 결과 기준으로 점검합니다.
            이 단계에서도 Runtime은 DB를 직접 읽지 않고 검증된 Pack 기반으로 동작해야 합니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={openRuntimeQA}>
          <MonitorPlay size={16} /> Runtime QA 실행
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>Runtime Pack</span><strong>{importedPacks.length || summary.metrics.runtime_pack_count || 0}건</strong><small>Import된 Pack</small></div>
        <div className="panel workflow-status-card"><span>Approved 후보</span><strong>{approvedPacks.length}건</strong><small>활성화 가능 후보</small></div>
        <div className="panel workflow-status-card"><span>Active Pack</span><strong>{activePack ? '있음' : '없음'}</strong><small>{activePack ? `${activePack.pack_id} v${activePack.pack_version}` : '기본 파일 Pack 사용'}</small></div>
        <div className="panel workflow-status-card"><span>검증 Pass율</span><strong>{passRate}%</strong><small>{passedCount}/{totalQuestions}</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>시뮬레이션 시나리오</h3>
              <p>운영자가 Runtime QA에서 확인해야 하는 대표 테스트 유형입니다.</p>
            </div>
            <span className="workflow-pill amber">File Pack Runtime</span>
          </div>
          <div className="workflow-work-card-grid three">
            {testScenarios.map((card) => {
              const Icon = card.icon;
              return (
                <button className="workflow-work-card" key={card.title} type="button" onClick={() => setActivePanel(card.panel)}>
                  <span className="workflow-work-icon"><Icon size={18} /></span>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <div className="workflow-example-chips"><span>{card.sample}</span></div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel workflow-status-card">
          <div className="workflow-section-title"><span>완료 조건 요약</span></div>
          <div className="workflow-foundation-checks">
            {readiness.map((item) => (
              <div className="workflow-foundation-check" key={item.label}>
                <span className={`workflow-dot ${item.done ? 'done' : 'todo'}`}>{item.done ? '✓' : '!'}</span>
                <div><strong>{item.label}</strong><small>{item.meta}</small></div>
              </div>
            ))}
          </div>
          <div className="workflow-inline-note">
            {stage?.locked_reason || 'Runtime 시뮬레이션이 안정적으로 통과되면 같은 5단계 안에서 Pack Build로 배포 패키지를 생성합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>Runtime Pack 후보</h3>
              <p>Runtime QA에서 선택할 수 있는 Pack 후보와 상태입니다.</p>
            </div>
            <BotMessageSquare size={20} />
          </div>
          <table>
            <thead><tr><th>Pack ID</th><th>Version</th><th>상태</th><th>승인</th><th>등록일</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5">Runtime Pack 정보를 불러오는 중입니다.</td></tr>
              ) : packRows.length === 0 ? (
                <tr><td colSpan="5">Import된 Runtime Pack이 없습니다. 기본 파일 Pack으로 QA를 진행할 수 있습니다.</td></tr>
              ) : packRows.map((pack) => (
                <tr key={`${pack.id}-${pack.version}`}>
                  <td><div className="name mono">{pack.id}</div></td>
                  <td>{pack.version}</td>
                  <td><span className={`badge ${String(pack.status).toLowerCase() === 'active' ? 'active' : 'warning'}`}>{pack.status || '-'}</span></td>
                  <td>{pack.approval_status}</td>
                  <td>{pack.imported_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel workflow-stage-guide">
          <div className="workflow-board-head">
            <div>
              <h3>QA 확인 포인트</h3>
              <p>Runtime QA에서 필수로 확인해야 하는 진단 항목입니다.</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="workflow-guide-steps">
            <div><strong>1</strong><span>Top Intent 후보와 Confidence</span></div>
            <div><strong>2</strong><span>Action Card와 Route/API 결과</span></div>
            <div><strong>3</strong><span>FAQ/Source 근거 표시</span></div>
            <div><strong>4</strong><span>미응답 후보 생성 여부</span></div>
          </div>
          <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/5?tab=10`)}>
            Pack Build 탭으로 이동 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="panel workflow-stage-guide">
        <div className="workflow-board-head">
          <div>
            <h3>테스트 진입점</h3>
            <p>목적에 따라 Runtime QA, Intent 매칭, 고객 위젯 미리보기 화면으로 이동합니다.</p>
          </div>
          <CheckCircle2 size={18} />
        </div>
        <div className="workflow-action-buttons">
          <button className="btn-primary" type="button" onClick={openRuntimeQA}>챗봇 대화 테스트</button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/admin/runtime/intent-match')}>Intent 매칭 테스트</button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/admin/runtime/widget-preview')}>고객 위젯 미리보기</button>
        </div>
      </div>

      <WorkflowQuickPanel
        open={Boolean(activePanel)}
        {...(quickPanels[activePanel] || {})}
        primaryAction={{ label: 'Runtime QA 열기', onClick: openRuntimeQA }}
        secondaryAction={{ label: '현재 단계에서 계속하기', onClick: () => setActivePanel(null) }}
        onClose={() => setActivePanel(null)}
      />
    </section>
  );
};

export default RuntimeSimulationStage;
