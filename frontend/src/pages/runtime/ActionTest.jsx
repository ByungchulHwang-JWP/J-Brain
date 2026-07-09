import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRight, PlayCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActivePack } from '../../api/intentFactory';
import ActionCard from '../../components/chat/ActionCard';
import useProjects from '../../hooks/useProjects';
import { Spinner } from '../../components/common/Loader';

const SAMPLE_QUESTIONS = [
  'J-Brain 주요 기능 알려줘',
  '문서 목록 열어줘',
  '운영 현황 보여줘',
  '인덱스 작업이 무엇인가요?',
];

const FORM_INPUT = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
  outline: 'none',
};

const getAccessToken = () => localStorage.getItem('ai_access_token');

const formatScore = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(3) : '0.000';
};

const getConfidenceClass = (label) => {
  const normalized = String(label || '').toLowerCase();
  if (normalized === 'high' || normalized === 'medium') return 'good';
  if (normalized === 'low') return 'warn';
  return 'bad';
};

const buildActionSummary = (data) => {
  const qaSummary = data?.qa_summary || {};
  const action = qaSummary.action || {};
  const intent = qaSummary.intent || {};
  const diagnostics = data?.diagnostics || {};
  const card = data?.card || {};
  const matches = Array.isArray(data?.matches) ? data.matches : [];

  return {
    packId: qaSummary.pack?.pack_id || data?.pack_id || '-',
    packVersion: qaSummary.pack?.pack_version || data?.pack_version || '-',
    intentId: intent.intent_id || diagnostics.top_intent_id || matches[0]?.intent_id || '-',
    intentName: intent.intent_name || intent.category || matches[0]?.intent_name || '-',
    score: intent.score ?? diagnostics.top_score ?? matches[0]?.score ?? 0,
    confidence: intent.confidence_label || diagnostics.top_confidence_label || matches[0]?.confidence_label || '-',
    actionId: action.action_id || diagnostics.top_action_id || card.action_id || '-',
    actionType: action.card_type || card.type || '-',
    status: action.status || card.status || '-',
    route: action.route || card.route || '',
    evidenceCount: qaSummary.evidence?.source_count ?? 0,
    faqCount: qaSummary.evidence?.faq_count ?? 0,
    documentCount: qaSummary.evidence?.document_count ?? 0,
    matches,
  };
};

