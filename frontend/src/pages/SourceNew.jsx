import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useProjects from '../hooks/useProjects';

const SourceNew = () => {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState('FILE');
  const { projects } = useProjects();
  const [domain, setDomain] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로젝트 목록 로드 후 첫 번째 자동 선택
  useEffect(() => {
    if (projects.length > 0 && !domain) {
      setDomain(projects[0].id);
    }
  }, [projects]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sourceType === 'FILE' && !file) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ai_access_token');
      
      if (sourceType === 'FILE') {
        const formData = new FormData();
        formData.append('file', file);
        
        await axios.post(`/api/v1/projects/${domain}/sources`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        alert('현재 URL 및 API 연동은 지원되지 않습니다.');
        setIsSubmitting(false);
        return;
      }
      
      alert('지식 문서가 성공적으로 업로드 되었습니다.');
      navigate('/admin/sources');
    } catch (error) {
      console.error(error);
      alert('문서 등록에 실패했습니다: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span onClick={() => navigate('/admin/sources')} style={{cursor:'pointer', textDecoration:'underline'}}>Source 목록</span> {'>'} <span>Source 등록</span>
      </div>
      
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>Source 등록</h2>
      </div>

      <div className="panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
          
          {/* 1. 도메인 선택 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>도메인 (프로젝트) <span style={{color:'red'}}>*</span></label>
            <select 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '300px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', fontFamily: 'inherit', outline: 'none' }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>문서가 귀속될 도메인(프로젝트)을 선택합니다.</span>
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
                <span>웹 URL 프로젝트롤링</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="sourceType" value="API" checked={sourceType === 'API'} onChange={(e) => setSourceType(e.target.value)} />
                <span>API 연동 (JSON)</span>
              </label>
            </div>
          </div>

          {/* 3. 소스 입력 영역 */}
          {sourceType === 'FILE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px dashed var(--color-border)', padding: '32px', borderRadius: '8px', textAlign: 'center', background: 'var(--color-bg-elevated)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-main)' }}>파일을 이곳에 드래그하거나 클릭하여 업로드하세요</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>지원 포맷: PDF, DOCX, TXT (최대 50MB)</p>
              <input type="file" accept=".pdf,.txt,.docx" onChange={handleFileChange} style={{ marginTop: '16px', marginLeft: 'auto', marginRight: 'auto' }} />
              {file && <div style={{ marginTop: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>선택된 파일: {file.name}</div>}
            </div>
          )}

          {sourceType === 'URL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '15px' }}>URL 입력</label>
              <input type="url" placeholder="https://example.com" style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }} />
            </div>
          )}

          {/* 4. 고급 옵션 (인덱싱 설정) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
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

          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '16px', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/sources')} disabled={isSubmitting}>취소</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? '업로드 중...' : '저장 및 목록으로'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SourceNew;
