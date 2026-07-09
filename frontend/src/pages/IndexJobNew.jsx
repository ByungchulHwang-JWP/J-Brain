import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useProjects from '../hooks/useProjects';

const IndexJobNew = () => {
  const navigate = useNavigate();
  const [jobType, setJobType] = useState('FULL_INDEX');
  const { projects } = useProjects();
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로젝트 목록 로드 후 첫 번째 자동 선택
  useEffect(() => {
    if (projects.length > 0 && !domain) {
      setDomain(projects[0].id);
    }
  }, [projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('ai_access_token');
      const res = await axios.post(`/api/v1/projects/${domain}/jobs`, {
        source_ids: ["SRC-ALL"], // 임시로 전체 문서 지정
        mode: jobType,
        options: {}
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('인덱싱 작업이 시작되었습니다.');
      navigate('/admin/jobs');
    } catch (error) {
      console.error(error);
      toast.error('작업 실행에 실패했습니다: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>지식 관리</span> {'>'} <span onClick={() => navigate('/admin/jobs')} style={{cursor:'pointer', textDecoration:'underline'}}>인덱싱 작업 현황</span> {'>'} <span>인덱싱 작업 실행</span>
      </div>
      
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>수동 인덱싱 작업(IndexJob) 실행</h2>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-main)' }}>대상 도메인 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%', maxWidth: '400px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', fontFamily: 'inherit', outline: 'none' }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>대상 문서 (Source) <span style={{color:'red'}}>*</span></label>
            <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-elevated)' }}>
              <div style={{ marginBottom: '12px', color: 'var(--color-text-main)' }}><label style={{ cursor: 'pointer' }}><input type="radio" name="sourceTarget" defaultChecked style={{ marginRight: '8px', accentColor: 'var(--color-primary)' }} /> 모든 문서 (미인덱싱된 신규/변경건 자동 판별)</label></div>
              <div style={{ color: 'var(--color-text-main)' }}><label style={{ cursor: 'pointer' }}><input type="radio" name="sourceTarget" style={{ marginRight: '8px', accentColor: 'var(--color-primary)' }} /> 특정 문서 선택 (클릭 시 모달 오픈)</label></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>작업 유형 <span style={{color:'red'}}>*</span></label>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="jobType" value="FULL_INDEX" checked={jobType === 'FULL_INDEX'} onChange={(e) => setJobType(e.target.value)} />
                <span style={{ fontWeight: 500 }}>FULL_INDEX (전체 재색인)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="jobType" value="UPDATE_INDEX" checked={jobType === 'UPDATE_INDEX'} onChange={(e) => setJobType(e.target.value)} />
                <span style={{ fontWeight: 500 }}>UPDATE_INDEX (증분 색인)</span>
              </label>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>* FULL_INDEX는 기존 지식 그래프를 덮어쓰므로 시간이 오래 걸립니다.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>고급 파라미터 재정의 (선택)</label>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '80px', fontSize: '14px' }}>Chunk Size</span>
                <input type="number" defaultValue={1000} style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '120px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '80px', fontSize: '14px', color: 'var(--color-text-sub)' }}>Overlap</span>
                <input type="number" defaultValue={200} style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '120px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '24px', paddingTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button type="button" className="btn-secondary" style={{ width: '160px', height: '48px', fontSize: '15px', padding: 0 }} onClick={() => navigate('/admin/jobs')} disabled={isSubmitting}>취소</button>
            <button type="submit" className="btn-primary" style={{ width: '160px', height: '48px', fontSize: '15px', padding: 0 }} disabled={isSubmitting}>{isSubmitting ? '요청 중...' : '작업 실행 (Run Job)'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IndexJobNew;
