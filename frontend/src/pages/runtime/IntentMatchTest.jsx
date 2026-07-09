import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRight, RotateCcw, SearchCheck, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useProjects from '../../hooks/useProjects';
import { getActivePack } from '../../api/intentFactory';
import ActionCard from '../../components/chat/ActionCard';
import IntentDiagnostics from '../../components/chat/IntentDiagnostics';
import { Spinner } from '../../components/common/Loader';

const SAMPLE_QUESTIONS = [
  '운영 현황 보여줘',
  '문서 목록 열어줘',
  'J-Brain 주요 기능 알려줘',
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

const getConfidenceClass = (label) => {
  const normalized = String(label || '').toLowerCase();
  if (normalized === 'high' || normalized === 'medium') return 'good';
  if (normalized === 'low') return 'warn';
  return 'bad';
};

const formatScore = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(3) : '0.000';
};

const buildRuntimeSummary = (data) => {
  const summary = data?.qa_summary || {};
  const matches = Array.isArray(data?.matches) ? data.matches : [];
  const topMatch = summary.intent || matches[0] || {};
  const action = summary.action || data?.card || {};
  const diagnostics = data?.diagnostics || {};

  return {
    packId: summary.pack?.pack_id || diagnostics.pack_id || data?.pack_id || '-',
    packVersion: summary.pack?.pack_version || diagnostics.pack_version || data?.pack_version || '-',
    intentId: topMatch.intent_id || diagnostics.top_intent_id || '-',
    intentName: topMatch.intent_name || topMatch.category || '-',
    score: topMatch.score ?? diagnostics.score ?? 0,
    confidence: topMatch.confidence_label || diagnostics.confidence_label || '-',
    actionId: action.action_id || topMatch.action_id || diagnostics.action_id || '-',
    actionType: action.card_type || action.type || '-',
    route: action.route || '',
    evidenceCount: summary.evidence?.source_count || data?.sources?.vector_sources?.length || 0,
    faqCount: summary.evidence?.faq_count || 0,
    matches,
  };
};