const ActionTest = () => {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(
    localStorage.getItem('jbrain-workflow-project-id') || '',
  );
  const [activePack, setActivePack] = useState(null);
  const [packMode, setPackMode] = useState('runtime-resolver');
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [topK, setTopK] = useState(3);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (selectedProjectId || projects.length === 0) return;
    setSelectedProjectId(projects[0].id);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setActivePack(null);
      return;
    }

    localStorage.setItem('jbrain-workflow-project-id', selectedProjectId);
    getActivePack(selectedProjectId)
      .then((data) => setActivePack(data?.pack_id ? data : null))
      .catch(() => setActivePack(null));
  }, [selectedProjectId]);

  const summary = useMemo(() => (result ? buildActionSummary(result) : null), [result]);

  const selectedPackPayload = packMode === 'active-pack' && activePack?.pack_id
    ? { pack_id: activePack.pack_id, pack_version: activePack.pack_version }
    : {};

  const runActionTest = async (nextQuestion = question) => {
    const trimmedQuestion = String(nextQuestion || '').trim();
    if (!selectedProjectId || !trimmedQuestion || running) return;

    setQuestion(trimmedQuestion);
    setRunning(true);
    setError('');

    const startedAt = performance.now();
    try {
      const response = await axios.post(
        `/api/v1/projects/${encodeURIComponent(selectedProjectId)}/chat/runtime`,
        {
          query: trimmedQuestion,
          top_k: Number(topK) || 3,
          ...selectedPackPayload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );

      const elapsedMs = Math.round(performance.now() - startedAt);
      const nextResult = { ...response.data, elapsed_ms: elapsedMs };
      const nextSummary = buildActionSummary(nextResult);

      setResult(nextResult);
      setHistory((prev) => [
        {
          question: trimmedQuestion,
          elapsedMs,
          intentId: nextSummary.intentId,
          actionId: nextSummary.actionId,
          actionType: nextSummary.actionType,
          status: nextSummary.status,
        },
        ...prev,
      ].slice(0, 5));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('ai_access_token');
        navigate('/login');
        return;
      }
      setError(err?.response?.data?.detail || err.message || 'Action 실행 테스트에 실패했습니다.');
    } finally {
      setRunning(false);
    }
  };

  const resetResult = () => {
    setResult(null);
    setError('');
    setHistory([]);
    setQuestion(SAMPLE_QUESTIONS[0]);
  };

  return (
    <div className="inner intent-match-page">
      <section className="intent-match-header">
        <div>
          <div className="runtime-qa-eyebrow">Runtime 테스트</div>
          <h2>Action 실행 테스트</h2>
          <p>
            사용자 질문이 Intent로 매칭된 뒤 Action Router가 어떤 실행 카드로 변환하는지 확인합니다.
          </p>
        </div>
        <div className="intent-match-controls">
          <button className="btn-secondary" type="button" onClick={resetResult} disabled={running}>
            <RotateCcw size={16} />
            초기화
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/admin/runtime/intent-match')}>
            Intent 매칭 테스트
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="intent-match-toolbar">
        <label>
          <span>대상 프로젝트</span>
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            style={FORM_INPUT}
            disabled={loading}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name} ({project.id})</option>
            ))}
          </select>
        </label>
        <label>
          <span>Pack 실행 기준</span>
          <select value={packMode} onChange={(event) => setPackMode(event.target.value)} style={FORM_INPUT}>
            <option value="runtime-resolver">Runtime Resolver 자동 선택</option>
            <option value="active-pack" disabled={!activePack?.pack_id}>
              {activePack?.pack_id ? `Active Pack: ${activePack.pack_id} v${activePack.pack_version}` : 'Active Pack 없음'}
            </option>
          </select>
        </label>
        <label>
          <span>Top K</span>
          <input
            type="number"
            min="1"
            max="10"
            value={topK}
            onChange={(event) => setTopK(event.target.value)}
            style={FORM_INPUT}
          />
        </label>
      </section>

      <section className="intent-match-kpi-grid">
        <div className="intent-match-kpi">
          <span>실행 정책</span>
          <strong>Whitelist</strong>
          <small>허용된 Action만 실행 카드로 반환</small>
        </div>
        <div className="intent-match-kpi">
          <span>Action Card</span>
          <strong>{summary?.actionType || '-'}</strong>
          <small>{summary?.actionId || '테스트 실행 후 표시됩니다.'}</small>
        </div>
        <div className="intent-match-kpi">
          <span>Intent Confidence</span>
          <strong className={summary ? `runtime-confidence ${getConfidenceClass(summary.confidence)}` : ''}>
            {summary?.confidence || '-'}
          </strong>
          <small>Score {summary ? formatScore(summary.score) : '-'}</small>
        </div>
        <div className="intent-match-kpi">
          <span>근거</span>
          <strong>{summary ? `${summary.evidenceCount}건` : '-'}</strong>
          <small>FAQ {summary?.faqCount ?? '-'} / 문서 {summary?.documentCount ?? '-'}</small>
        </div>
      </section>

      {error && <div className="intent-match-alert">{error}</div>}

      <section className="intent-match-grid">
        <div className="intent-match-panel">
          <div className="intent-match-panel-head">
            <div>
              <h3>테스트 질문</h3>
              <p>실제 사용자 질문을 입력해 Action Router 결과를 확인합니다.</p>
            </div>
            <PlayCircle size={22} />
          </div>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                runActionTest();
              }
            }}
            rows={5}
            placeholder="예: 문서 목록 열어줘"
            style={{ ...FORM_INPUT, resize: 'vertical', minHeight: '132px' }}
          />
          <div className="intent-match-samples">
            {SAMPLE_QUESTIONS.map((sample) => (
              <button key={sample} type="button" onClick={() => runActionTest(sample)} disabled={running}>
                {sample}
              </button>
            ))}
          </div>
          <button className="btn-primary intent-match-submit" type="button" onClick={() => runActionTest()} disabled={running || !selectedProjectId}>
            {running ? '실행 중...' : 'Action 실행 테스트'}
          </button>
        </div>

        <div className="intent-match-panel">
          <div className="intent-match-panel-head">
            <div>
              <h3>Action 실행 결과</h3>
              <p>Runtime에서 사용자에게 반환될 Action Card를 미리 확인합니다.</p>
            </div>
            <ShieldCheck size={22} />
          </div>

          {summary ? (
            <div className="intent-match-result">
              <div className="intent-match-top-card">
                <div>
                  <span>매칭 Intent</span>
                  <strong>{summary.intentId}</strong>
                  <small>{summary.intentName}</small>
                </div>
                <b className={`runtime-confidence ${getConfidenceClass(summary.confidence)}`}>{summary.confidence}</b>
              </div>

              {summary.route && (
                <div className="runtime-qa-route">
                  <span>화면 이동 Route</span>
                  <code>{summary.route}</code>
                </div>
              )}

              <ActionCard card={result.card} />
            </div>
          ) : (
            <div className="intent-match-empty">
              <ShieldCheck size={30} />
              <strong>아직 실행 결과가 없습니다.</strong>
              <p>질문을 입력하고 Action 실행 테스트를 실행하면 결과 카드와 진단 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </section>

      {summary && (
        <section className="intent-match-history">
          <div className="intent-match-panel-head">
            <div>
              <h3>Action Router 진단</h3>
              <p>Top Intent 후보와 연결 Action을 확인합니다.</p>
            </div>
          </div>
          <div className="intent-match-table">
            <div className="intent-match-table-head">
              <span>순위</span>
              <span>Intent</span>
              <span>Action</span>
              <span>Score</span>
            </div>
            {summary.matches.map((match, index) => (
              <div className="intent-match-row" key={`${match.intent_id || 'intent'}-${index}`}>
                <span>{index + 1}</span>
                <strong>
                  {match.intent_id || '-'}
                  <small>{match.intent_name || match.category || '-'}</small>
                </strong>
                <span>{match.action_id || '-'}</span>
                <b>{formatScore(match.score)}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="intent-match-history">
        <div className="intent-match-panel-head">
          <div>
            <h3>최근 실행 이력</h3>
            <p>최근 5건의 Action 테스트 결과를 표시합니다.</p>
          </div>
        </div>
        {history.length > 0 ? (
          <div className="intent-match-table compact">
            <div className="intent-match-table-head">
              <span>질문</span>
              <span>Intent</span>
              <span>Action</span>
              <span>시간</span>
            </div>
            {history.map((item, index) => (
              <div className="intent-match-row" key={`${item.question}-${index}`}>
                <strong>{item.question}</strong>
                <span>{item.intentId}</span>
                <span>{item.actionId} / {item.actionType}</span>
                <b>{item.elapsedMs}ms</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="intent-match-muted">실행 이력이 없습니다.</div>
        )}
      </section>
    </div>
  );
};

export default ActionTest;
