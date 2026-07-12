import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Archive, RotateCcw, ShieldCheck } from 'lucide-react';
import ActionCard from '../components/chat/ActionCard';
import IntentDiagnostics from '../components/chat/IntentDiagnostics';
import { getActivePack } from '../api/intentFactory';
import { useProjectContext } from '../context/ProjectContext';

const AUTH_EXPIRED_MESSAGE = '로그인 정보가 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const clearInvalidToken = () => {
  localStorage.removeItem('ai_access_token');
};

const getRuntimeHistoryKey = (projectId) => `intent_runtime_chat_history:${projectId}`;

const createLocalMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readRuntimeHistory = (projectId) => {
  try {
    const rawHistory = localStorage.getItem(getRuntimeHistoryKey(projectId));
    const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
    if (!Array.isArray(parsedHistory)) return [];

    return parsedHistory
      .filter(message => !(message?.role === 'ai' && message?.isStreaming && !message?.content && !message?.actionCard))
      .map(message => ({ ...message, isStreaming: false }));
  } catch {
    return [];
  }
};

const readErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data?.detail || data?.message || JSON.stringify(data);
  } catch {
    return response.statusText || `요청 실패 (${response.status})`;
  }
};

const FORM_INPUT = {
  padding: '10px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const DEFAULT_RUNTIME_QUESTIONS = [
  'J-Brain 주요 기능 알려줘',
  '인덱스 작업이 무엇인가요?',
  '실행 연결은 무엇인가요?',
  'Pack 검증은 어떻게 하나요?',
];

const getPackModeLabel = (mode) => {
  if (mode === 'active-pack') return 'Active Pack';
  if (mode === 'db-draft') return 'DB Draft 확인';
  return 'Runtime Resolver';
};

