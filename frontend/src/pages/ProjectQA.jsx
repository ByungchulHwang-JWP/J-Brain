import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ActionCard from '../components/chat/ActionCard';
import IntentDiagnostics from '../components/chat/IntentDiagnostics';

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

const ProjectQA = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(id || '');
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [selectedPackMode, setSelectedPackMode] = useState('file-pack');
  const [packDraftSummary, setPackDraftSummary] = useState(null);
  
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

  // Fetch projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/api/v1/projects', {
          headers: { Authorization: `Bearer ${getAccessToken()}` }
        });
        setProjects(res.data);
        setSelectedProjectId(prev => prev || (res.data.length > 0 ? res.data[0].id : ''));
      } catch (err) {
        console.error('Failed to load projects', err);
        handleAuthError(err);
      }
    };
    fetchProjects();
  }, [handleAuthError]);

  // Fetch recommended questions and restore local Runtime QA history when project changes.
  useEffect(() => {
    if (!selectedProjectId) return;
    
    // Update URL if missing
    if (!id || id !== selectedProjectId) {
      navigate(`/admin/qa`, { replace: true });
    }

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
  }, [selectedProjectId, id, navigate, handleAuthError]);

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

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isStreaming]);

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (isStreaming || !textToSend.trim() || !selectedProjectId) return;

    const aiMessageId = createLocalMessageId();
    const userMessage = { id: createLocalMessageId(), role: 'user', content: textToSend };
    const newAiMessage = { id: aiMessageId, role: 'ai', content: '', isStreaming: true, sources: null, actionCard: null, diagnostics: null, matches: [], runtimeMode: null };

    setChatHistory(prev => [...prev, userMessage, newAiMessage]);
    setInputMessage('');
    setIsStreaming(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error(AUTH_EXPIRED_MESSAGE);
      }

      const response = await fetch(`/api/v1/projects/${selectedProjectId}/chat/runtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ 
          query: textToSend,
          conversation_id: currentConversationId,
          top_k: 3,
          pack_id: 'netzero-intent-pack',
          pack_version: '0.1.0'
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
          ? { id: aiMessageId, role: 'ai', content: `오류가 발생했습니다: ${error.message}`, isStreaming: false, sources: null, actionCard: null, diagnostics: null, matches: [], runtimeMode: null }
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

  return (
    <div className="inner" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 영역 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700, margin: 0 }}>Intent Runtime 대화 테스트</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-sub)' }}>대상 프로젝트</span>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)} 
            style={{ ...FORM_INPUT, width: '200px' }}
          >
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
            <option value="file-pack">기본 파일 Pack v0.1.0</option>
            <option value="db-draft">DB Draft Pack 확인</option>
          </select>
        </div>
      </div>

      {selectedPackMode === 'db-draft' && (
        <div className="table-area" style={{ padding: '12px 18px', marginBottom: '12px', color: 'var(--color-text-sub)', fontSize: '13px' }}>
          DB Draft Pack 선택됨:
          {' '}
          {packDraftSummary
            ? `Intent ${packDraftSummary.counts?.intents ?? 0}건, Entity ${packDraftSummary.counts?.entities ?? 0}건, Action Parameter ${packDraftSummary.counts?.action_parameters ?? 0}건을 Pack Builder에서 확인할 수 있습니다. 현재 Runtime 실행은 배포 전 파일 Pack 기준으로 유지됩니다.`
            : 'Pack Builder 초안을 불러오는 중입니다.'}
        </div>
      )}

      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* 채팅 내역 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-bg-canvas)' }}>
          {chatHistory.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>Intent Runtime 테스트</h3>
              <p style={{ fontSize: '14px' }}>선택한 프로젝트의 Intent Pack으로 작업 카드를 확인합니다.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '24px', maxWidth: '600px' }}>
                {recommendedQuestions.map((q, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (!isStreaming) handleSendMessage(q);
                    }}
                    style={{
                      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary-glow)',
                      padding: '10px 16px', borderRadius: '20px', fontSize: '13px', cursor: isStreaming ? 'not-allowed' : 'pointer',
                      color: 'var(--color-primary)', transition: 'all 0.2s', opacity: isStreaming ? 0.55 : 1,
                    }}
                    onMouseOver={(e) => {
                      if (!isStreaming) e.target.style.background = 'var(--color-primary-subtle)';
                    }}
                    onMouseOut={(e) => e.target.style.background = 'var(--color-bg-elevated)'}
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
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              rows={2}
              placeholder="프로젝트와 관련된 질문을 입력해주세요. (Enter: 전송, Shift+Enter: 줄바꿈)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              style={{ ...FORM_INPUT, resize: 'none', height: 'auto', padding: '12px 16px', lineHeight: 1.5 }}
            />
            <button 
              className="btn-primary" 
              onClick={() => handleSendMessage()} 
              disabled={isStreaming || !inputMessage.trim()}
              style={{ height: '48px', padding: '0 24px', whiteSpace: 'nowrap', opacity: (isStreaming || !inputMessage.trim()) ? 0.6 : 1 }}
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
