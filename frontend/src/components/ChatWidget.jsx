import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, ArrowUp, ChevronDown, User, Bot, Maximize2, Minimize2 } from 'lucide-react';

const ChatWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 전체 화면 모드 토글
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [domains, setDomains] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
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
          className="chat-widget-glass"
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '60px', height: '60px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 9999, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={28} strokeWidth={1.5} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="chat-widget-glass"
          style={{
            position: 'fixed',
            bottom: isExpanded ? '0' : '24px',
            right: isExpanded ? '0' : '24px',
            width: isExpanded ? '100vw' : '400px',
            height: isExpanded ? '100vh' : '600px',
            borderRadius: isExpanded ? '0' : '16px',
            display: 'flex', flexDirection: 'column',
            zIndex: 10000, overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
          
          {/* Header */}
          <div style={{
            padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-glow)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} strokeWidth={1.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.3px' }}>J-Brain AI</span>
                <div style={{ position: 'relative', marginTop: '2px' }}>
                  <select 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)}
                    style={{
                      background: 'transparent', color: 'var(--color-text-sub)', border: 'none', outline: 'none',
                      fontSize: '12px', cursor: 'pointer', appearance: 'none', paddingRight: '12px'
                    }}
                  >
                    {domains.map(d => <option key={d.id} value={d.id} style={{ color: '#333' }}>{d.name} Project</option>)}
                  </select>
                  <ChevronDown size={12} strokeWidth={1.5} style={{ position: 'absolute', right: 0, top: '3px', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-sub)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--color-bg-elevated)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                {isExpanded ? <Minimize2 size={18} strokeWidth={1.2} /> : <Maximize2 size={18} strokeWidth={1.2} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-sub)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--color-bg-elevated)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                <X size={20} strokeWidth={1.2} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: 'var(--color-bg-elevated)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
                  <Bot size={40} strokeWidth={1.2} color="var(--color-text-main)" />
                </div>
                <p style={{ fontWeight: 600, fontSize: '18px', marginBottom: '8px', color: 'var(--color-text-main)' }}>How can I help you?</p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', marginBottom: '32px', lineHeight: 1.5 }}>
                  J-Brain 시스템 가이드에 대해 묻거나,<br/>아래 프로젝트를 선택하여 검색해 보세요.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px' }}>
                  {domains.map(d => (
                    <button key={d.id} onClick={() => setDomain(d.id)} style={{ padding: '12px 16px', background: domain === d.id ? 'var(--color-primary-subtle)' : 'transparent', color: 'var(--color-text-main)', border: '1px solid', borderColor: domain === d.id ? 'var(--color-primary)' : 'var(--color-border)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{d.name} Project Query</span>
                      <span>{domain === d.id ? '✓' : '→'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex', gap: '12px',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    background: msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,123,255,0.2)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {msg.sender === 'user' ? <User size={16} strokeWidth={1.5} /> : <Bot size={18} strokeWidth={1.5} />}
                  </div>
                  <div className={msg.sender === 'user' ? 'chat-msg-user' : 'chat-msg-bot'} style={{
                    maxWidth: '85%',
                    padding: '12px 16px', borderRadius: '16px',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                    fontSize: '13px', lineHeight: 1.6
                  }}>
                    {msg.sender === 'bot' && msg.loading && !msg.text ? (
                      <div className="chat-skeleton-table" style={{ width: '120px' }}>
                        <div className="chat-skeleton-row"></div>
                        <div className="chat-skeleton-row"></div>
                        <div className="chat-skeleton-row"></div>
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
                            padding: '10px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,123,255,0.3)'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#0056b3'; e.target.style.transform = 'translateY(-1px)'; }}
                          onMouseOut={(e) => { e.target.style.background = '#007bff'; e.target.style.transform = 'none'; }}
                        >
                          {msg.action_card.button_label || '해당 화면으로 이동하기'} ➔
                        </button>
                      </div>
                    )}

                    {msg.sender === 'bot' && msg.action_card && msg.action_card.type === 'query_card' && Array.isArray(msg.action_card.real_data) && msg.action_card.real_data.length > 0 && (
                      <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                        <table className="chat-data-table">
                          <thead>
                            <tr>
                              {Object.keys(msg.action_card.real_data[0]).map(key => (
                                <th key={key}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.action_card.real_data.map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((val, ci) => (
                                  <td key={ci}>{val ?? '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 500 }}>SOURCES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.sources.map((src, i) => (
                            <div key={i} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', color: 'rgba(255,255,255,0.8)' }}>
                              <span style={{ opacity: 0.5, marginRight: '6px' }}>📄</span>
                              {src.file_name} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>(#{src.chunk_index})</span>
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
          <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
            <div className={`chat-input-wrapper ${isInputFocused ? 'focused' : ''}`} style={{
              display: 'flex', alignItems: 'flex-end', gap: '8px',
              borderRadius: '16px', padding: '10px 12px'
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => isComposingRef.current = true}
                  onCompositionEnd={() => { isComposingRef.current = false; }}
                  placeholder="Ask anything..."
                  rows={1}
                  style={{
                    width: '100%', border: 'none', background: 'transparent', resize: 'none',
                    outline: 'none', fontSize: '14px', maxHeight: '120px', minHeight: '24px',
                    padding: '2px 0', fontFamily: 'inherit', color: 'var(--color-text-main)'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                  }}
                />
                {!inputValue.trim() && !isInputFocused && (
                  <div className="chat-keycap-hint">
                    <kbd>Shift</kbd> + <kbd>Enter</kbd> to newline
                  </div>
                )}
              </div>
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                style={{
                  background: inputValue.trim() && !loading ? '#007bff' : 'var(--color-bg-elevated)',
                  color: inputValue.trim() && !loading ? '#fff' : 'var(--color-text-muted)',
                  border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', flexShrink: 0, marginBottom: '2px',
                  boxShadow: inputValue.trim() && !loading ? '0 0 8px rgba(0,123,255,0.4)' : 'none'
                }}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body p { margin-bottom: 8px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { font-weight: 600; }
        .markdown-body ul { padding-left: 20px; margin-bottom: 8px; }
        .markdown-body li { margin-bottom: 4px; }
        /* Light mode text color adjustment for markdown if needed */
        [data-theme="light"] .markdown-body strong { color: #1a1a1a; }
      `}} />
    </>
  );
};

export default ChatWidget;
