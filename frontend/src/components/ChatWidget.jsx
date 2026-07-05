import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, ChevronDown, User, Bot, Maximize2, Minimize2 } from 'lucide-react';

const ChatWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 전체 화면 모드 토글
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [domains, setDomains] = useState([]);
  const messagesEndRef = useRef(null);

  // 프로젝트(도메인) 목록 동적 조회
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        if (!token) return;
        const res = await axios.get('/api/v1/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          const fetchedDomains = res.data.map(p => ({ id: p.id, name: p.name || p.id }));
          setDomains(fetchedDomains);
          setDomain(fetchedDomains[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    fetchDomains();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userQuery = inputValue;
    setInputValue('');
    
    const newUserMsg = { id: Date.now(), sender: 'user', text: userQuery };
    const botMsgId = Date.now() + 1;
    const initialBotMsg = { id: botMsgId, sender: 'bot', text: '', sources: [], loading: true };
    
    setMessages(prev => [...prev, newUserMsg, initialBotMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem('ai_access_token');
      const response = await fetch(`/api/v1/projects/${domain}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userQuery })
      });

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
          const actionMarker = '__ACTION_CARD__';
          const actionEnd = '__ACTION_CARD_END__';
          
          let parsedText = buffer;
          let parsedSources = null;
          let parsedActionCard = null;

          if (parsedText.includes(sourceMarker) && parsedText.includes(sourceEnd)) {
            const markerStart = parsedText.indexOf(sourceMarker);
            const markerEnd = parsedText.indexOf(sourceEnd) + sourceEnd.length;
            const cleanAnswer = parsedText.substring(0, markerStart);
            const jsonStr = parsedText.substring(markerStart + sourceMarker.length, markerEnd - sourceEnd.length);
            try { parsedSources = JSON.parse(jsonStr).vector_sources || []; } catch (e) {}
            parsedText = cleanAnswer + parsedText.substring(markerEnd);
          }

          if (parsedText.includes(actionMarker) && parsedText.includes(actionEnd)) {
            const markerStart = parsedText.indexOf(actionMarker);
            const markerEnd = parsedText.indexOf(actionEnd) + actionEnd.length;
            const cleanAnswer = parsedText.substring(0, markerStart);
            const jsonStr = parsedText.substring(markerStart + actionMarker.length, markerEnd - actionEnd.length);
            try { parsedActionCard = JSON.parse(jsonStr); } catch (e) {}
            parsedText = cleanAnswer + parsedText.substring(markerEnd);
          }

          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
              ? { 
                  ...msg, 
                  text: parsedText, 
                  ...(parsedSources ? { sources: parsedSources } : {}),
                  ...(parsedActionCard ? { action_card: parsedActionCard } : {})
                }
              : msg
          ));
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, loading: false } : msg
      ));

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: `오류가 발생했습니다: ${error.message}`, loading: false } : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const isComposingRef = useRef(false);

  const handleKeyDown = (e) => {
    if (isComposingRef.current) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // setTimeout을 사용하여 composition이 완전히 끝난 후 전송되도록 보장
      setTimeout(() => {
        handleSend();
      }, 0);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '60px', height: '60px', borderRadius: '50%',
            background: '#031B4B', color: '#fff', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 9999, transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isExpanded ? '0' : '24px',
          right: isExpanded ? '0' : '24px',
          width: isExpanded ? '100vw' : '400px',
          height: isExpanded ? '100vh' : '600px',
          background: '#fff',
          borderRadius: isExpanded ? '0' : '12px',
          boxShadow: isExpanded ? 'none' : '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          zIndex: 10000, overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          
          {/* Header */}
          <div style={{
            background: '#031B4B', color: '#fff', padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fff', color: '#031B4B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>J-Brain AI Assistant</span>
                <div style={{ position: 'relative', marginTop: '2px' }}>
                  <select 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)}
                    style={{
                      background: 'transparent', color: '#e0ecf8', border: 'none', outline: 'none',
                      fontSize: '12px', cursor: 'pointer', appearance: 'none', paddingRight: '12px'
                    }}
                  >
                    {domains.map(d => <option key={d.id} value={d.id} style={{ color: '#333' }}>{d.name} 프로젝트</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 0, top: '4px', pointerEvents: 'none', color: '#e0ecf8' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F5F6FA', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#333', marginTop: '20px', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Bot size={48} style={{ color: '#031B4B', marginBottom: '16px' }} />
                <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>무엇을 도와드릴까요?</p>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
                  J-Brain 시스템 가이드에 대해 묻거나,<br/>아래 프로젝트를 선택하여 지식 문서를 검색해 보세요.
                </p>
                
                  {domains.map(d => (
                    <button key={d.id} onClick={() => setDomain(d.id)} style={{ padding: '10px 16px', background: domain === d.id ? '#031B4B' : '#fff', color: domain === d.id ? '#fff' : '#031B4B', border: '1px solid #031B4B', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{d.name} 프로젝트 질의</span>
                      <span>{domain === d.id ? '✓' : '→'}</span>
                    </button>
                  ))}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex', gap: '12px',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: msg.sender === 'user' ? '#ddd' : '#3069B3', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {msg.sender === 'user' ? <User size={18} color="#555" /> : <Bot size={18} />}
                  </div>
                  <div style={{
                    maxWidth: '75%',
                    background: msg.sender === 'user' ? '#031B4B' : '#fff',
                    color: msg.sender === 'user' ? '#fff' : '#333',
                    padding: '12px 16px', borderRadius: '12px',
                    borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                    borderTopLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    fontSize: '14px', lineHeight: 1.5
                  }}>
                    {msg.sender === 'bot' && msg.loading && !msg.text ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}>
                        <span className="dot-flashing"></span>
                      </div>
                    ) : msg.sender === 'bot' ? (
                      <div className="markdown-body" style={{ color: 'inherit' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    )}
                    
                    {msg.sender === 'bot' && msg.action_card && msg.action_card.type === 'navigation_card' && (
                      <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(msg.action_card.route)}
                          style={{
                            padding: '10px 16px', background: '#031B4B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%',
                            transition: 'background 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#0a2a6b'}
                          onMouseOut={(e) => e.target.style.background = '#031B4B'}
                        >
                          🚀 {msg.action_card.button_label || '해당 화면으로 이동하기'}
                        </button>
                      </div>
                    )}

                    {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>참조 문서</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.sources.map((src, i) => (
                            <div key={i} style={{ fontSize: '12px', background: '#f8f9fa', padding: '6px 10px', borderRadius: '4px', color: '#555', border: '1px solid #eee' }}>
                              📄 {src.file_name} <span style={{ color: '#999', fontSize: '11px' }}>(Chunk #{src.chunk_index})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #eee' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: '12px',
              background: '#F5F6FA', borderRadius: '12px', padding: '8px 12px',
              border: '1px solid #ddd'
            }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => isComposingRef.current = true}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                  // Composition 끝난 직후 엔터키가 입력될 때를 대비해 약간의 딜레이
                }}
                placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
                rows={1}
                style={{
                  flex: 1, border: 'none', background: 'transparent', resize: 'none',
                  outline: 'none', fontSize: '14px', maxHeight: '120px', minHeight: '24px',
                  padding: '4px 0', fontFamily: 'inherit'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = (e.target.scrollHeight) + 'px';
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                style={{
                  background: inputValue.trim() && !loading ? '#031B4B' : '#ccc',
                  color: '#fff', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s', flexShrink: 0, marginBottom: '2px'
                }}
              >
                <Send size={16} style={{ marginLeft: '2px' }} />
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .dot-flashing {
          position: relative;
          width: 6px; height: 6px; border-radius: 5px;
          background-color: #3069B3; color: #3069B3;
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0.5s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: ''; display: inline-block; position: absolute; top: 0;
          width: 6px; height: 6px; border-radius: 5px;
          background-color: #3069B3; color: #3069B3;
          animation: dot-flashing 1s infinite alternate;
        }
        .dot-flashing::before { left: -10px; animation-delay: 0s; }
        .dot-flashing::after { left: 10px; animation-delay: 1s; }
        @keyframes dot-flashing {
          0% { background-color: #3069B3; }
          50%, 100% { background-color: rgba(48, 105, 179, 0.2); }
        }
        .markdown-body p { margin-bottom: 8px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { font-weight: 600; color: #1a1a1a; }
        .markdown-body ul { padding-left: 20px; margin-bottom: 8px; }
        .markdown-body li { margin-bottom: 4px; }
      `}} />
    </>
  );
};

export default ChatWidget;
