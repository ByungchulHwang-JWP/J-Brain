import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Skeleton } from '../components/common/Loader';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem('ai_access_token');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/v1/projects/dashboard/stats', {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('대시보드 통계 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const getStatusClass = (status) => {
    if (status === 'success' || status === 'completed') return 'active';
    if (status === 'failed') return 'error';
    if (status === 'running') return 'warning';
    return 'inactive';
  };

  const getStatusLabel = (status) => {
    const map = { success: '성공', completed: '성공', failed: '실패', running: '진행 중', pending: '대기 중' };
    return map[status] || status;
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>대시보드</span> {'>'} <span>운영 현황</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>시스템 운영 현황</h2>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-card-label">등록된 도메인(프로젝트)</div>
          <div className="stat-card-value">
            {loading ? '-' : stats?.project_count ?? 0}
            <span className="stat-card-unit">개</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">총 지식 문서 수 (Sources)</div>
          <div className="stat-card-value">
            {loading ? '-' : (stats?.source_count ?? 0).toLocaleString()}
            <span className="stat-card-unit">건</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">진행 중인 인덱싱 작업</div>
          <div className="stat-card-value">
            {loading ? '-' : stats?.running_jobs ?? 0}
            <span className="stat-card-unit">건</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">금일 챗봇 세션 수</div>
          <div className="stat-card-value">
            {loading ? '-' : stats?.today_sessions ?? 0}
            <span className="stat-card-unit">세션</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 최근 인덱싱 이력 */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>최근 인덱싱 이력</h3>
            <button className="btn-secondary" style={{ height: '30px', padding: '0 12px', fontSize: '12px' }} onClick={() => navigate('/admin/jobs')}>전체보기</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (<tr key={idx}><td><Skeleton width="100px" /></td><td><Skeleton width="200px" /></td><td><Skeleton width="60px" /></td></tr>))
              ) : !stats?.recent_jobs || stats.recent_jobs.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>최근 인덱싱 이력이 없습니다.</td></tr>
              ) : (
                stats.recent_jobs.map((job, idx) => (
                  <tr key={job.id} className={idx < stats.recent_jobs.length - 1 ? 'panel-row' : ''}>
                    <td style={{ padding: '12px 0', color: 'var(--color-text-main)' }}>
                      {job.project_name} ({job.mode})
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {formatTimeAgo(job.started_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${getStatusClass(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 시스템 자원 현황 */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>시스템 자원 현황</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-sub)' }}>DB 연결 상태 (PostgreSQL)</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Connected</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--color-text-sub)' }}>
                <span>Graph Storage 사용량</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>45% (4.5GB / 10GB)</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--color-text-sub)' }}>
                <span>API Rate Limit (OpenAI)</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>12% 사용중</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill success" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
