import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IndexJobNew = () => {
  const navigate = useNavigate();
  const [jobType, setJobType] = useState('FULL_INDEX');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('IndexJob이 실행되었습니다. 모니터링 화면으로 이동합니다. (Mock)');
    navigate('/admin/jobs/JOB-1003');
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>지식 관리</span> {'>'} <span onClick={() => navigate('/admin/jobs')} style={{cursor:'pointer', textDecoration:'underline'}}>인덱싱 작업 현황</span> {'>'} <span>인덱싱 작업 실행</span>
      </div>
      
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>수동 인덱싱 작업(IndexJob) 실행</h2>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '32px', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>대상 도메인 <span style={{color:'red'}}>*</span></label>
            <select style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '300px' }}>
              <option>NETZERO (탄소중립플랫폼)</option>
              <option>DPPA (직접전력거래)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>대상 문서 (Source) <span style={{color:'red'}}>*</span></label>
            <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f8f9fa' }}>
              <div style={{ marginBottom: '8px' }}><input type="radio" name="sourceTarget" defaultChecked /> 모든 문서 (미인덱싱된 신규/변경건 자동 판별)</div>
              <div><input type="radio" name="sourceTarget" /> 특정 문서 선택 (클릭 시 모달 오픈)</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>작업 유형 <span style={{color:'red'}}>*</span></label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="jobType" value="FULL_INDEX" checked={jobType === 'FULL_INDEX'} onChange={(e) => setJobType(e.target.value)} />
                <span>FULL_INDEX (전체 재색인)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="jobType" value="UPDATE_INDEX" checked={jobType === 'UPDATE_INDEX'} onChange={(e) => setJobType(e.target.value)} />
                <span>UPDATE_INDEX (증분 색인)</span>
              </label>
            </div>
            <span style={{ fontSize: '13px', color: '#888' }}>* FULL_INDEX는 기존 지식 그래프를 덮어쓰므로 시간이 오래 걸립니다.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
            <label style={{ fontWeight: 600, fontSize: '15px' }}>고급 파라미터 재정의 (선택)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '120px', fontSize: '14px' }}>Chunk Size</span>
              <input type="number" defaultValue={1000} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '120px', fontSize: '14px' }}>Overlap</span>
              <input type="number" defaultValue={200} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/jobs')}>취소</button>
            <button type="submit" className="btn-primary">작업 실행 (Run Job)</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IndexJobNew;
