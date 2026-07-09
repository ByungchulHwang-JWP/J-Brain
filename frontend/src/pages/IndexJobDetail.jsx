import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from '../components/common/Loader';

const IndexJobDetail = () => {
  const { projectId, jobId } = useParams();
  const navigate = useNavigate();
  const [jobDetail, setJobDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const token = () => localStorage.getItem('ai_access_token');
  const wid = projectId || 'NETZERO';

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`/api/v1/projects/${wid}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setJobDetail(res.data);
      
      if (res.data.status === 'processing' || res.data.status === 'pending') {
        timerRef.current = setTimeout(fetchDetail, 3000);
      }
    } catch (err) {
      console.error(err);
      if (loading) toast.error('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wid, jobId]);

  if (loading) return <div className="inner" style={{ padding: '60px', textAlign: 'center' }}><Spinner size={32} color="var(--color-primary)" /><p style={{marginTop: 16, color: 'var(--color-text-muted)'}}>데이터를 불러오는 중입니다...</p></div>;
  if (!jobDetail) return <div className="inner" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>작업을 찾을 수 없습니다.</div>;

  const isFailed = jobDetail.status === 'failed';

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>지식 관리</span> {'>'} <span onClick={() => navigate('/admin/jobs')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>인덱싱 작업 현황</span> {'>'} <span>작업 상세</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>{jobDetail.id} 작업 상세</h2>
        <button className="btn-secondary" onClick={() => navigate('/admin/jobs')}>목록으로</button>
      </div>

      {/* 진행 상태 패널 */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>진행 상태 ({jobDetail.progress}%)</h3>
        <div className="progress-track" style={{ height: '20px', borderRadius: '10px' }}>
          <div
            className={`progress-fill ${isFailed ? 'danger' : ''}`}
            style={{ width: `${jobDetail.progress}%`, borderRadius: '10px', transition: 'width 0.5s ease' }}
          ></div>
        </div>
        
        <div style={{ display: 'flex', gap: '40px', fontSize: '14px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--color-text-sub)' }}>대상 파일: <strong style={{ color: 'var(--color-primary)' }}>{jobDetail.source_name}</strong></div>
          <div style={{ color: 'var(--color-text-sub)' }}>상태: <span className={`badge ${jobDetail.status === 'success' ? 'active' : isFailed ? 'error' : 'warning'}`}>{jobDetail.status.toUpperCase()}</span></div>
          <div style={{ color: 'var(--color-text-sub)' }}>시작: <span style={{ color: 'var(--color-text-main)' }}>{jobDetail.started_at}</span></div>
          <div style={{ color: 'var(--color-text-sub)' }}>종료: <span style={{ color: 'var(--color-text-main)' }}>{jobDetail.completed_at}</span></div>
        </div>

        {jobDetail.error_message && (
          <div className="error-box">
            <strong>오류:</strong> {jobDetail.error_message}
          </div>
        )}
      </div>

      {/* 상세 단계 패널 */}
      <div className="panel">
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>상세 단계 (Steps)</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobDetail.steps.map((step, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: step.status === 'completed'
                  ? 'var(--color-primary)'
                  : 'var(--color-bg-elevated)',
                border: step.status === 'completed'
                  ? 'none'
                  : '2px solid var(--color-border)',
                color: step.status === 'completed' ? '#fff' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px'
              }}>
                {step.status === 'completed' ? '✓' : idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px', fontWeight: 500,
                  color: step.status === 'pending' ? 'var(--color-text-muted)' : 'var(--color-text-main)'
                }}>{step.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {step.status === 'processing' ? '진행 중...' : step.status === 'completed' ? '완료' : '대기'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IndexJobDetail;
