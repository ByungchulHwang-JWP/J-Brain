import React, { useState, useEffect } from 'react';
import useProjects from '../hooks/useProjects';
import ActionCard from '../components/chat/ActionCard';
import IntentDiagnostics from '../components/chat/IntentDiagnostics';

const FORM_INPUT = {
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

const RetrievalTest = ({ embedded = false }) => {
  const [query, setQuery] = useState('');
  const { projects } = useProjects();
  const [domain, setDomain] = useState('');
  const [strategy, setStrategy] = useState('ACTION_ROUTER');
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('answer');

  // 프로젝트 로드 후 첫 번째 자동 선택
  useEffect(() => {
    if (projects.length > 0 && !domain) {
      setDomain(projects[0].id);
    }
  }, [projects]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    const newResult = {
      id: `RES-${Date.now()}`,
      query,
      answer: '',
      sources: [],
      graph: [],
      actionCard: null,
      matches: [],
      diagnostics: null,
      strategy,
      time: '-',
      confidence: '-'
    };
    setResults(prev => [newResult, ...prev]);
    setSelectedResult(newResult);
    setActiveTab('answer');

    const startTime = Date.now();

    try {
      const token = localStorage.getItem('ai_access_token');
      if (strategy === 'ACTION_ROUTER') {
        const response = await fetch('/api/v1/action-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            question: query,
            pack_id: 'netzero-intent-pack',
            pack_version: '0.1.0',
            top_k: 3
          })
        });

        if (!response.ok) {
          throw new Error(`Action Router API 오류 (${response.status})`);
        }

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const topMatch = data.matches?.[0];
        const diagnostics = data.diagnostics || {
          top_intent_id: topMatch?.intent_id || data.card?.intent_id || null,
          top_action_id: topMatch?.action_id || data.card?.action_id || null,
          top_confidence_label: topMatch?.confidence_label || data.card?.confidence_label || null,
          top_score: topMatch?.score ?? data.card?.score ?? null,
          matched_entities: topMatch?.matched_entities || data.card?.matched_entities || []
        };
        const nextResult = {
          ...newResult,
          answer: data.card?.message || '',
          actionCard: data.card,
          matches: data.matches || [],
          diagnostics,
          confidence: data.card?.confidence_label || topMatch?.confidence_label || '-',
          time: `${elapsed}s`
        };
        setSelectedResult(nextResult);
        setResults(prev => prev.map(item => item.id === newResult.id ? nextResult : item));
        return;
      }

      const response = await fetch(`/api/v1/projects/${domain}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query })
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
          if (buffer.includes(sourceMarker) && buffer.includes(sourceEnd)) {
            const markerStart = buffer.indexOf(sourceMarker);
            const markerEnd = buffer.indexOf(sourceEnd) + sourceEnd.length;
            const cleanAnswer = buffer.substring(0, markerStart);
            const jsonStr = buffer.substring(markerStart + sourceMarker.length, markerEnd - sourceEnd.length);
            try {
              const sourceData = JSON.parse(jsonStr);
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              setSelectedResult(prev => ({ ...prev, answer: cleanAnswer, sources: sourceData.vector_sources || [], graph: sourceData.graph_facts || [], time: `${elapsed}s` }));
            } catch {
              setSelectedResult(prev => ({ ...prev, answer: buffer.substring(0, markerStart) }));
            }
          } else if (!buffer.includes(sourceMarker)) {
            setSelectedResult(prev => ({ ...prev, answer: buffer }));
          }
        }
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setSelectedResult(prev => ({ ...prev, time: `${elapsed}s` }));
    } catch (error) {
      console.error(error);
      setSelectedResult(prev => ({ ...prev, answer: `오류가 발생했습니다: ${error.message}` }));
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (key) => ({
    padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === key ? 700 : 400,
    color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
    borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  });

  return (
    <div className={embedded ? '' : 'inner'} style={{ paddingBottom: '60px' }}>
      {!embedded && (
        <>
          <div className="breadcrumb">
            <span>테스트/프롬프트</span> {'>'} <span>챗봇 테스트</span>
          </div>
          <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
            <h2 style={{ fontWeight: 700 }}>GraphRAG 검색 테스트</h2>
          </div>
        </>
      )}
      {embedded && (
        <div className="console-embedded-toolbar">
          <h3>GraphRAG 검색 테스트</h3>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 좌측: 검색 조건 + 이력 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel">
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>검색 조건 설정</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-sub)' }}>대상 도메인</label>
                <select value={domain} onChange={(e) => setDomain(e.target.value)} style={FORM_INPUT}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.id}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-sub)' }}>검색 전략 (Strategy)</label>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={FORM_INPUT}>
                  <option value="ACTION_ROUTER">ACTION_ROUTER (Intent + Action Card)</option>
                  <option value="HYBRID">HYBRID (Vector + Keyword)</option>
                  <option value="GRAPH_LOCAL">GRAPH_LOCAL (Entity + Relation)</option>
                  <option value="GRAPH_GLOBAL">GRAPH_GLOBAL (Community Summary)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-sub)' }}>Top K (문서 수)</label>
                <input type="number" defaultValue={5} style={FORM_INPUT} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-sub)' }}>질의 (Query) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  rows={3}
                  placeholder="챗봇에 물어볼 질문을 입력하세요."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ ...FORM_INPUT, resize: 'vertical', lineHeight: 1.6, height: 'auto', padding: '12px' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '44px', width: '100%', fontSize: '15px' }} disabled={loading}>
                {loading ? '처리 중...' : '실행'}
              </button>
            </form>
          </div>

          {/* 검색 이력 */}
          <div className="panel">
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>검색 이력 (최근 5건)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>검색 이력이 없습니다.</div>
              ) : (
                results.slice(0, 5).map(res => (
                  <div
                    key={res.id}
                    onClick={() => setSelectedResult(res)}
                    style={{
                      padding: '12px 14px',
                      background: selectedResult?.id === res.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-elevated)',
                      borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
                      border: `1px solid ${selectedResult?.id === res.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      color: 'var(--color-text-main)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {res.query} ({res.strategy})
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 우측: 검색 결과 */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedResult ? (
            <div className="panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
              {/* 헤더 */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', borderRadius: '10px 10px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="badge active">검색 성공</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>응답 시간: {selectedResult.time} | 신뢰도: {selectedResult.confidence}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--color-text-main)', fontWeight: 600 }}>Q. {selectedResult.query}</h3>
              </div>

              {/* 탭 */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
                {[['answer', selectedResult.actionCard ? 'Action 카드' : 'LLM 답변'], ['evidence', '참조 근거 (Evidence)'], ['graph', 'Graph Traversal'], ['raw', 'Raw JSON']].map(([key, label]) => (
                  <div key={key} onClick={() => setActiveTab(key)} style={tabStyle(key)}>{label}</div>
                ))}
              </div>

              {/* 탭 컨텐츠 */}
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {activeTab === 'answer' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {selectedResult.actionCard ? 'Action Router 응답 카드' : '최종 생성된 답변'}
                    </h4>
                    {selectedResult.actionCard ? (
                      <>
                        <ActionCard card={selectedResult.actionCard} />
                        <IntentDiagnostics diagnostics={selectedResult.diagnostics} matches={selectedResult.matches} />
                      </>
                    ) : (
                      <div style={{ padding: '20px', background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary-glow)', borderRadius: '8px', lineHeight: 1.8, color: 'var(--color-text-main)', fontSize: '15px' }}>
                        {selectedResult.answer}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'evidence' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)' }}>검색된 소스 문서 (Top {selectedResult.sources?.length || 0}건)</h4>
                    {selectedResult.sources && selectedResult.sources.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedResult.sources.map((src, idx) => (
                          <div key={idx} className="panel" style={{ padding: '16px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 600 }}>
                              [{src.type?.toUpperCase()}] {src.score !== null && src.score !== undefined ? `Score: ${src.score}` : ''}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-main)' }}>
                              파일: {src.file_name} (Chunk #{src.chunk_index})
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>검색된 참조 문서가 없습니다.</div>
                    )}
                  </div>
                )}
                {activeTab === 'graph' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)' }}>지식 그래프 탐색 경로 (Entity & Relation)</h4>
                    {selectedResult.graph && selectedResult.graph.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedResult.graph.map((fact, idx) => (
                          <div key={idx} style={{ background: '#1e1e1e', color: '#00ff00', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px' }}>
                            &gt; [{fact.source}] --[{fact.relation}]--&gt; [{fact.target}]
                            {fact.description && <div style={{ color: '#aaa', marginTop: '4px' }}>&gt; {fact.description}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: '#1e1e1e', color: '#888', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
                        &gt; 그래프 데이터가 없습니다. 인덱싱 완료 후 Entity 추출 시 표시됩니다.
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'raw' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)' }}>백엔드 API 응답 원본</h4>
                    <pre style={{ background: 'var(--color-bg-elevated)', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>
                      {JSON.stringify(selectedResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '480px', border: '1px dashed var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>좌측에서 검색 조건을 설정하고 실행해주세요.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetrievalTest;
