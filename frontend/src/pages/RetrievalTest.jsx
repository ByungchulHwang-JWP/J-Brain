import React, { useState } from 'react';

const mockResults = [
  { id: 'RES-001', query: '탄소중립이란 무엇인가요?', answer: '탄소중립은 인간의 활동에 의한 온실가스 배출을 최대한 줄이고, 남은 온실가스는 흡수, 제거해서 실질적인 배출량이 0(Zero)이 되는 개념입니다.', confidence: 0.92, strategy: 'HYBRID', time: '1.2s' },
];

const RetrievalTest = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('answer'); // answer, evidence, graph, raw

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    // Mock API Call
    setTimeout(() => {
      setResults(mockResults);
      setSelectedResult(mockResults[0]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>테스트/프롬프트</span> {'>'} <span>챗봇 테스트</span>
      </div>
      
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>GraphRAG 검색 테스트</h2>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* 왼쪽: 검색 조건 입력 및 이력 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>검색 조건 설정</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, fontSize: '14px' }}>대상 도메인</label>
                <select style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option>NETZERO (탄소중립플랫폼)</option>
                  <option>DPPA (직접전력거래)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, fontSize: '14px' }}>검색 전략 (Strategy)</label>
                <select style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option>HYBRID (Vector + Keyword)</option>
                  <option>GRAPH_LOCAL (Entity + Relation)</option>
                  <option>GRAPH_GLOBAL (Community Summary)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, fontSize: '14px' }}>Top K (문서 수)</label>
                <input type="number" defaultValue={5} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <label style={{ fontWeight: 500, fontSize: '14px' }}>질의 (Query) <span style={{color:'red'}}>*</span></label>
                <textarea 
                  rows={3} 
                  placeholder="챗봇에 물어볼 질문을 입력하세요." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? '검색 중...' : '검색 실행'}
              </button>
            </form>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>검색 이력 (최근 5건)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>탄소중립이란 무엇인가요? (HYBRID)</div>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>Scope 1 배출량 산정 기준 (GRAPH_LOCAL)</div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 검색 결과 상세 (ADM-RET-002) */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedResult ? (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              <div style={{ padding: '24px', borderBottom: '1px solid #eee', background: '#fcfcfc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge active">검색 성공</span>
                  <span style={{ fontSize: '13px', color: '#888' }}>응답 시간: {selectedResult.time} | 신뢰도: {selectedResult.confidence}</span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1d1d1d' }}>Q. {selectedResult.query}</h3>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
                <div onClick={() => setActiveTab('answer')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'answer' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'answer' ? 600 : 400, color: activeTab === 'answer' ? '#031B4B' : '#666' }}>LLM 답변</div>
                <div onClick={() => setActiveTab('evidence')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'evidence' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'evidence' ? 600 : 400, color: activeTab === 'evidence' ? '#031B4B' : '#666' }}>참조 근거 (Evidence)</div>
                <div onClick={() => setActiveTab('graph')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'graph' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'graph' ? 600 : 400, color: activeTab === 'graph' ? '#031B4B' : '#666' }}>Graph Traversal</div>
                <div onClick={() => setActiveTab('raw')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'raw' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'raw' ? 600 : 400, color: activeTab === 'raw' ? '#031B4B' : '#666' }}>Raw JSON</div>
              </div>

              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {activeTab === 'answer' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>최종 생성된 답변</h4>
                    <div style={{ padding: '20px', background: '#EEF4FF', borderRadius: '8px', lineHeight: 1.6, color: '#1d1d1d', fontSize: '15px' }}>
                      {selectedResult.answer}
                    </div>
                  </div>
                )}

                {activeTab === 'evidence' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>검색된 Text Chunks (Top 2)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: '#3069B3', marginBottom: '8px', fontWeight: 600 }}>[Score: 0.95] 탄소중립_가이드라인.pdf (Page 2)</div>
                        <div style={{ fontSize: '14px', lineHeight: 1.6 }}>탄소중립은 인간의 활동에 의한 온실가스 배출을 최대한 줄이고, 남은 온실가스는 산림 등으로 흡수하거나 CCUS 기술로 제거해서...</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'graph' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>그래프 탐색 경로 (Entity & Relation)</h4>
                    <div style={{ background: '#1e1e1e', color: '#00ff00', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
                      &gt; MATCH (n:Entity)-[r]-(m)<br/>
                      &gt; Found Path: [탄소중립] --(목표)--&gt; [배출량 0]<br/>
                      &gt; Found Path: [탄소중립] --(수단)--&gt; [온실가스 흡수]
                    </div>
                  </div>
                )}

                {activeTab === 'raw' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>백엔드 API 응답 원본</h4>
                    <pre style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', border: '1px solid #eee' }}>
                      {JSON.stringify(selectedResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              좌측에서 검색 조건을 설정하고 실행해주세요.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default RetrievalTest;
