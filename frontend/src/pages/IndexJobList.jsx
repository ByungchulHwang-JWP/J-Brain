import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mockJobs = [
  { id: 'JOB-1002', domain: 'NETZERO', sourceCount: 1, type: 'FULL_INDEX', status: '진행 중', progress: 45, start_time: '2026-06-22 14:00', end_time: '-' },
  { id: 'JOB-1001', domain: 'DPPA', sourceCount: 3, type: 'UPDATE_INDEX', status: '성공', progress: 100, start_time: '2026-06-21 09:00', end_time: '2026-06-21 09:15' },
  { id: 'JOB-1000', domain: 'NETZERO', sourceCount: 5, type: 'FULL_INDEX', status: '실패', progress: 12, start_time: '2026-06-20 18:00', end_time: '2026-06-20 18:05' },
];

const IndexJobList = () => {
  const navigate = useNavigate();
  const [jobs] = useState(mockJobs);

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>지식 관리</span> {'>'} <span>인덱싱 작업 현황</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>인덱싱 작업(IndexJob) 현황</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={() => navigate('/admin/jobs/new')}>+ 수동 작업 실행</button>
        </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>도메인</span>
          <select style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option>전체</option>
            <option>NETZERO</option>
            <option>DPPA</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>상태</span>
          <select style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
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
              <th style={{ width: '12%' }}>도메인</th>
              <th style={{ width: '15%' }}>작업 대상</th>
              <th style={{ width: '12%' }}>유형</th>
              <th style={{ width: '10%' }}>진행률</th>
              <th style={{ width: '10%' }}>상태</th>
              <th style={{ width: '15%' }}>시작 일시</th>
              <th style={{ width: '16%' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td style={{ fontWeight: 600, color: '#031B4B', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/admin/jobs/${job.id}`)}>{job.id}</td>
                <td>{job.domain}</td>
                <td>{job.sourceCount}개 문서</td>
                <td><span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{job.type}</span></td>
                <td>
                  <div style={{ width: '100%', background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${job.progress}%`, background: job.status === '실패' ? '#e74c3c' : '#3069B3', height: '100%' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px', textAlign: 'right' }}>{job.progress}%</div>
                </td>
                <td>
                  <span className={`badge ${job.status === '성공' ? 'active' : job.status === '실패' ? 'error' : 'inactive'}`}>
                    {job.status}
                  </span>
                </td>
                <td>{job.start_time}</td>
                <td>
                  <button className="btn-table" onClick={() => navigate(`/admin/jobs/${job.id}`)}>모니터링</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndexJobList;
