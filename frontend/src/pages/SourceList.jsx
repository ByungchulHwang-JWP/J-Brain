import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useProjects from '../hooks/useProjects';

const SourceList = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [domainFilter, setDomainFilter] = useState('');
  const { projects } = useProjects();

  const token = () => localStorage.getItem('ai_access_token');

  // 프로젝트 로드 후 첫 번째 자동 선택
  useEffect(() => {
    if (projects.length > 0 && !domainFilter) {
      setDomainFilter(projects[0].id);
    }
  }, [projects, domainFilter]);

  useEffect(() => {
    if (!domainFilter) return;
    const fetchSources = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/v1/projects/${domainFilter}/sources`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setSources(res.data || []);
      } catch (err) {
        console.error('문서 목록 조회 실패:', err);
        setSources([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, [domainFilter]);


  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(sources.map(s => s.id));
    else setSelectedIds([]);
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!window.confirm('선택한 문서를 삭제하시겠습니까? 관련 데이터(인덱싱)도 모두 삭제됩니다.')) return;

    try {
      for (const id of selectedIds) {
        await axios.delete(`/api/v1/projects/${domainFilter}/sources/${id}`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
      }
      alert('삭제가 완료되었습니다.');
      setSelectedIds([]);
      // 목록 새로고침
      const res = await axios.get(`/api/v1/projects/${domainFilter}/sources`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setSources(res.data || []);
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span>Source 목록</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>Source 목록 (지식 문서)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleDelete}>선택 삭제</button>
          <button className="btn-secondary" onClick={() => navigate('/admin/jobs/new')}>선택 항목 인덱싱 실행</button>
          <button className="btn-primary" onClick={() => navigate('/admin/sources/new')}>+ Source 등록</button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-sub)' }}>도메인</span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-sub)' }}>유형</span>
          <select>
            <option>전체</option>
            <option>PDF</option>
            <option>DOCX</option>
            <option>URL</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-sub)' }}>상태</span>
          <select>
            <option>전체</option>
            <option>대기 중</option>
            <option>인덱싱 완료</option>
            <option>오류</option>
          </select>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="문서명 검색" style={{ width: '200px' }} />
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
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>로딩 중...</td></tr>
            ) : sources.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>등록된 문서가 없습니다.</td></tr>
            ) : (
              sources.map(src => (
                <tr key={src.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(src.id)} onChange={() => handleSelect(src.id)} /></td>
                  <td style={{ fontWeight: 500 }}>{domainFilter}</td>
                  <td>{src.source_type || src.type || '-'}</td>
                  <td style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }} onClick={() => navigate(`/admin/sources/${src.id}`)}>{src.filename || src.name || src.id}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{src.size || '-'}</td>
                  <td>
                    <span className={`badge ${src.status === '인덱싱 완료' || src.status === 'completed' ? 'active' : src.status === '오류' || src.status === 'failed' ? 'error' : 'inactive'}`}>
                      {src.status}
                    </span>
                  </td>
                  <td>{src.created_at}</td>
                  <td>
                    <button className="btn-table" onClick={() => navigate(`/admin/sources/${src.id}`)}>상세</button>
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

export default SourceList;
