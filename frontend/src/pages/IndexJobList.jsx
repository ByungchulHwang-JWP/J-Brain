import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useProjects from '../hooks/useProjects';
import { Skeleton } from '../components/common/Loader';

const IndexJobList = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { projects } = useProjects();
  const [domain, setDomain] = useState('');

  // 프로젝트 목록 로드 후 첫 번째 프로젝트 자동 선택
  useEffect(() => {
    if (projects.length > 0 && !domain) {
      setDomain(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (domain) fetchJobs();
  }, [domain]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ai_access_token');
      const res = await axios.get(`/api/v1/projects/${domain}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mapped = res.data.map(job => ({...job, domain: domain}));
      setJobs(mapped);
    } catch (error) {
      console.error(error);
      toast.error('인덱싱 작업 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embedded ? '' : 'inner'}>
      {!embedded && (
        <div className="breadcrumb">
          <span>지식 관리</span> {'>'} <span>벡터화 작업 현황</span>
        </div>
      )}

      <div className={embedded ? 'console-embedded-toolbar' : 'page-header'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: embedded ? undefined : '12px 0 20px', margin: '0' }}>
        {embedded ? <h3>벡터화 작업 현황</h3> : <h2 style={{ fontWeight: 700 }}>벡터화 작업(IndexJob) 현황</h2>}
        <button className="btn-primary" onClick={() => navigate('/admin/jobs/new')}>+ 수동 작업 실행</button>
      </div>

      {/* 필터 바 */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>프로젝트</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value)}>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>상태</span>
          <select>
            <option>전체</option>
            <option>진행 중</option>
            <option>성공</option>
            <option>실패</option>
          </select>
        </div>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Job ID</th>
              <th style={{ width: '12%' }}>프로젝트</th>
              <th style={{ width: '15%' }}>작업 대상</th>
              <th style={{ width: '12%' }}>유형</th>
              <th style={{ width: '10%' }}>진행률</th>
              <th style={{ width: '10%' }}>상태</th>
              <th style={{ width: '15%' }}>시작 일시</th>
              <th style={{ width: '16%' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (<tr key={idx}><td><Skeleton width="80px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="120px" /></td><td><Skeleton width="80px" /></td><td><Skeleton width="100px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="150px" /></td><td><Skeleton width="80px" /></td></tr>))
            ) : jobs.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>인덱싱 작업 내역이 없습니다.</td></tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/admin/projects/${job.domain}/jobs/${job.id}`)}>{job.id}</td>
                  <td style={{ color: 'var(--color-text-main)' }}>{job.domain}</td>
                  <td style={{ color: 'var(--color-text-sub)' }}>{job.target_count}개 문서</td>
                  <td><span className="badge inactive">{job.type}</span></td>
                  <td>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${job.status === 'failed' ? 'danger' : ''}`}
                        style={{ width: `${job.status === 'success' ? 100 : job.status === 'running' ? 50 : 10}%` }}
                      ></div>
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {job.status === 'success' ? 100 : job.status === 'running' ? 50 : 10}%
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${job.status === 'success' ? 'active' : job.status === 'failed' ? 'error' : 'inactive'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{job.started_at}</td>
                  <td>
                    <button className="btn-table" onClick={() => navigate(`/admin/projects/${job.domain}/jobs/${job.id}`)}>모니터링</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndexJobList;
