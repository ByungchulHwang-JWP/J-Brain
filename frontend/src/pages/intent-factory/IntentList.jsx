import toast from 'react-hot-toast';
import { Skeleton } from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import { archiveIntent, listIntents } from '../../api/intentFactory';

const IntentList = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const projectId = selectedProjectId;
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const requestedProjectId = searchParams.get('project') || searchParams.get('projectId');
    if (requestedProjectId && requestedProjectId !== selectedProjectId) {
      setSelectedProjectId(requestedProjectId);
    }
  }, [searchParams, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (!searchParams.get('project') && projectId) {
      setSearchParams({ project: projectId }, { replace: true });
    }
  }, [projectId, searchParams, setSearchParams]);

  const fetchIntents = async (targetProjectId = projectId) => {
    if (!targetProjectId) {
      setItems([]);
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await listIntents(targetProjectId);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('Intent 목록을 불러오지 못했습니다. 백엔드 서버와 DB 연결 상태를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIntents(projectId); }, [projectId]);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => [
      item.intent_id,
      item.intent_name,
      item.category,
      item.action_id,
      item.status,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [items, keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, projectId]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const activeCount = items.filter((item) => item.status === 'active').length;
  const searchDocCount = items.filter((item) => String(item.category).toUpperCase() === 'SEARCH_DOC').length;
  const scopedCount = items.filter((item) => item.has_source_scope).length;

  const handleProjectChange = (nextProjectId) => {
    setSelectedProjectId(nextProjectId);
    setSearchParams({ project: nextProjectId }, { replace: true });
  };


  const handleArchive = async (intentId) => {
    if (!window.confirm(`${intentId} Intent를 보관 처리할까요?`)) return;
    try {
      await archiveIntent(projectId, intentId);
      await fetchIntents(projectId);
    } catch (err) {
      console.error(err);
      toast.error('보관 처리에 실패했습니다.');
    }
  };

  return (
    <div className={embedded ? '' : 'inner'}>
      {!embedded && (
        <div className="breadcrumb">
          <span>Intent Factory</span> {'>'} <span>Intent 관리</span>
        </div>
      )}
      <div className={embedded ? 'console-embedded-toolbar' : 'page-header'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: embedded ? undefined : '12px 0 20px', margin: 0 }}>
        <div>
          {embedded ? <h3>Intent 관리</h3> : <h2 style={{ fontWeight: 700 }}>Intent 관리</h2>}
          {!embedded && (
            <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
              프로젝트별 Intent를 DB로 관리합니다. Source 기반 자동 생성은 AI Copilot 단계에서 별도로 제공합니다.
            </p>
          )}
        </div>
        <div className="responsive-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={{ minWidth: '220px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}>
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-primary" onClick={() => navigate(`/admin/intent-factory/intents/new?project=${encodeURIComponent(projectId)}`)} disabled={!projectId}>+ Intent 등록</button>
        </div>
      </div>

      <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {[
          ['전체 Intent', `${items.length}건`],
          ['Active', `${activeCount}건`],
          ['SEARCH_DOC', `${searchDocCount}건`],
          ['Source 범위 설정', `${scopedCount}건`],
        ].map(([label, value]) => (
          <div key={label} className="table-area" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
            <strong style={{ fontSize: '24px', color: 'var(--color-primary)' }}>{value}</strong>
          </div>
        ))}
      </div>

      <div className="table-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Intent ID, 이름, Category, Action 검색"
            style={{ width: '360px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}
          />
          <button className="btn-secondary" onClick={() => fetchIntents(projectId)}>새로고침</button>
        </div>
        {message && <div style={{ padding: '12px 18px', color: 'var(--color-text-sub)', borderBottom: '1px solid var(--color-border)' }}>{message}</div>}
        <table>
          <thead>
            <tr>
              <th>Intent ID</th>
              <th>Intent 이름</th>
              <th>Category</th>
              <th>Action</th>
              <th>예시 질문</th>
              <th>Source 범위</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (<tr key={idx}><td><Skeleton width="100px" /></td><td><Skeleton width="150px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="120px" /></td><td><Skeleton width="40px" /></td><td><Skeleton width="80px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="80px" /></td></tr>))
            ) : paginatedItems.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>등록된 Intent가 없습니다. Intent를 새로 등록해 주세요.</td></tr>
            ) : paginatedItems.map((item) => (
              <tr key={item.intent_id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.intent_id}</td>
                <td style={{ fontWeight: 600 }}>{item.intent_name}</td>
                <td><span className="badge active">{item.category}</span></td>
                <td style={{ color: 'var(--color-text-sub)' }}>{item.action_id || '-'}</td>
                <td>{item.example_count || 0}건</td>
                <td>{item.has_source_scope ? '설정됨' : '-'}</td>
                <td>{item.status}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-table" onClick={() => navigate(`/admin/intent-factory/intents/${encodeURIComponent(item.intent_id)}?project=${encodeURIComponent(projectId)}`)}>수정</button>
                    <button className="btn-table" onClick={() => handleArchive(item.intent_id)}>보관</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
};

export default IntentList;
