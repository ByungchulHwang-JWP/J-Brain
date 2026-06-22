import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 탄소중립플랫폼 지식 챗봇입니다. 궁금한 점을 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('');
  const messagesEndRef = useRef(null);

  // For testing, fetch the first workspace ID to use
  useEffect(() => {
    const fetchWS = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        if(!token) return;
        const res = await fetch('/api/v1/workspaces/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && data.length > 0) setWorkspaceId(data[0].id);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWS();
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !workspaceId) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('ai_access_token');
      const response = await fetch(`/api/v1/workspaces/${workspaceId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMessage, stream: true })
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1].content += chunk;
          return newArr;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '응답을 받는 중 오류가 발생했습니다.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#031B4B', color: '#fff', border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer',
          display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000,
          width: '380px', height: '600px', background: '#fff', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #ebebeb'
        }}>
          {/* Header */}
          <div style={{
            background: '#031B4B', color: '#fff', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>지식 챗봇</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#F5F6FA', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', lineHeight: 1.5,
                  background: msg.role === 'user' ? '#3069B3' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  border: msg.role === 'user' ? 'none' : '1px solid #e0e0e0',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: msg.role === 'user' ? '12px' : '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>AI가 답변을 생성중입니다...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{
            padding: '16px', background: '#fff', borderTop: '1px solid #ebebeb', display: 'flex', gap: '8px'
          }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="질문을 입력하세요..."
              disabled={loading || !workspaceId}
              style={{
                flex: 1, height: '44px', padding: '0 16px', borderRadius: '22px', border: '1px solid #ddd',
                background: '#F5F6FA', fontSize: '14px', outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !workspaceId || !input.trim()}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', background: '#3069B3', color: '#fff',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (loading || !workspaceId || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={18} style={{ marginLeft: '-2px' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
