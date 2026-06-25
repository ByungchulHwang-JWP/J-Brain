import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useProjects from '../hooks/useProjects';

const LogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const { projects } = useProjects();

  const token = () => localStorage.getItem('ai_access_token');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/logs', {
        headers: { Authorization: `Bearer ${token()}` },
        params: { domain: domainFilter, query: searchQuery }
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      alert('로그 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSearch = () => fetchLogs();
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>테스트/프롬프트</span> {'>'} <span>사용 로그 조회</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>사용 로그 조회</h2>
      </div>

      {/* 필터 바 */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>도메인</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option>전체</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="질의(Query) 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              height: '36px', padding: '0 12px',
              border: '1px solid var(--color-border)', borderRadius: '6px',
              width: '250px', background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-main)', fontSize: '13px', fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button className="btn-secondary" style={{ height: '36px', padding: '0 16px' }} onClick={handleSearch}>검색</button>
        </div>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Log ID</th>
              <th style={{ width: '12%' }}>사용자</th>
              <th style={{ width: '10%' }}>도메인</th>
              <th style={{ width: '35%' }}>질의 (Query)</th>
              <th style={{ width: '10%' }}>소요 시간</th>
              <th style={{ width: '10%' }}>피드백</th>
              <th style={{ width: '15%' }}>발생 일시</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>로딩 중...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>해당 조건의 로그가 없습니다.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                    {log.id.length > 8 ? log.id.substring(0, 8) : log.id}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{log.user}</td>
                  <td style={{ color: 'var(--color-text-sub)' }}>{log.domain}</td>
                  <td style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>{log.query}</td>
                  <td style={{ color: 'var(--color-text-sub)' }}>{log.time}</td>
                  <td style={{ fontSize: '16px' }}>{log.feedback}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{log.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogList;
