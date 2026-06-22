import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const SourcePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="inner" style={{ paddingBottom: '60px', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span onClick={() => navigate('/admin/sources')} style={{cursor:'pointer', textDecoration:'underline'}}>Source 목록</span> {'>'} <span onClick={() => navigate(`/admin/sources/${id}`)} style={{cursor:'pointer', textDecoration:'underline'}}>Source 상세</span> {'>'} <span>Source Preview</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>{id || 'SRC-001'} - Graph Preview</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => navigate(`/admin/sources/${id}`)}>상세로 돌아가기</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
        {/* 왼쪽: 그래프 시각화 영역 (Mock) */}
        <div style={{ flex: 2, background: '#1e1e1e', borderRadius: '8px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
            <select style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '4px' }}>
              <option>전체 그래프 보기</option>
              <option>특정 Entity 중심 보기</option>
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexDirection: 'column' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🕸️</div>
            <p>(ADM-SRC-004) Knowledge Graph 시각화 컴포넌트(D3.js 등)가 연동될 영역입니다.</p>
            <p style={{ fontSize: '13px' }}>현재는 Mock 뷰입니다.</p>
          </div>
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px' }}>
            <button style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+</button>
            <button style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>-</button>
          </div>
        </div>

        {/* 오른쪽: 상세 정보 패널 */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #eee', background: '#f8f9fa', fontWeight: 600 }}>
            선택된 노드/엣지 정보
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Entity Name</h4>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#031B4B' }}>GHG Protocol</div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Type</h4>
              <span className="badge active">STANDARD</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Description</h4>
              <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                온실가스 배출량 산정을 위한 글로벌 표준 가이드라인. Scope 1, 2, 3 배출량의 정의와 측정 방식을 제공한다.
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Connected Relations (2)</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>
                <li><strong style={{ color: '#031B4B' }}>DEFINES</strong> Scope 1</li>
                <li><strong style={{ color: '#031B4B' }}>DEFINES</strong> Scope 2</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Source Text (Evidence)</h4>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', fontSize: '13px', lineHeight: 1.5, color: '#444' }}>
                "...Scope 1, 2, 3 배출량 산정 방식은 GHG Protocol을 따르며, 직접 배출과 간접 배출을 모두 포함하여..." (chk-1002)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcePreview;
