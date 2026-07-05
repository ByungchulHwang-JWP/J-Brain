import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck, MessageCircleQuestion, PlusCircle, SearchCheck, TriangleAlert } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { listIntents, listValidationQuestions } from '../../../api/intentFactory';

const coverageTone = (count) => {
  if (count >= 5) return { label: '충분', className: 'active', level: 'good' };
  if (count >= 3) return { label: '보통', className: 'warning', level: 'medium' };
  return { label: '부족', className: 'error', level: 'low' };
};

const QuestionCoverageStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [intents, setIntents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeView, setActiveView] = useState('shortage');
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [intentData, questionData] = await Promise.all([
          listIntents(projectId),
          listValidationQuestions(projectId),
        ]);
        setIntents(intentData.items || []);
        setQuestions(questionData.items || []);
      } catch (err) {
        console.error(err);
        setIntents([]);
        setQuestions([]);
        setMessage('질문 커버리지 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const activeIntents = intents.filter((item) => item.status !== 'archived');
  const totalExamples = activeIntents.reduce((sum, item) => sum + Number(item.example_count || 0), 0);
  const averageExamples = activeIntents.length > 0 ? Math.round((totalExamples / activeIntents.length) * 10) / 10 : 0;
  const shortageItems = activeIntents.filter((item) => Number(item.example_count || 0) < 3);
  const validationLinked = activeIntents.filter((item) => questions.some((question) => question.expected_intent_id === item.intent_id));
  const strongCoverage = activeIntents.filter((item) => Number(item.example_count || 0) >= 5);

  const boardItems = useMemo(() => {
    if (activeView === 'strong') return strongCoverage;
    if (activeView === 'validation') return activeIntents.filter((item) => questions.some((question) => question.expected_intent_id === item.intent_id));
    return shortageItems;
  }, [activeIntents, activeView, questions, shortageItems, strongCoverage]);

  const suggestionCards = [
    {
      icon: MessageCircleQuestion,
      title: '현장 표현 추가',
      description: '사용자가 실제로 입력할 말투, 줄임말, 구어체 질문을 Intent Example에 추가합니다.',
      examples: ['운영 현황 보여줘', '문서 목록 열어줘', 'A공장 배출량 알려줘'],
      panel: 'examples',
    },
    {
      icon: SearchCheck,
      title: '오타/띄어쓰기 변형',
      description: '띄어쓰기 누락, 영문/한글 혼용, 숫자 표기 차이를 예시 질문으로 보강합니다.',
      examples: ['스코프1 기준', 'Scope 1 알려줘', '에이공장 탄소량'],
      panel: 'variants',
    },
    {
      icon: ClipboardCheck,
      title: '검증 질문 전환',
      description: '대표 질문은 Pack 검증 질문으로 등록해 Runtime 매칭 품질을 반복 확인합니다.',
      examples: ['기대 Intent', '기대 Action', '최소 Confidence'],
      panel: 'validation',
    },
  ];

  const quickPanels = {
    examples: {
      eyebrow: '3단계 질문 커버리지',
      title: '현장 표현 추가 기준',
      description: '사용자가 실제 업무 중 입력할 가능성이 높은 자연어 표현을 Intent Example로 보강합니다.',
      items: [
        { title: '구어체 질문', description: '“보여줘”, “알려줘”, “열어줘”처럼 실제 대화형 표현을 포함합니다.' },
        { title: '업무 축약어', description: '조직에서 자주 쓰는 약어와 현장명을 함께 등록합니다.' },
        { title: '질문 길이 다양화', description: '짧은 명령형, 긴 문의형, 조건 포함형을 섞어 등록합니다.' },
      ],
      secondaryAction: {
        label: '전체 Intent 관리',
        onClick: () => navigate(`/admin/intent-factory/intents?project=${encodeURIComponent(projectId)}`),
      },
    },
    variants: {
      eyebrow: '3단계 질문 커버리지',
      title: '오타/표기 변형 보강',
      description: '경량 매칭 Runtime은 사용자의 표기 차이에 영향을 받을 수 있으므로, 대표적인 변형 표현을 의도적으로 추가합니다.',
      items: [
        { title: '띄어쓰기 누락', description: '예: “운영현황”, “문서목록”처럼 붙여 쓴 표현을 추가합니다.' },
        { title: '한글/영문 혼용', description: 'Scope, 스코프, SCOPE처럼 혼용되는 용어를 함께 관리합니다.' },
        { title: '현장명 변형', description: 'A공장, 에이공장, A현장처럼 지칭 방식을 넓힙니다.' },
      ],
      secondaryAction: {
        label: '용어 사전으로 이동',
        onClick: () => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/3?tab=5`),
      },
    },
    validation: {
      eyebrow: '3단계 질문 커버리지',
      title: '검증 질문 전환',
      description: '대표성이 높은 질문은 8단계 Pack 품질검증에서 반복 실행할 Validation Question으로 전환합니다.',
      items: [
        { title: '기대 Intent 지정', description: '질문이 매칭되어야 할 Intent ID를 명확히 설정합니다.' },
        { title: '기대 Action 지정', description: '화면 이동, 문서 검색, 조회 Action 중 기대 실행 방식을 연결합니다.' },
        { title: '최소 Confidence 설정', description: '운영 기준에 맞는 최소 점수를 지정해 Pass/Fail 기준으로 사용합니다.' },
      ],
      secondaryAction: {
        label: '검증 질문 관리',
        onClick: () => navigate('/admin/packs/validation'),
      },
    },
  };

  const readiness = [
    { label: 'Intent 등록', done: activeIntents.length > 0, meta: `${activeIntents.length || summary.metrics.intent_count || 0}건` },
    { label: '예상 질문 3개 이상', done: shortageItems.length === 0 && activeIntents.length > 0, meta: shortageItems.length === 0 ? '충족' : `${shortageItems.length}건 부족` },
    { label: '검증 질문 연결', done: validationLinked.length > 0, meta: `${validationLinked.length}건` },
    { label: '평균 질문 수', done: averageExamples >= 3, meta: `${averageExamples}개` },
  ];

  return (
    <section className="workflow-coverage-stage">
      <div className="workflow-coverage-hero panel">
        <div>
          <span className="workflow-pill blue">3단계 의도 설계</span>
          <h3>Intent 질문 커버리지 보강</h3>
          <p>
            Intent가 다양한 사용자 표현을 충분히 커버하는지 확인합니다.
            예시 질문이 부족한 Intent를 먼저 보강하고, 대표 질문은 Pack 검증 질문으로 전환해 Runtime 품질을 관리합니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setActivePanel('examples')}>
          <PlusCircle size={16} /> 예상 질문 보강
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>등록 Intent</span><strong>{activeIntents.length || summary.metrics.intent_count || 0}건</strong><small>커버리지 대상</small></div>
        <div className="panel workflow-status-card"><span>예상 질문</span><strong>{totalExamples || summary.metrics.intent_example_count || 0}건</strong><small>Intent Example 기준</small></div>
        <div className="panel workflow-status-card"><span>부족 Intent</span><strong>{shortageItems.length}건</strong><small>3개 미만 기준</small></div>
        <div className="panel workflow-status-card"><span>검증 질문</span><strong>{questions.length}건</strong><small>Pack Validation 기준</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>질문 보강 가이드</h3>
              <p>운영자가 Intent Example에 추가해야 할 질문 유형입니다.</p>
            </div>
            <span className="workflow-pill amber">커버리지 기준 3개 이상</span>
          </div>
          <div className="workflow-work-card-grid three">
            {suggestionCards.map((card) => {
              const Icon = card.icon;
              return (
                <button className="workflow-work-card" type="button" key={card.title} onClick={() => setActivePanel(card.panel)}>
                  <span className="workflow-work-icon"><Icon size={18} /></span>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <div className="workflow-example-chips">
                    {card.examples.map((example) => <span key={example}>{example}</span>)}
                  </div>
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
            {stage?.locked_reason || '질문 커버리지가 충분해지면 같은 3단계 안에서 용어 사전 탭의 Entity와 Synonym을 정리합니다.'}
          </div>
        </aside>
      </div>

      <div className="panel workflow-intent-board">
        <div className="workflow-board-head">
          <div>
            <h3>커버리지 보드</h3>
            <p>예상 질문 수와 검증 질문 연결 여부를 기준으로 보강 우선순위를 확인합니다.</p>
          </div>
          <TriangleAlert size={20} />
        </div>

        <div className="workflow-tabbar">
          <button type="button" className={activeView === 'shortage' ? 'active' : ''} onClick={() => setActiveView('shortage')}>부족 Intent<span>{shortageItems.length}</span></button>
          <button type="button" className={activeView === 'strong' ? 'active' : ''} onClick={() => setActiveView('strong')}>충분<span>{strongCoverage.length}</span></button>
          <button type="button" className={activeView === 'validation' ? 'active' : ''} onClick={() => setActiveView('validation')}>검증 연결<span>{validationLinked.length}</span></button>
        </div>

        <div className="workflow-table-card">
          <table>
            <thead><tr><th>Intent ID</th><th>Intent 이름</th><th>예상 질문</th><th>검증 질문</th><th>커버리지</th><th>관리</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">커버리지 정보를 불러오는 중입니다.</td></tr>
              ) : boardItems.length === 0 ? (
                <tr><td colSpan="6">표시할 Intent가 없습니다.</td></tr>
              ) : boardItems.map((item) => {
                const exampleCount = Number(item.example_count || 0);
                const tone = coverageTone(exampleCount);
                const linkedQuestions = questions.filter((question) => question.expected_intent_id === item.intent_id).length;
                return (
                  <tr key={`${activeView}-${item.intent_id}`}>
                    <td><div className="name mono">{item.intent_id}</div></td>
                    <td><div className="name">{item.intent_name}</div><div className="meta">{item.category || '-'}</div></td>
                    <td>{exampleCount}건</td>
                    <td>{linkedQuestions}건</td>
                    <td><span className={`badge ${tone.className}`}>{tone.label}</span></td>
                    <td>
                      <button className="btn-table" type="button" onClick={() => navigate(`/admin/intent-factory/intents/${encodeURIComponent(item.intent_id)}?project=${encodeURIComponent(projectId)}`)}>
                        질문 보강
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel workflow-stage-guide">
        <div className="workflow-board-head">
          <div>
            <h3>다음 단계 연결</h3>
            <p>질문 표현이 충분해지면 용어 사전에서 Entity와 Synonym을 정리합니다.</p>
          </div>
          <CheckCircle2 size={18} />
        </div>
        <div className="workflow-guide-steps">
          <div><strong>1</strong><span>부족 Intent 확인</span></div>
          <div><strong>2</strong><span>예상 질문 보강</span></div>
          <div><strong>3</strong><span>대표 질문 검증 항목화</span></div>
          <div><strong>4</strong><span>용어 사전으로 이동</span></div>
        </div>
        <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/3?tab=5`)}>
          용어 사전 탭으로 이동 <ArrowRight size={16} />
        </button>
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

export default QuestionCoverageStage;
