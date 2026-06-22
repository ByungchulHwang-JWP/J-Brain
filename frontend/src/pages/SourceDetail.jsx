import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const SourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info'); // info, chunk, entity, job

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span onClick={() => navigate('/admin/sources')} style={{cursor:'pointer', textDecoration:'underline'}}>Source 목록</span> {'>'} <span>Source 상세</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>{id || 'SRC-001'} (탄소중립_가이드라인.pdf) 상세</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => navigate(`/admin/sources/${id}/preview`)}>Graph Preview</button>
          <button className="btn-secondary" onClick={() => alert('삭제 확인 팝업 (Mock)')}>삭제</button>
          <button className="btn-primary" onClick={() => navigate('/admin/sources')}>목록으로</button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '24px' }}>
        <div onClick={() => setActiveTab('info')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'info' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'info' ? 600 : 400, color: activeTab === 'info' ? '#031B4B' : '#666' }}>기본 정보</div>
        <div onClick={() => setActiveTab('chunk')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'chunk' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'chunk' ? 600 : 400, color: activeTab === 'chunk' ? '#031B4B' : '#666' }}>문서 & Chunk 목록</div>
        <div onClick={() => setActiveTab('entity')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'entity' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'entity' ? 600 : 400, color: activeTab === 'entity' ? '#031B4B' : '#666' }}>Entity & Relation</div>
        <div onClick={() => setActiveTab('job')} style={{ padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === 'job' ? '2px solid #031B4B' : 'none', fontWeight: activeTab === 'job' ? 600 : 400, color: activeTab === 'job' ? '#031B4B' : '#666' }}>IndexJob 이력</div>
      </div>

      {/* 탭 내용 영역 */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '32px' }}>
        
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>도메인 (프로젝트)</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>NETZERO (탄소중립플랫폼)</div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>Source 유형</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>FILE (PDF)</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>파일명</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>탄소중립_가이드라인.pdf</div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>용량</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>2.4 MB</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>상태</h4>
                <span className="badge active">인덱싱 완료</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>등록일시 / 등록자</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>2026-06-22 10:00:15 / admin@kt.com</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chunk' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Text Chunks (Mock 15개)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px', background: '#fcfcfc' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Chunk #1 (ID: chk-1001)</div>
                <div style={{ fontSize: '14px', lineHeight: 1.6 }}>탄소중립은 2050년까지 실질적인 온실가스 배출량을 '0'으로 만드는 것을 목표로 합니다. 본 가이드라인은 기업이 탄소중립을 이행하기 위한...</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px', background: '#fcfcfc' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Chunk #2 (ID: chk-1002)</div>
                <div style={{ fontSize: '14px', lineHeight: 1.6 }}>Scope 1, 2, 3 배출량 산정 방식은 GHG Protocol을 따르며, 직접 배출과 간접 배출을 모두 포함하여 측정해야 합니다...</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entity' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>추출된 Entities (Mock)</h3>
            <table className="table-area">
              <thead>
                <tr>
                  <th>Entity 이름</th>
                  <th>유형(Type)</th>
                  <th>설명(Description)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 500 }}>GHG Protocol</td>
                  <td>STANDARD</td>
                  <td>온실가스 배출량 산정을 위한 글로벌 표준 가이드라인</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 500 }}>Scope 1</td>
                  <td>METRIC</td>
                  <td>기업 소유 및 통제 범위 내에서 발생하는 직접 온실가스 배출</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'job' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>IndexJob 이력 (Mock)</h3>
            <table className="table-area">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>시작 일시</th>
                  <th>종료 일시</th>
                  <th>소요 시간</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#031B4B', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/admin/jobs/JOB-001')}>JOB-001</td>
                  <td>2026-06-22 10:05:00</td>
                  <td>2026-06-22 10:12:30</td>
                  <td>7분 30초</td>
                  <td><span className="badge active">SUCCESS</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default SourceDetail;
