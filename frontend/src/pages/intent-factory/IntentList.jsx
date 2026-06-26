import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useProjects from '../../hooks/useProjects';
import { archiveIntent, importIntentPack, listIntents } from '../../api/intentFactory';

const IntentList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState(searchParams.get('project') || 'J-Brain');
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!searchParams.get('project') && projectId) {
      setSearchParams({ project: projectId }, { replace: true });
    }
  }, [projectId, searchParams, setSearchParams]);

  const fetchIntents = async (targetProjectId = projectId) => {
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

  const activeCount = items.filter((item) => item.status === 'active').length;
  const searchDocCount = items.filter((item) => String(item.category).toUpperCase() === 'SEARCH_DOC').length;
  const scopedCount = items.filter((item) => item.has_source_scope).length;

  const handleProjectChange = (nextProjectId) => {
    setProjectId(nextProjectId);
    setSearchParams({ project: nextProjectId }, { replace: true });
  };

  const handleImport = async () => {
    setImporting(true);
    setMessage('');
    try {
      const result = await importIntentPack(projectId, {
        pack_id: 'netzero-intent-pack-v0.1.0',
        pack_version: '0.1.0',
        overwrite: false,
      });
      setMessage(`Pack Import 완료: ${result.imported}건 등록, ${result.skipped}건 건너뜀`);
      await fetchIntents(projectId);
    } catch (err) {
      console.error(err);
      setMessage('Pack Import에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImporting(false);
    }
  };

  const handleArchive = async (intentId) => {
    if (!window.confirm(`${intentId} Intent를 보관 처리할까요?`)) return;
    try {
      await archiveIntent(projectId, intentId);
      await fetchIntents(projectId);
    } catch (err) {
      console.error(err);
      alert('보관 처리에 실패했습니다.');
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Intent Factory</span> {'>'} <span>Intent 관리</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>Intent 관리</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>프로젝트별 Intent를 DB로 관리하고 Pack Import 결과를 확인합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={{ minWidth: '220px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}>
            {projects.length === 0 && <option value={projectId}>{projectId}</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={handleImport} disabled={importing}>{importing ? 'Import 중...' : '기본 Pack Import'}</button>
          <button className="btn-primary" onClick={() => navigate(`/admin/intent-factory/intents/new?project=${encodeURIComponent(projectId)}`)}>+ Intent 등록</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
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
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>로딩 중...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>등록된 Intent가 없습니다. 기본 Pack Import를 먼저 실행해 주세요.</td></tr>
            ) : filtered.map((item) => (
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
      </div>
    </div>
  );
};

export default IntentList;
