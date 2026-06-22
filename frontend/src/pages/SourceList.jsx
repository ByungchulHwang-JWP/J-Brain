import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mockSources = [
  { id: 'SRC-001', domain: 'NETZERO', type: 'PDF', filename: '탄소중립_가이드라인.pdf', size: '2.4 MB', status: '인덱싱 완료', created_at: '2026-06-22 10:00' },
  { id: 'SRC-002', domain: 'DPPA', type: 'DOCX', filename: '재생에너지_법규.docx', size: '1.1 MB', status: '대기 중', created_at: '2026-06-21 14:30' },
  { id: 'SRC-003', domain: 'NETZERO', type: 'URL', filename: 'https://example.com/esg-report', size: '-', status: '오류', created_at: '2026-06-20 09:15' },
];

const SourceList = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState(mockSources);
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(sources.map(s => s.id));
    else setSelectedIds([]);
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span>Source 목록</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>Source 목록 (지식 문서)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => alert('선택된 항목 삭제 (Mock)')}>선택 삭제</button>
          <button className="btn-secondary" onClick={() => navigate('/admin/jobs/new')}>선택 항목 인덱싱 실행</button>
          <button className="btn-primary" onClick={() => navigate('/admin/sources/new')}>+ Source 등록</button>
        </div>
      </div>

      {/* 필터 영역 */}
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
          <span style={{ fontSize: '14px', fontWeight: 500 }}>유형</span>
          <select style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option>전체</option>
            <option>PDF</option>
            <option>DOCX</option>
            <option>URL</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>상태</span>
          <select style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option>전체</option>
            <option>대기 중</option>
            <option>인덱싱 완료</option>
            <option>오류</option>
          </select>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="문서명 검색" style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }} />
          <button className="btn-secondary" style={{ padding: '6px 16px' }}>검색</button>
        </div>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th style={{ width: '4%' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === sources.length && sources.length > 0} /></th>
              <th style={{ width: '12%' }}>도메인</th>
              <th style={{ width: '10%' }}>유형</th>
              <th style={{ width: '30%' }}>문서명</th>
              <th style={{ width: '10%' }}>용량</th>
              <th style={{ width: '12%' }}>상태</th>
              <th style={{ width: '12%' }}>등록일</th>
              <th style={{ width: '10%' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(src => (
              <tr key={src.id}>
                <td><input type="checkbox" checked={selectedIds.includes(src.id)} onChange={() => handleSelect(src.id)} /></td>
                <td style={{ fontWeight: 500 }}>{src.domain}</td>
                <td>{src.type}</td>
                <td style={{ cursor: 'pointer', color: '#031B4B', textDecoration: 'underline' }} onClick={() => navigate(`/admin/sources/${src.id}`)}>{src.filename}</td>
                <td style={{ color: '#888' }}>{src.size}</td>
                <td>
                  <span className={`badge ${src.status === '인덱싱 완료' ? 'active' : src.status === '오류' ? 'error' : 'inactive'}`}>
                    {src.status}
                  </span>
                </td>
                <td>{src.created_at}</td>
                <td>
                  <button className="btn-table" onClick={() => navigate(`/admin/sources/${src.id}`)}>상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SourceList;
