import React from 'react';

const RuntimeEventTable = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-sub)' }}>최근 요청 내역이 없습니다.</div>;
  }

  const getStatusColor = (status, fallback, confidence) => {
    if (status === 'error' || fallback) return '#f44336';
    if (confidence < 0.7) return '#ff9800';
    return '#4caf50';
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    background: 'var(--color-bg-elevated)',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text-sub)',
    fontSize: '13px',
    fontWeight: 600
  };

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text-main)',
    fontSize: '13px'
  };

  return (
    <div className="table-area" style={{
      overflowX: 'auto',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>상태</th>
            <th style={thStyle}>질문</th>
            <th style={thStyle}>매칭 Intent</th>
            <th style={thStyle}>실행 Action</th>
            <th style={thStyle}>Confidence</th>
            <th style={thStyle}>결과</th>
            <th style={thStyle}>Pack 버전</th>
            <th style={thStyle}>시각</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td style={tdStyle}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(log.response_status, log.fallback_yn, log.confidence),
                  marginRight: '8px'
                }} />
                {log.fallback_yn ? 'Fallback' : (log.confidence < 0.7 ? '저신뢰' : '정상')}
              </td>
              <td style={{ ...tdStyle, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {log.question}
              </td>
              <td style={tdStyle}>{log.matched_intent_id || '-'}</td>
              <td style={tdStyle}>{log.action_id || '-'}</td>
              <td style={tdStyle}>{log.confidence ? log.confidence.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{log.response_status || '-'}</td>
              <td style={tdStyle}>{log.active_pack_version || '-'}</td>
              <td style={tdStyle}>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RuntimeEventTable;
