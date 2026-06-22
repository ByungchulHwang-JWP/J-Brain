import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SourceNew = () => {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState('FILE'); // FILE, URL, API
  const [domain, setDomain] = useState('NETZERO');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Source(지식 문서)가 등록되었습니다. (Mock)');
    navigate('/admin/sources');
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span onClick={() => navigate('/admin/sources')} style={{cursor:'pointer', textDecoration:'underline'}}>Source 목록</span> {'>'} <span>Source 등록</span>
      </div>
      
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>Source 등록</h2>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
          
          {/* 1. 도메인 선택 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>도메인 (프로젝트) <span style={{color:'red'}}>*</span></label>
            <select 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '300px' }}
            >
              <option value="NETZERO">NETZERO (탄소중립플랫폼)</option>
              <option value="DPPA">DPPA (직접전력거래)</option>
            </select>
            <span style={{ fontSize: '13px', color: '#888' }}>문서가 귀속될 도메인(프로젝트)을 선택합니다.</span>
          </div>

          {/* 2. Source 유형 선택 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>Source 유형 <span style={{color:'red'}}>*</span></label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="sourceType" value="FILE" checked={sourceType === 'FILE'} onChange={(e) => setSourceType(e.target.value)} />
                <span>파일 업로드 (PDF, DOCX, TXT)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="sourceType" value="URL" checked={sourceType === 'URL'} onChange={(e) => setSourceType(e.target.value)} />
                <span>웹 URL 크롤링</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="sourceType" value="API" checked={sourceType === 'API'} onChange={(e) => setSourceType(e.target.value)} />
                <span>API 연동 (JSON)</span>
              </label>
            </div>
          </div>

          {/* 3. 소스 입력 영역 */}
          {sourceType === 'FILE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px dashed #ccc', padding: '32px', borderRadius: '8px', textAlign: 'center', background: '#fcfcfc' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
              <p style={{ margin: 0, fontWeight: 500 }}>파일을 이곳에 드래그하거나 클릭하여 업로드하세요</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#888', marginTop: '4px' }}>지원 포맷: PDF, DOCX, TXT (최대 50MB)</p>
              <input type="file" onChange={handleFileChange} style={{ marginTop: '16px', marginLeft: 'auto', marginRight: 'auto' }} />
              {fileName && <div style={{ marginTop: '12px', color: '#3069B3', fontWeight: 500 }}>선택된 파일: {fileName}</div>}
            </div>
          )}

          {sourceType === 'URL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '15px' }}>URL 입력</label>
              <input type="url" placeholder="https://example.com" style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }} />
            </div>
          )}

          {/* 4. 고급 옵션 (인덱싱 설정) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>인덱싱 옵션 (GraphRAG)</label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>텍스트 청킹(Chunking) 및 Vector DB 임베딩 생성</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Entity & Relation 추출 (Knowledge Graph 생성)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Community Summarization (Graph 요약) 생성</span>
            </label>
          </div>

          <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/sources')}>취소</button>
            <button type="submit" className="btn-primary">저장 및 목록으로</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SourceNew;
