import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const mockSteps = [
  { step: 'Document Parsing', status: '완료', time: '1m 20s' },
  { step: 'Text Chunking', status: '완료', time: '30s' },
  { step: 'Entity Extraction (LLM)', status: '진행 중', time: '4m 10s...' },
  { step: 'Relation Extraction', status: '대기', time: '-' },
  { step: 'Community Detection', status: '대기', time: '-' },
  { step: 'Graph Summarization', status: '대기', time: '-' },
];

const IndexJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(45);

  // Mock progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 5));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>지식 관리</span> {'>'} <span onClick={() => navigate('/admin/jobs')} style={{cursor:'pointer', textDecoration:'underline'}}>인덱싱 작업 현황</span> {'>'} <span>작업 모니터링</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>{id || 'JOB-1002'} 모니터링</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ color: 'red', borderColor: 'red' }}>작업 강제 중지</button>
          <button className="btn-primary" onClick={() => navigate('/admin/jobs')}>목록으로</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>전체 진행 상황 (Overall Progress)</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>
          <span>진행률</span>
          <span style={{ color: '#3069B3' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '24px', background: '#f0f0f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3069B3 0%, #4facfe 100%)', transition: 'width 0.5s ease' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '40px', background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>대상 도메인</div>
            <div style={{ fontWeight: 500 }}>NETZERO</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>작업 유형</div>
            <div style={{ fontWeight: 500 }}>FULL_INDEX</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>시작 시간</div>
            <div style={{ fontWeight: 500 }}>2026-06-22 14:00:00</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>경과 시간</div>
            <div style={{ fontWeight: 500, color: '#3069B3' }}>5분 30초</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '32px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>파이프라인 단계별 현황</h3>
        
        <table className="table-area">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>단계 (Pipeline Step)</th>
              <th style={{ width: '25%' }}>상태</th>
              <th style={{ width: '25%' }}>소요 시간</th>
            </tr>
          </thead>
          <tbody>
            {mockSteps.map((s, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }}>{s.step}</td>
                <td>
                  <span className={`badge ${s.status === '완료' ? 'active' : s.status === '진행 중' ? 'warning' : 'inactive'}`}>
                    {s.status}
                  </span>
                </td>
                <td style={{ color: '#666' }}>{s.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '24px', background: '#1e1e1e', color: '#00ff00', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', height: '200px', overflowY: 'auto' }}>
          <div>[2026-06-22 14:00:00] INFO: Starting FULL_INDEX job for NETZERO</div>
          <div>[2026-06-22 14:00:05] INFO: Parsed 1 documents successfully.</div>
          <div>[2026-06-22 14:01:25] INFO: Generated 1,024 chunks.</div>
          <div>[2026-06-22 14:01:55] INFO: Starting Entity Extraction using LLM...</div>
          <div>[2026-06-22 14:03:10] INFO: Extracted 450 entities so far...</div>
          <div style={{ color: '#888' }}>&gt; Tailing real-time logs...</div>
        </div>
      </div>
    </div>
  );
};

export default IndexJobDetail;
