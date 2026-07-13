import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck, FileCheck2, ListChecks, PlayCircle, ShieldAlert, XCircle } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { listPackValidationResults, listRuntimePacks, listValidationQuestions } from '../../../api/intentFactory';

const resultTone = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['passed', 'pass', 'success'].includes(normalized)) return { label: 'PASS', className: 'active', icon: CheckCircle2 };
  if (['failed', 'fail', 'validation_failed'].includes(normalized)) return { label: 'FAIL', className: 'error', icon: XCircle };
  return { label: status || '없음', className: 'warning', icon: ShieldAlert };
};

const PackValidationStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [questionData, resultData, runtimeData] = await Promise.all([
          listValidationQuestions(projectId),
          listPackValidationResults(projectId),
          listRuntimePacks(projectId),
        ]);
        setQuestions(questionData.items || []);
        setResults(resultData.items || []);
        setRuntimePacks(runtimeData.items || []);
      } catch (err) {
        console.error(err);
        setQuestions([]);
        setResults([]);
        setRuntimePacks([]);
        setMessage('Pack 검증 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const latestResult = results[0] || null;
  const latestTone = resultTone(latestResult?.status);
  const latestSummary = latestResult?.summary || latestResult?.validation_result || {};
  const passedCount = Number(latestSummary.passed_count || summary.metrics.validation_pass_count || 0);
  const totalQuestions = Number(latestSummary.total_questions || questions.length || summary.metrics.validation_question_count || 0);
  const passRate = totalQuestions > 0 ? Math.round((passedCount / totalQuestions) * 100) : 0;
  const highConfidenceQuestions = questions.filter((question) => Number(question.min_confidence_score || 0) >= 0.7);

  const failedResults = useMemo(() => {
    const details = latestResult?.results || latestResult?.validation_result?.results || [];
    return Array.isArray(details) ? details.filter((item) => item.passed === false).slice(0, 5) : [];
  }, [latestResult]);
  const packValidationPath = `/admin/packs?projectId=${encodeURIComponent(projectId)}&tab=validation`;

  const workCards = [
    {
      icon: ClipboardCheck,
      title: '검증 질문 등록',
      description: '질문별 기대 Intent, 기대 Action, 최소 Confidence를 정의합니다.',
      action: '질문 관리',
      panel: 'questions',
      primary: true,
    },
    {
      icon: PlayCircle,
      title: 'Pack 검증 실행',
      description: 'DB Draft 또는 Runtime Pack을 대상으로 검증 질문을 실행합니다.',
      action: '검증 실행',
      panel: 'run',
    },
    {
      icon: FileCheck2,
      title: '결과 근거 확인',
      description: 'Pass/Fail 결과를 Pack 승인 전 품질 근거로 검토합니다.',
      action: 'Repository',
      panel: 'results',
    },
  ];

  const quickPanels = {
    questions: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: '검증 질문 등록',
      description: 'Pack 품질검증은 운영자가 정의한 질문, 기대 Intent, 기대 Action, 최소 Confidence 기준으로 판정합니다.',
      items: [
        { title: '대표 질문 작성', description: '실제 사용자가 입력할 문장 형태로 검증 질문을 등록합니다.' },
        { title: '기대 결과 지정', description: 'Top-1로 올라와야 하는 Intent와 실행되어야 하는 Action을 연결합니다.' },
        { title: '최소 신뢰도 설정', description: '업무 중요도에 따라 최소 Confidence 기준을 설정합니다.' },
      ],
      secondaryAction: { label: '검증 질문 관리 열기', onClick: () => navigate(packValidationPath) },
    },
    run: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: 'Pack 검증 실행',
      description: 'DB Draft 또는 Runtime Pack을 선택해 등록된 검증 질문을 실행하고 Pass/Fail 결과를 저장합니다.',
      items: [
        { title: '검증 대상 선택', description: '아직 Export 전이면 DB Draft, 반입 후이면 Runtime Pack을 선택합니다.' },
        { title: 'Intent/Action 판정', description: '질문별 매칭 결과가 기대 Intent와 기대 Action에 맞는지 확인합니다.' },
        { title: '실패 원인 확인', description: 'Confidence 부족, Example 부족, Action 연결 누락을 분리해서 봅니다.' },
      ],
      secondaryAction: { label: 'Pack 검증 화면 열기', onClick: () => navigate(packValidationPath) },
    },
    results: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: '결과 근거 확인',
      description: '검증 결과는 Pack 승인/반려 판단의 근거입니다. 실패 항목은 다음 보강 작업으로 되돌립니다.',
      items: [
        { title: 'Pass 기준 확인', description: '전체 질문 대비 통과율과 고신뢰 기준 충족 여부를 확인합니다.' },
        { title: 'Fail 질문 보강', description: '실패 질문은 Intent Example 또는 Action 연결을 보완합니다.' },
        { title: 'Repository 이력 확인', description: '승인 전 Pack 상태와 검증 이력을 함께 확인합니다.' },
      ],
      secondaryAction: { label: 'Release & Deploy 열기', onClick: () => navigate('/admin/packs?tab=repository') },
    },
  };

  const readiness = [
    { label: '검증 질문', done: questions.length > 0, meta: `${questions.length || summary.metrics.validation_question_count || 0}건` },
    { label: 'Runtime Pack', done: runtimePacks.length > 0, meta: `${runtimePacks.length}건` },
    { label: '검증 결과', done: results.length > 0, meta: latestResult?.status || '없음' },
    { label: 'Pass 기준', done: passRate >= 80 && totalQuestions > 0, meta: `${passRate}%` },
  ];

  return (
    <section className="workflow-validation-stage">
      <div className="workflow-validation-hero panel">
        <div>
          <span className="workflow-pill blue">5단계 Pack 검증/빌드</span>
          <h3>Validation Question 기반 품질검증</h3>
          <p>
            Pack 승인 전에 질문별 기대 Intent, 기대 Action, Confidence 기준을 검증합니다.
            검증 결과는 승인/반려 및 배포 가능 여부를 판단하는 운영 근거가 됩니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setActivePanel('run')}>
          <PlayCircle size={16} /> 검증 실행
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>검증 질문</span><strong>{questions.length || summary.metrics.validation_question_count || 0}건</strong><small>Validation Question</small></div>
        <div className="panel workflow-status-card"><span>Runtime Pack</span><strong>{runtimePacks.length}건</strong><small>검증 대상 후보</small></div>
        <div className="panel workflow-status-card"><span>최근 Pass율</span><strong>{passRate}%</strong><small>{passedCount}/{totalQuestions}</small></div>
        <div className="panel workflow-status-card"><span>고신뢰 기준</span><strong>{highConfidenceQuestions.length}건</strong><small>0.70 이상</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>검증 준비 작업</h3>
              <p>Pack 승인 전에 반드시 확인해야 하는 품질검증 작업입니다.</p>
            </div>
            <span className="workflow-pill amber">Approval Gate</span>
          </div>
          <div className="workflow-work-card-grid three">
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
            {stage?.locked_reason || 'Pack 품질검증이 통과되면 같은 5단계 안에서 Runtime 시뮬레이션과 Pack Build를 이어서 확인합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>최근 검증 결과</h3>
              <p>최근 Pack Validation 실행 이력과 실패 항목을 확인합니다.</p>
            </div>
            {latestResult ? (() => {
              const Icon = latestTone.icon;
              return <span className={`badge ${latestTone.className}`}><Icon size={13} /> {latestTone.label}</span>;
            })() : <span className="badge warning">결과 없음</span>}
          </div>
          <table>
            <thead><tr><th>항목</th><th>값</th><th>설명</th></tr></thead>
            <tbody>
              <tr><td>최근 상태</td><td>{latestResult?.status || '-'}</td><td>가장 최근 검증 실행 결과</td></tr>
              <tr><td>Pass</td><td>{passedCount}건</td><td>기대 Intent/Action과 Confidence 기준 충족</td></tr>
              <tr><td>Total</td><td>{totalQuestions}건</td><td>검증 질문 수</td></tr>
              <tr><td>Fail</td><td>{failedResults.length}건</td><td>최근 결과 기준 실패 상세</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="panel workflow-table-card">
        <div className="workflow-board-head">
          <div>
            <h3>검증 질문 샘플</h3>
            <p>등록된 검증 질문 중 최근 항목을 표시합니다.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={() => navigate(packValidationPath)}>검증 질문 관리</button>
        </div>
        <table>
          <thead><tr><th>Question ID</th><th>질문</th><th>기대 Intent</th><th>기대 Action</th><th>최소 Score</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">검증 질문을 불러오는 중입니다.</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan="5">등록된 검증 질문이 없습니다.</td></tr>
            ) : questions.slice(0, 6).map((question) => (
              <tr key={question.question_id}>
                <td><div className="name mono">{question.question_id}</div></td>
                <td><div className="name">{question.question}</div></td>
                <td>{question.expected_intent_id}</td>
                <td>{question.expected_action_id}</td>
                <td>{Number(question.min_confidence_score || 0).toFixed(2)}</td>
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

export default PackValidationStage;
