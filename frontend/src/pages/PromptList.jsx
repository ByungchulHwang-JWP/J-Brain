import React, { useState } from 'react';

const mockPrompts = [
  { id: 1, domain: 'GLOBAL (전역)', name: '기본 챗봇 페르소나', updated_at: '2026-06-20', status: '활성' },
  { id: 2, domain: 'NETZERO', name: '탄소중립 전문 답변 지침', updated_at: '2026-06-21', status: '활성' },
  { id: 3, domain: 'DPPA', name: '전력거래 용어 번역 지침', updated_at: '2026-06-19', status: '비활성' },
];

const PromptList = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(mockPrompts[1]);

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>테스트/프롬프트</span> {'>'} <span>시스템 프롬프트 관리</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>시스템 프롬프트 관리</h2>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>프롬프트 목록</h3>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>+ 신규 등록</button>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockPrompts.map(p => (
              <li 
                key={p.id} 
                onClick={() => setSelectedPrompt(p)}
                style={{ 
                  padding: '16px', 
                  border: `1px solid ${selectedPrompt?.id === p.id ? '#031B4B' : '#eee'}`, 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: selectedPrompt?.id === p.id ? '#F0F4FA' : '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>{p.domain}</span>
                  <span className={`badge ${p.status === '활성' ? 'active' : 'inactive'}`}>{p.status}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>최종 수정일: {p.updated_at}</div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 2, background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          {selectedPrompt ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{selectedPrompt.name} 상세 설정</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary">삭제</button>
                  <button className="btn-primary" onClick={() => alert('저장되었습니다.')}>저장</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>적용 도메인</label>
                  <select defaultValue={selectedPrompt.domain} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }}>
                    <option value="GLOBAL (전역)">GLOBAL (전역)</option>
                    <option value="NETZERO">NETZERO</option>
                    <option value="DPPA">DPPA</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>System Prompt (지시문)</label>
                  <textarea 
                    style={{ flex: 1, padding: '16px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', fontSize: '14px', resize: 'vertical', minHeight: '300px' }}
                    defaultValue={selectedPrompt.domain === 'NETZERO' ? "당신은 탄소중립(Net-Zero) 및 ESG 컨설팅 전문가입니다.\n\n주어진 Context 문서를 바탕으로 사용자의 질문에 전문적이고 명확하게 답변하십시오. 답변을 작성할 때 출처(Reference)를 반드시 표기하십시오." : "당신은 AI 어시스턴트입니다."}
                  />
                  <span style={{ fontSize: '12px', color: '#888' }}>* LLM의 기본 Persona 및 답변 가이드라인을 정의합니다. GraphRAG Context는 이 지시문 아래에 자동으로 주입됩니다.</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              좌측에서 프롬프트를 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptList;