const IntentMatchTest = () => {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(
    localStorage.getItem('jbrain-workflow-project-id') || ''
  );
  const [activePack, setActivePack] = useState(null);
  const [packMode, setPackMode] = useState('runtime-resolver');
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [topK, setTopK] = useState(3);
  const [loadingMatch, setLoadingMatch] = useState(false);
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

  const summary = useMemo(() => (result ? buildRuntimeSummary(result) : null), [result]);

  const selectedPackPayload = packMode === 'active-pack' && activePack?.pack_id
    ? { pack_id: activePack.pack_id, pack_version: activePack.pack_version }
    : {};

  const runMatch = async (nextQuestion = question) => {
    const trimmedQuestion = String(nextQuestion || '').trim();
    if (!selectedProjectId || !trimmedQuestion || loadingMatch) return;

    setQuestion(trimmedQuestion);
    setLoadingMatch(true);
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
      const nextSummary = buildRuntimeSummary(nextResult);

      setResult(nextResult);
      setHistory((prev) => [
        {
          question: trimmedQuestion,
          elapsedMs,
          intentId: nextSummary.intentId,
          confidence: nextSummary.confidence,
          score: nextSummary.score,
          actionId: nextSummary.actionId,
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
      setError(err?.response?.data?.detail || err.message || 'Intent 매칭 요청에 실패했습니다.');
    } finally {
      setLoadingMatch(false);
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
          <h2>Intent 매칭 테스트</h2>
          <p>
            Runtime Resolver 기준으로 사용자 질문이 어떤 Intent, Action, 근거 후보에 연결되는지 확인합니다.
          </p>
        </div>
        <div className="intent-match-controls">
          <button className="btn-secondary" type="button" onClick={resetResult} disabled={loadingMatch}>
            <RotateCcw size={16} />
            초기화
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/admin/qa')}>
            Runtime QA
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
          <select
            value={packMode}
            onChange={(event) => setPackMode(event.target.value)}
            style={FORM_INPUT}
          >
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
          <span>Pack</span>
          <strong>{summary?.packId || activePack?.pack_id || '서버 Resolver'}</strong>
          <small>{summary?.packVersion ? `v${summary.packVersion}` : activePack?.pack_version ? `v${activePack.pack_version}` : 'Active Pack 우선 선택'}</small>
        </div>
        <div className="intent-match-kpi">
          <span>Top Intent</span>
          <strong>{summary?.intentId || '-'}</strong>
          <small>{summary?.intentName || '질문 실행 후 표시됩니다.'}</small>
        </div>
        <div className="intent-match-kpi">
          <span>Confidence</span>
          <strong className={summary ? `runtime-confidence ${getConfidenceClass(summary.confidence)}` : ''}>
            {summary?.confidence || '-'}
          </strong>
          <small>Score {summary ? formatScore(summary.score) : '-'}</small>
        </div>
        <div className="intent-match-kpi">
          <span>Action</span>
          <strong>{summary?.actionId || '-'}</strong>
          <small>{summary?.actionType || 'Action Card 결과'}</small>
        </div>
      </section>

      {error && <div className="intent-match-alert">{error}</div>}

      <section className="intent-match-grid">
        <div className="intent-match-panel">
          <div className="intent-match-panel-head">
            <div>
              <h3>질문 입력</h3>
              <p>운영자가 실제 사용자 표현을 넣어 Intent 후보와 Action 연결을 검증합니다.</p>
            </div>
            <SearchCheck size={22} />
          </div>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                runMatch();
              }
            }}
            rows={5}
            placeholder="예: J-Brain 주요 기능 알려줘"
            style={{ ...FORM_INPUT, resize: 'vertical', minHeight: '132px' }}
          />
          <div className="intent-match-samples">
            {SAMPLE_QUESTIONS.map((sample) => (
              <button key={sample} type="button" onClick={() => runMatch(sample)} disabled={loadingMatch}>
                {sample}
              </button>
            ))}
          </div>
          <button className="btn-primary intent-match-submit" type="button" onClick={() => runMatch()} disabled={loadingMatch || !selectedProjectId}>
            {loadingMatch ? <><Spinner size={14} style={{marginRight: 6}} /> 매칭 중...</> : 'Intent 매칭 실행'}
          </button>
        </div>

        <div className="intent-match-panel">
          <div className="intent-match-panel-head">
            <div>
              <h3>매칭 결과</h3>
              <p>Top-3 후보와 Runtime 진단 정보를 함께 확인합니다.</p>
            </div>
            <ShieldCheck size={22} />
          </div>

          {summary ? (
            <div className="intent-match-result">
              <div className="intent-match-top-card">
                <div>
                  <span>Top Intent</span>
                  <strong>{summary.intentId}</strong>
                  <small>{summary.intentName}</small>
                </div>
                <b className={`runtime-confidence ${getConfidenceClass(summary.confidence)}`}>{summary.confidence}</b>
              </div>

              {summary.route && (
                <div className="runtime-qa-route">
                  <span>화면 이동</span>
                  <code>{summary.route}</code>
                </div>
              )}

              <div className="intent-match-table">
                <div className="intent-match-table-head">
                  <span>순위</span>
                  <span>Intent</span>
                  <span>Action</span>
                  <span>Score</span>
                </div>
                {(summary.matches.length > 0 ? summary.matches.slice(0, Number(topK) || 3) : [summary]).map((match, index) => (
                  <div className="intent-match-row" key={`${match.intent_id || summary.intentId}-${index}`}>
                    <span>{index + 1}</span>
                    <strong>{match.intent_id || summary.intentId}<small>{match.intent_name || match.category || summary.intentName}</small></strong>
                    <span>{match.action_id || summary.actionId}</span>
                    <b>{formatScore(match.score ?? summary.score)}</b>
                  </div>
                ))}
              </div>

              {result.card && <ActionCard card={result.card} />}
              <IntentDiagnostics diagnostics={result.diagnostics} matches={result.matches || []} />
            </div>
          ) : (
            <div className="intent-match-empty">
              <SearchCheck size={34} />
              <strong>아직 실행 결과가 없습니다.</strong>
              <p>질문을 입력하거나 샘플 질문을 선택하면 Runtime 기준 Intent 후보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </section>

      <section className="intent-match-history">
        <div className="intent-match-panel-head">
          <div>
            <h3>최근 테스트 이력</h3>
            <p>현재 화면에서 실행한 최근 5개 질문입니다.</p>
          </div>
        </div>
        {history.length > 0 ? (
          <div className="intent-match-table compact">
            <div className="intent-match-table-head">
              <span>질문</span>
              <span>Top Intent</span>
              <span>Confidence</span>
              <span>응답</span>
            </div>
            {history.map((item, index) => (
              <div className="intent-match-row" key={`${item.question}-${index}`}>
                <strong>{item.question}</strong>
                <span>{item.intentId}</span>
                <span>{item.confidence}</span>
                <b>{item.elapsedMs}ms</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="intent-match-muted">검색 이력이 없습니다.</div>
        )}
      </section>
    </div>
  );
};

export default IntentMatchTest;
