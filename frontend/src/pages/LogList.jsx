import React from 'react';

const mockLogs = [
  { id: 'LOG-001', user: 'admin@kt.com', domain: 'NETZERO', query: '탄소중립이란 무엇인가요?', time: '1.2s', feedback: '👍', created_at: '2026-06-22 14:05' },
  { id: 'LOG-002', user: 'user1@kt.com', domain: 'DPPA', query: '전력거래 단가는 얼마인가요?', time: '2.5s', feedback: '-', created_at: '2026-06-22 13:20' },
  { id: 'LOG-003', user: 'user2@kt.com', domain: 'NETZERO', query: 'Scope 1,2,3 분류 기준', time: '1.8s', feedback: '👎', created_at: '2026-06-21 09:15' },
];

const LogList = () => {
  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>테스트/프롬프트</span> {'>'} <span>사용 로그 조회</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>사용 로그 조회</h2>
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
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="질의(Query) 검색" style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '250px' }} />
          <button className="btn-secondary" style={{ padding: '6px 16px' }}>검색</button>
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
            {mockLogs.map(log => (
              <tr key={log.id}>
                <td style={{ color: '#888', fontSize: '13px' }}>{log.id}</td>
                <td style={{ fontWeight: 500 }}>{log.user}</td>
                <td>{log.domain}</td>
                <td style={{ color: '#031B4B', cursor: 'pointer', textDecoration: 'underline' }}>{log.query}</td>
                <td>{log.time}</td>
                <td style={{ fontSize: '16px' }}>{log.feedback}</td>
                <td>{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogList;