const ProjectQA = ({ embedded = false }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationProjectId = location.state?.projectId;
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    projectLoadError,
  } = useProjectContext();
  const resolvedProjectId = navigationProjectId || id || selectedProjectId || '';
  
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [selectedPackMode, setSelectedPackMode] = useState('runtime-resolver');
  const [packDraftSummary, setPackDraftSummary] = useState(null);
  const [activePack, setActivePack] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const persistedProjectRef = useRef(null);

  const handleAuthError = useCallback((err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      clearInvalidToken();
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (resolvedProjectId && resolvedProjectId !== selectedProjectId) {
      setSelectedProjectId(resolvedProjectId);
    }
  }, [resolvedProjectId, selectedProjectId, setSelectedProjectId]);

  // Fetch recommended questions and restore local Runtime QA history when project changes.
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchQADetails = async () => {
      try {
        const recRes = await axios.get(`/api/v1/projects/${selectedProjectId}/recommended-questions`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` }
        });
        
        setRecommendedQuestions(recRes.data || []);
        setChatHistory(readRuntimeHistory(selectedProjectId));
        setCurrentConversationId(null);
        persistedProjectRef.current = selectedProjectId;
        
      } catch (err) {
        console.error('Failed to load QA details', err);
        handleAuthError(err);
      }
    };
    
    fetchQADetails();
  }, [selectedProjectId, handleAuthError]);

  useEffect(() => {
    if (!selectedProjectId || persistedProjectRef.current !== selectedProjectId) return;

    localStorage.setItem(getRuntimeHistoryKey(selectedProjectId), JSON.stringify(chatHistory));
  }, [chatHistory, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || selectedPackMode !== 'db-draft') {
      setPackDraftSummary(null);
      return;
    }

    axios.get(`/api/v1/intent-factory/projects/${selectedProjectId}/pack-draft`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    }).then((res) => {
      setPackDraftSummary(res.data);
    }).catch((err) => {
      console.error('Failed to load DB pack draft', err);
      setPackDraftSummary(null);
      handleAuthError(err);
    });
  }, [selectedProjectId, selectedPackMode, handleAuthError]);

  useEffect(() => {
    if (!selectedProjectId) {
      setActivePack(null);
      return;
    }

    getActivePack(selectedProjectId)
      .then((data) => setActivePack(data?.pack_id ? data : null))
      .catch((err) => {
        console.error('Failed to load active pack', err);
        setActivePack(null);
        handleAuthError(err);
      });
  }, [selectedProjectId, handleAuthError]);

  useEffect(() => {
    if (activePack?.pack_id && selectedPackMode === 'runtime-resolver') {
      setSelectedPackMode('active-pack');
    }
  }, [activePack?.pack_id, selectedPackMode]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isStreaming]);

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (isStreaming || !textToSend.trim() || !selectedProjectId) return;

    const aiMessageId = createLocalMessageId();
    const userMessage = { id: createLocalMessageId(), role: 'user', content: textToSend };
    const newAiMessage = { id: aiMessageId, role: 'ai', content: '', isStreaming: true, sources: null, actionCard: null, diagnostics: null, matches: [], runtimeMode: null, qaSummary: null };

    setChatHistory(prev => [...prev, userMessage, newAiMessage]);
    setInputMessage('');
    setIsStreaming(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error(AUTH_EXPIRED_MESSAGE);
      }

      const selectedPack = selectedPackMode === 'active-pack' && activePack?.pack_id
        ? { pack_id: activePack.pack_id, pack_version: activePack.pack_version }
        : {};

      const response = await fetch(`/api/v1/projects/${selectedProjectId}/chat/runtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ 
          query: textToSend,
          conversation_id: currentConversationId,
          top_k: 3,
          ...selectedPack,
        })
      });

      if (!response.ok) {
        const detail = await readErrorMessage(response);
        if (response.status === 401 || response.status === 403) {
          clearInvalidToken();
          throw new Error(AUTH_EXPIRED_MESSAGE);
        }
        throw new Error(detail);
      }

      const data = await response.json();
      const aiMessage = {
        id: aiMessageId,
        role: 'ai',
        content: data.message?.content || data.card?.message || '',
        isStreaming: false,
        sources: data.sources || null,
        actionCard: data.card || null,
        diagnostics: data.diagnostics || null,
        matches: data.matches || [],
        runtimeMode: data.runtime_mode || null,
        qaSummary: data.qa_summary || null,
      };

      setCurrentConversationId(data.conversation_id || data.session_id || currentConversationId);

      if (data.log_id && aiMessage.actionCard && !aiMessage.actionCard.log_id) {
        aiMessage.actionCard = { ...aiMessage.actionCard, log_id: data.log_id };
      }

      setChatHistory(prev => {
        return prev.map(message => message.id === aiMessageId ? aiMessage : message);
      });
      setIsStreaming(false);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => {
        return prev.map(message => message.id === aiMessageId
          ? { id: aiMessageId, role: 'ai', content: `오류가 발생했습니다: ${error.message}`, isStreaming: false, sources: null, actionCard: null, diagnostics: null, matches: [], runtimeMode: null, qaSummary: null }
          : message
        );
      });
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    if (!selectedProjectId) return;
    setChatHistory([]);
    setCurrentConversationId(null);
    localStorage.removeItem(getRuntimeHistoryKey(selectedProjectId));
  };

  const renderSources = (sources) => {
    if (!sources) return null;
    return (
      <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>참고 근거</div>
        {sources.vector_sources && sources.vector_sources.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {sources.vector_sources.map((src, idx) => (
              <li key={idx}>
                {src.file_name} (Chunk #{src.chunk_index}) - {src.score !== null && src.score !== undefined ? `신뢰도: ${src.score}` : '검색방식: 키워드'}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderQaSummary = (summary) => {
    if (!summary) return null;

    const topMatches = Array.isArray(summary.top_matches) ? summary.top_matches : [];
    const confidence = summary.intent?.confidence_label || 'very_low';
    const confidenceClass = ['high', 'medium'].includes(confidence) ? 'good' : confidence === 'low' ? 'warn' : 'bad';

    return (
      <div className="runtime-qa-summary">
        <div className="runtime-qa-summary-head">
          <div>
            <span>Runtime QA 결과</span>
            <strong>{summary.pack?.pack_id || '-'} v{summary.pack?.pack_version || '-'}</strong>
          </div>
          <span className={`runtime-confidence ${confidenceClass}`}>{confidence}</span>
        </div>

        <div className="runtime-qa-kpis">
          <div><span>Top Intent</span><strong>{summary.intent?.intent_id || '-'}</strong><small>{summary.intent?.intent_name || summary.intent?.category || '-'}</small></div>
          <div><span>Score</span><strong>{Number(summary.intent?.score || 0).toFixed(3)}</strong><small>문자열/토큰 매칭</small></div>
          <div><span>Action</span><strong>{summary.action?.action_id || '-'}</strong><small>{summary.action?.card_type || '-'}</small></div>
          <div><span>Evidence</span><strong>{summary.evidence?.source_count || 0}건</strong><small>FAQ {summary.evidence?.faq_count || 0} / 문서 {summary.evidence?.document_count || 0}</small></div>
        </div>

        {summary.action?.route && (
          <div className="runtime-qa-route">
            <span>화면 이동</span>
            <code>{summary.action.route}</code>
          </div>
        )}

        {topMatches.length > 0 && (
          <div className="runtime-qa-match-list">
            <div className="runtime-qa-section-title">Top-3 Intent 후보</div>
            {topMatches.map((match, index) => (
              <div className="runtime-qa-match-row" key={`${match.intent_id}-${index}`}>
                <span className="rank">{index + 1}</span>
                <div>
                  <strong>{match.intent_id}</strong>
                  <small>{match.intent_name || match.category || '-'} · {match.action_id || '-'}</small>
                </div>
                <b>{Number(match.score || 0).toFixed(3)}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const starterQuestions = recommendedQuestions.length > 0 ? recommendedQuestions : DEFAULT_RUNTIME_QUESTIONS;
  const projectWarning = projectLoadError
    ? '프로젝트 목록을 불러오지 못했습니다. 로그인 상태 또는 서버 연결을 확인해 주세요.'
    : '';
  const lastAiMessage = [...chatHistory].reverse().find((message) => message.role === 'ai' && !message.isStreaming);
  const lastQaSummary = lastAiMessage?.qaSummary || null;
  const lastConfidence = lastQaSummary?.intent?.confidence_label || '-';
  const lastEvidenceCount = lastQaSummary?.evidence
    ? (lastQaSummary.evidence.source_count || 0) + (lastQaSummary.evidence.faq_count || 0)
    : 0;

  return (
    <div className={embedded ? 'runtime-qa-page' : 'inner runtime-qa-page'}>
      {/* 헤더 영역 */}
      <div className="runtime-qa-header">
        <div>
          <div className="runtime-qa-eyebrow">Runtime 테스트</div>
          {embedded ? <h3>챗봇 대화 테스트</h3> : <h2>Runtime 대화 테스트</h2>}
          <p>선택한 Pack 기준으로 Intent 매칭, Action 실행, FAQ/Source 근거를 함께 검증합니다.</p>
        </div>
        <div className="runtime-qa-controls">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => navigate('/admin/packs?tab=repository')}
          >
            <Archive size={16} />
            Pack Repository
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={handleResetConversation}
            disabled={chatHistory.length === 0}
          >
            <RotateCcw size={16} />
            대화 초기화
          </button>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-sub)' }}>대상 프로젝트</span>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)} 
            style={{ ...FORM_INPUT, width: '200px' }}
          >
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-sub)' }}>Pack</span>
          <select
            value={selectedPackMode}
            onChange={(e) => setSelectedPackMode(e.target.value)}
            style={{ ...FORM_INPUT, width: '220px' }}
          >
            <option value="runtime-resolver">Runtime Resolver 자동 선택</option>
            <option value="active-pack" disabled={!activePack?.pack_id}>
              {activePack?.pack_id ? `Active Pack: ${activePack.pack_id} v${activePack.pack_version}` : 'Active Pack 없음'}
            </option>
            <option value="db-draft">DB Draft Pack 확인</option>
          </select>
        </div>
      </div>

      {(!selectedProjectId || projectLoadError) && (
        <div className="runtime-qa-project-warning">
          {projectWarning || '프로젝트를 선택하면 Runtime QA를 실행할 수 있습니다.'}
        </div>
      )}

      <div className="runtime-qa-packbar">
        <div>
          <span>Active Pack</span>
          <strong>
            {activePack?.pack_id
              ? `${activePack.pack_id} v${activePack.pack_version}`
              : '활성화된 Runtime Pack 없음'}
          </strong>
          <small>
            {activePack?.previous_pack_id
              ? `이전 버전: ${activePack.previous_pack_id} v${activePack.previous_pack_version}`
              : 'Pack Repository에서 Import 후 Activate할 수 있습니다.'}
          </small>
        </div>
        <div>
          <span>테스트 모드</span>
          <strong>{getPackModeLabel(selectedPackMode)}</strong>
          <small>
            {selectedPackMode === 'runtime-resolver'
              ? '요청 Pack을 지정하지 않고 서버가 Active Pack 또는 기본 Pack을 선택합니다.'
              : 'Runtime은 검증된 파일 Pack 기준으로 실행됩니다.'}
          </small>
        </div>
        <div>
          <span>최근 진단</span>
          <strong>{lastQaSummary?.intent?.intent_id || '대기 중'}</strong>
          <small>Confidence {lastConfidence} · Evidence {lastEvidenceCount}건</small>
        </div>
      </div>

      {selectedPackMode === 'db-draft' && (
        <div className="runtime-qa-notice">
          DB Draft Pack 선택됨:
          {' '}
          {packDraftSummary
            ? `Intent ${packDraftSummary.counts?.intents ?? 0}건, Entity ${packDraftSummary.counts?.entities ?? 0}건, Action Parameter ${packDraftSummary.counts?.action_parameters ?? 0}건을 Pack Builder에서 확인할 수 있습니다. 현재 Runtime 실행은 배포 전 파일 Pack 기준으로 유지됩니다.`
            : 'Pack Builder 초안을 불러오는 중입니다.'}
        </div>
      )}

      <div className="runtime-qa-diagnostics-grid">
        <div className="runtime-qa-diagnostic-card">
          <span>Pack 실행 기준</span>
          <strong>{selectedPackMode === 'active-pack' && activePack?.pack_id ? activePack.pack_id : '서버 Resolver'}</strong>
          <small>{selectedPackMode === 'active-pack' && activePack?.pack_version ? `v${activePack.pack_version}` : 'Active Pack 우선, 없으면 기본 파일 Pack'}</small>
        </div>
        <div className="runtime-qa-diagnostic-card">
          <span>외부 LLM/API</span>
          <strong>사용 안 함</strong>
          <small>Intent 매칭과 Action 실행은 로컬 Pack 기준입니다.</small>
        </div>
        <div className="runtime-qa-diagnostic-card">
          <span>최근 Intent</span>
          <strong>{lastQaSummary?.intent?.intent_id || '-'}</strong>
          <small>{lastQaSummary?.intent?.intent_name || '질문을 입력하면 Top Intent가 표시됩니다.'}</small>
        </div>
        <div className="runtime-qa-diagnostic-card">
          <span>최근 Action</span>
          <strong>{lastQaSummary?.action?.action_id || '-'}</strong>
          <small>{lastQaSummary?.action?.card_type || 'Action Card 결과가 표시됩니다.'}</small>
        </div>
      </div>

      <div className="panel runtime-qa-shell">
        
        {/* 채팅 내역 영역 */}
        <div className="runtime-qa-messages">
          {chatHistory.length === 0 ? (
            <div className="runtime-qa-empty">
              <div className="runtime-qa-empty-icon"><ShieldCheck size={32} /></div>
              <h3>Runtime QA를 시작하세요</h3>
              <p>
                질문을 입력하면 Intent 후보, Confidence, Action Card, FAQ/Source 근거가 한 번에 표시됩니다.
                배포 전에는 Active Pack 또는 서버 Resolver 기준으로 실제 Runtime 동작을 확인합니다.
              </p>
              
              <div className="runtime-qa-starter-list">
                {starterQuestions.map((q, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (!isStreaming) handleSendMessage(q);
                    }}
                    className={`runtime-qa-starter ${isStreaming ? 'disabled' : ''}`}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {chatHistory.map((msg, idx) => (
                <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: 'min(100%, 760px)',
                    padding: '16px 20px', 
                    borderRadius: '16px',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                    color: msg.role === 'user' ? '#ffffff' : 'var(--color-text-main)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    {msg.isStreaming && <span style={{ display: 'inline-block', width: '8px', height: '16px', background: 'var(--color-primary)', marginLeft: '4px', animation: 'blink 1s step-end infinite' }} />}
                  </div>
                  {msg.role === 'ai' && msg.actionCard && (
                    <div style={{ width: 'min(100%, 760px)', maxWidth: '760px', marginTop: '10px' }}>
                      {renderQaSummary(msg.qaSummary)}
                      <ActionCard card={msg.actionCard} />
                      <IntentDiagnostics diagnostics={msg.diagnostics} matches={msg.matches} />
                    </div>
                  )}
                  {msg.role === 'ai' && msg.sources && renderSources(msg.sources)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="runtime-qa-inputbar">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              rows={2}
              placeholder={selectedProjectId ? '프로젝트와 관련된 질문을 입력해주세요. (Enter: 전송, Shift+Enter: 줄바꿈)' : '프로젝트를 선택하면 Runtime QA 질문을 입력할 수 있습니다.'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || !selectedProjectId}
              style={{ ...FORM_INPUT, resize: 'none', height: 'auto', padding: '12px 16px', lineHeight: 1.5 }}
            />
            <button 
              className="btn-primary" 
              onClick={() => handleSendMessage()} 
              disabled={isStreaming || !inputMessage.trim() || !selectedProjectId}
              style={{ height: '48px', padding: '0 24px', whiteSpace: 'nowrap', opacity: (isStreaming || !inputMessage.trim() || !selectedProjectId) ? 0.6 : 1 }}
            >
              전송
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
            Intent Runtime 응답은 Pack 설정과 매칭 결과를 기준으로 표시됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectQA;
