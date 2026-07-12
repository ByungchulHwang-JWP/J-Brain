import toast from 'react-hot-toast';
import { Spinner, Skeleton } from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import {
  archiveAction,
  createAction,
  getAction,
  listActions,
  updateAction,
} from '../../api/intentFactory';

const emptyForm = {
  action_id: '',
  action_name: '',
  action_type: 'NAVIGATE',
  description: '',
  execution_mode: 'local',
  route_value: '',
  menu_name: '',
  api_method: 'GET',
  api_endpoint: '',
  sql_template: '',
  allowed_roles_text: 'ROLE_ADMIN',
  status: 'active',
};

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
};

const textareaStyle = {
  ...fieldStyle,
  minHeight: '90px',
  resize: 'vertical',
};

const parseRoles = (value) => (
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

const rolesToText = (roles) => (Array.isArray(roles) ? roles.join(', ') : '');

const generateActionId = (projectId, actionType = 'NAVIGATE') => {
  const normalizedProjectId = String(projectId || 'PROJECT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PROJECT';
  return `ACT-${normalizedProjectId}-${actionType}-${Date.now().toString().slice(-6)}`;
};

const ActionList = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const projectId = selectedProjectId;
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadActions = async (targetProjectId = projectId) => {
    if (!targetProjectId) {
      setItems([]);
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await listActions(targetProjectId);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('Action 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions(projectId);
    setSelectedActionId(null);
    setForm({ ...emptyForm, action_id: generateActionId(projectId, emptyForm.action_type) });
  }, [projectId]);

  const filteredItems = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [
      item.action_id,
      item.action_name,
      item.action_type,
      item.route_value,
      item.api_endpoint,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [items, keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, projectId]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const stats = useMemo(() => {
    const byType = items.reduce((acc, item) => {
      acc[item.action_type] = (acc[item.action_type] || 0) + 1;
      return acc;
    }, {});
    return [
      ['전체 Action', `${items.length}건`],
      ['화면 이동', `${byType.NAVIGATE || 0}건`],
      ['문서 검색', `${byType.SEARCH_DOC || 0}건`],
      ['정형 조회', `${byType.QUERY || 0}건`],
    ];
  }, [items]);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleNew = () => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setSelectedActionId(null);
    setForm({ ...emptyForm, action_id: generateActionId(projectId, emptyForm.action_type) });
    setMessage('신규 Action을 등록할 수 있습니다.');
  };

  const handleSelect = async (actionId) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setSelectedActionId(actionId);
    setMessage('');
    try {
      const detail = await getAction(projectId, actionId);
      setForm({
        action_id: detail.action_id || '',
        action_name: detail.action_name || '',
        action_type: detail.action_type || 'NAVIGATE',
        description: detail.description || '',
        execution_mode: detail.execution_mode || 'local',
        route_value: detail.route_value || '',
        menu_name: detail.menu_name || '',
        api_method: detail.api_method || 'GET',
        api_endpoint: detail.api_endpoint || '',
        sql_template: detail.sql_template || '',
        allowed_roles_text: rolesToText(detail.allowed_roles || []),
        status: detail.status || 'active',
      });
    } catch (err) {
      console.error(err);
      setMessage('Action 상세 정보를 불러오지 못했습니다.');
    }
  };

  const buildPayload = () => ({
    action_id: (form.action_id || generateActionId(projectId, form.action_type)).trim(),
    action_name: form.action_name.trim(),
    action_type: form.action_type,
    description: form.description.trim() || null,
    execution_mode: form.execution_mode,
    route_value: form.route_value.trim() || null,
    menu_name: form.menu_name.trim() || null,
    api_method: form.api_method.trim() || null,
    api_endpoint: form.api_endpoint.trim() || null,
    sql_template: form.sql_template.trim() || null,
    allowed_roles: parseRoles(form.allowed_roles_text),
    status: form.status,
  });

  const handleSave = async () => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!form.action_id.trim()) {
      toast.error('Action ID를 입력해 주세요.');
      return;
    }
    if (!form.action_name.trim()) {
      toast.error('Action 이름을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (selectedActionId) {
        const { action_id: _ignored, ...updatePayload } = payload;
        await updateAction(projectId, selectedActionId, updatePayload);
      } else {
        await createAction(projectId, payload);
        setSelectedActionId(payload.action_id);
      }
      setMessage('Action이 저장되었습니다. Pack Builder에서 Export하면 파일 Pack에 반영됩니다.');
      await loadActions(projectId);
    } catch (err) {
      console.error(err);
      setMessage('Action 저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedActionId) return;
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!window.confirm(`${selectedActionId} Action을 보관 처리할까요?`)) return;
    try {
      await archiveAction(projectId, selectedActionId);
      setSelectedActionId(null);
      setForm(emptyForm);
      setMessage('Action이 보관 처리되었습니다.');
      await loadActions(projectId);
    } catch (err) {
      console.error(err);
      setMessage('Action 보관 처리에 실패했습니다.');
    }
  };

  const showRouteFields = form.action_type === 'NAVIGATE';
  const showApiFields = form.action_type === 'API' || form.action_type === 'QUERY';
  const showSqlFields = form.action_type === 'QUERY';

  return (
    <div className={embedded ? '' : 'inner'}>
      {!embedded && (
        <div className="breadcrumb">
          <span>Intent Factory</span> {'>'} <span>Action 관리</span>
        </div>
      )}

      <div className={embedded ? 'console-embedded-toolbar' : 'page-header'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: embedded ? undefined : '12px 0 20px', margin: 0 }}>
        <div>
          {embedded ? <h3>Action 관리</h3> : <h2 style={{ fontWeight: 700 }}>Action 관리</h2>}
          {!embedded && (
            <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
              Intent가 실행할 화면 이동, 문서 검색, 정형 조회, 안내 Action을 등록하고 Pack Export에 반영합니다.
            </p>
          )}
        </div>
        <div className="responsive-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={() => loadActions(projectId)} disabled={loading}>{loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}</button>
          <button className="btn-primary" onClick={handleNew} disabled={!projectId}>Action 등록</button>
        </div>
      </div>

      <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {stats.map(([label, value]) => (
          <div key={label} className="table-area" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
            <strong style={{ fontSize: '22px', color: 'var(--color-primary)' }}>{value}</strong>
          </div>
        ))}
      </div>

      {message && (
        <div className="table-area" style={{ padding: '14px 16px', marginBottom: '18px', color: 'var(--color-text-sub)' }}>
          {message}
        </div>
      )}

      <div className="responsive-split-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(520px, 1fr) minmax(420px, 0.8fr)', gap: '18px', alignItems: 'start' }}>
        <div className="table-area" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Action 목록</h3>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Action ID, 이름, 유형, URL/API 검색"
              style={{ width: '320px', ...fieldStyle }}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Action ID</th>
                <th>이름</th>
                <th>유형</th>
                <th>연결 Intent</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                    등록된 Action이 없습니다.
                  </td>
                </tr>
              ) : paginatedItems.map((item) => (
                <tr
                  key={item.action_id}
                  onClick={() => handleSelect(item.action_id)}
                  style={{ cursor: 'pointer', background: selectedActionId === item.action_id ? 'var(--color-bg-elevated)' : undefined }}
                >
                  <td><strong>{item.action_id}</strong></td>
                  <td>{item.action_name}</td>
                  <td><span className="badge active">{item.action_type}</span></td>
                  <td>{item.linked_intent_count || 0}건</td>
                  <td>{item.status}</td>
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

        <div className="table-area" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedActionId ? 'Action 상세/수정' : 'Action 등록'}</h3>
            {selectedActionId && <button className="btn-secondary" onClick={handleArchive}>보관</button>}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label>
              <span className="modal-label">Action ID</span>
              <input value={form.action_id} disabled={Boolean(selectedActionId)} onChange={(e) => updateForm({ action_id: e.target.value })} style={fieldStyle} placeholder="예: ACT-JB-GO-DASHBOARD" />
            </label>

            <label>
              <span className="modal-label">Action 이름</span>
              <input value={form.action_name} onChange={(e) => updateForm({ action_name: e.target.value })} style={fieldStyle} placeholder="예: 운영 현황 화면 이동" />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <span className="modal-label">Action 유형</span>
                <select value={form.action_type} onChange={(e) => {
                  const newType = e.target.value;
                  if (!selectedActionId) {
                    updateForm({ action_type: newType, action_id: generateActionId(projectId, newType) });
                  } else {
                    updateForm({ action_type: newType });
                  }
                }} style={fieldStyle}>
                  <option value="NAVIGATE">NAVIGATE</option>
                  <option value="SEARCH_DOC">SEARCH_DOC</option>
                  <option value="QUERY">QUERY</option>
                  <option value="GUIDE">GUIDE</option>
                  <option value="API">API</option>
                </select>
              </label>
              <label>
                <span className="modal-label">실행 방식</span>
                <select value={form.execution_mode} onChange={(e) => updateForm({ execution_mode: e.target.value })} style={fieldStyle}>
                  <option value="local">local</option>
                  <option value="screen">screen</option>
                  <option value="api">api</option>
                  <option value="sql_template">sql_template</option>
                </select>
              </label>
            </div>

            <label>
              <span className="modal-label">설명</span>
              <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} style={textareaStyle} placeholder="운영자가 Action 목적을 이해할 수 있는 설명을 입력합니다." />
            </label>

            {showRouteFields && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  <span className="modal-label">메뉴명</span>
                  <input value={form.menu_name} onChange={(e) => updateForm({ menu_name: e.target.value })} style={fieldStyle} placeholder="예: 운영 현황" />
                </label>
                <label>
                  <span className="modal-label">화면 URL</span>
                  <input value={form.route_value} onChange={(e) => updateForm({ route_value: e.target.value })} style={fieldStyle} placeholder="예: /admin/dashboard" />
                </label>
              </div>
            )}

            {showApiFields && (
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <label>
                  <span className="modal-label">Method</span>
                  <select value={form.api_method} onChange={(e) => updateForm({ api_method: e.target.value })} style={fieldStyle}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </label>
                <label>
                  <span className="modal-label">API Endpoint</span>
                  <input value={form.api_endpoint} onChange={(e) => updateForm({ api_endpoint: e.target.value })} style={fieldStyle} placeholder="예: /api/v1/projects/{project_id}/dashboard/stats" />
                </label>
              </div>
            )}

            {showSqlFields && (
              <label>
                <span className="modal-label">SQL Template</span>
                <textarea value={form.sql_template} onChange={(e) => updateForm({ sql_template: e.target.value })} style={{ ...textareaStyle, minHeight: '130px', fontFamily: 'monospace' }} placeholder="SELECT ... WHERE project_id = :project_id" />
              </label>
            )}

            <label>
              <span className="modal-label">허용 Role</span>
              <input value={form.allowed_roles_text} onChange={(e) => updateForm({ allowed_roles_text: e.target.value })} style={fieldStyle} placeholder="예: ROLE_ADMIN, ROLE_OPERATOR" />
            </label>

            <label>
              <span className="modal-label">상태</span>
              <select value={form.status} onChange={(e) => updateForm({ status: e.target.value })} style={fieldStyle}>
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="disabled">disabled</option>
              </select>
            </label>

            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionList;
