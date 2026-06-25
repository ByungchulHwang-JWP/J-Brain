import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const AUTH_EXPIRED_MESSAGE = '로그인 정보가 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const clearInvalidToken = () => {
  localStorage.removeItem('ai_access_token');
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
  
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  const messagesEndRef = useRef(null);

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

  // Fetch Recommended Questions & History when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    
    // Update URL if missing
    if (!id || id !== selectedProjectId) {
      navigate(`/admin/qa`, { replace: true });
    }

    const fetchQADetails = async () => {
      try {
        const [recRes, histRes] = await Promise.all([
          axios.get(`/api/v1/projects/${selectedProjectId}/recommended-questions`, {
            headers: { Authorization: `Bearer ${getAccessToken()}` }
          }),
          axios.get(`/api/v1/projects/${selectedProjectId}/chat/history`, {
            headers: { Authorization: `Bearer ${getAccessToken()}` }
          })
        ]);
        
        setRecommendedQuestions(recRes.data || []);
        
        // Format history
        const formattedHistory = [];
        let latestSessionId = null;
        if (histRes.data && histRes.data.length > 0) {
          histRes.data.forEach(item => {
            formattedHistory.push({ role: item.role === 'user' ? 'user' : 'ai', content: item.content });
            latestSessionId = item.session_id;
          });
        }
        setChatHistory(formattedHistory);
        setCurrentConversationId(latestSessionId);
        
      } catch (err) {
        console.error('Failed to load QA details', err);
        handleAuthError(err);
      }
    };
    
    fetchQADetails();
  }, [selectedProjectId, id, navigate, handleAuthError]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isStreaming]);

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || !selectedProjectId) return;

    const userMessage = { role: 'user', content: textToSend };
    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);

    const newAiMessage = { role: 'ai', content: '', isStreaming: true, sources: null };
    setChatHistory(prev => [...prev, newAiMessage]);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error(AUTH_EXPIRED_MESSAGE);
      }

      const response = await fetch(`/api/v1/projects/${selectedProjectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ 
          query: textToSend,
          conversation_id: currentConversationId
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

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          const sourceMarker = '__SOURCES__';
          const sourceEnd = '__SOURCES_END__';
          
          if (buffer.includes(sourceMarker) && buffer.includes(sourceEnd)) {
            const markerStart = buffer.indexOf(sourceMarker);
            const markerEnd = buffer.indexOf(sourceEnd) + sourceEnd.length;
            const cleanAnswer = buffer.substring(0, markerStart);
            const jsonStr = buffer.substring(markerStart + sourceMarker.length, markerEnd - sourceEnd.length);
            
            let parsedSources = null;
            try {
              parsedSources = JSON.parse(jsonStr);
            } catch (e) {
              console.error("Failed to parse sources", e);
            }

            setChatHistory(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { 
                role: 'ai', 
                content: cleanAnswer, 
                isStreaming: false, 
                sources: parsedSources 
              };
              return updated;
            });
            break; // Finished streaming
          } else if (!buffer.includes(sourceMarker)) {
            setChatHistory(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'ai', content: buffer, isStreaming: true };
              return updated;
            });
          }
        }
      }
      setIsStreaming(false);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', content: `오류가 발생했습니다: ${error.message}`, isStreaming: false };
        return updated;
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
        <h2 style={{ fontWeight: 700, margin: 0 }}>AI 챗봇 대화 테스트</h2>
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
        </div>
      </div>

      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* 채팅 내역 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-bg-canvas)' }}>
          {chatHistory.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>무엇이든 물어보세요!</h3>
              <p style={{ fontSize: '14px' }}>프로젝트 지식 기반으로 답변해 드립니다.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '24px', maxWidth: '600px' }}>
                {recommendedQuestions.map((q, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    style={{
                      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary-glow)',
                      padding: '10px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                      color: 'var(--color-primary)', transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.target.style.background = 'var(--color-primary-subtle)'}
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
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '75%', 
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
            AI가 생성한 답변은 정확하지 않을 수 있습니다. 중요한 내용은 원본 문서를 확인해주세요.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectQA;
