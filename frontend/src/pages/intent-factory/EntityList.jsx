import toast from 'react-hot-toast';
import { Skeleton } from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import { archiveEntity, createEntity, getEntity, listEntities, updateEntity } from '../../api/intentFactory';

const EntityList = ({ mode = 'entities', embedded = false }) => {
  const isSynonym = mode === 'synonyms';
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const projectId = selectedProjectId;
  const [entities, setEntities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const emptyForm = {
    entity_type: '',
    display_name: '',
    value_type: 'string',
    required_validation: false,
    normalization_rule: 'entity_synonyms',
    description: '',
    status: 'active',
    synonyms: [],
  };
  const [form, setForm] = useState(emptyForm);
  const [synonymInput, setSynonymInput] = useState('');

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

  const fetchEntities = async () => {
    if (!projectId) {
      setEntities([]);
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await listEntities(projectId);
      setEntities(data.items || []);
    } catch (err) {
      console.error(err);
      setEntities([]);
      setMessage('Entity 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntities(); }, [projectId]);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return entities;
    return entities.filter((entity) => [
      entity.entity_type,
      entity.display_name,
      entity.value_type,
      entity.normalization_rule,
      entity.description,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [entities, keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, projectId]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const startCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setMessage('');
  };

  const startEdit = async (entity) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setSelected(entity.entity_type);
    setMessage('');
    try {
      const detail = await getEntity(projectId, entity.entity_type);
      setForm({ ...emptyForm, ...detail, synonyms: detail.synonyms || [] });
    } catch (err) {
      console.error(err);
      setForm({ ...emptyForm, ...entity, synonyms: [] });
      setMessage('상세 동의어를 불러오지 못했습니다. 기본 정보만 표시합니다.');
    }
  };

  const parseSynonymLine = (line) => {
    const [canonicalPart, synonymPart = '', codePart = ''] = line.split('|').map((part) => part.trim());
    return {
      canonical_value: canonicalPart,
      synonyms: synonymPart.split(',').map((item) => item.trim()).filter(Boolean),
      code: codePart || null,
      is_active: true,
    };
  };

  const addSynonym = () => {
    const value = synonymInput.trim();
    if (!value) return;
    const next = parseSynonymLine(value);
    if (!next.canonical_value) return;
    updateForm({ synonyms: [...(form.synonyms || []), next] });
    setSynonymInput('');
  };

  const removeSynonym = (index) => {
    updateForm({ synonyms: (form.synonyms || []).filter((_, currentIndex) => currentIndex !== index) });
  };

  const save = async () => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!form.entity_type?.trim()) {
      toast.error('Entity Type을 입력해 주세요.');
      return;
    }
    if (!form.display_name?.trim()) {
      toast.error('표시명을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        description: form.description?.trim() || null,
        normalization_rule: form.normalization_rule?.trim() || null,
        synonyms: form.synonyms || [],
      };
      if (selected) {
        await updateEntity(projectId, selected, payload);
      } else {
        await createEntity(projectId, payload);
      }
      setMessage('Entity가 저장되었습니다.');
      await fetchEntities();
    } catch (err) {
      console.error(err);
      setMessage('저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (entityType) => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!window.confirm(`${entityType} Entity를 보관 처리할까요?`)) return;
    try {
      await archiveEntity(projectId, entityType);
      if (selected === entityType) startCreate();
      await fetchEntities();
    } catch (err) {
      console.error(err);
      toast.error('보관 처리에 실패했습니다.');
    }
  };

  return (
    <div className={embedded ? '' : 'inner'}>
      {!embedded && (
        <div className="breadcrumb">
          <span>Intent Factory</span> {'>'} <span>{isSynonym ? 'Synonym 관리' : 'Entity 관리'}</span>
        </div>
      )}
      <div className={embedded ? 'console-embedded-toolbar' : 'page-header'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: embedded ? undefined : '12px 0 20px', margin: 0 }}>
        <div>
          {embedded ? <h3>{isSynonym ? 'Synonym 관리' : 'Entity 관리'}</h3> : <h2 style={{ fontWeight: 700 }}>{isSynonym ? 'Synonym 관리' : 'Entity 관리'}</h2>}
          {!embedded && <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>Entity 정의와 canonical value, 동의어 사전을 DB에 저장합니다.</p>}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-primary" onClick={startCreate} disabled={!projectId}>+ Entity 등록</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 0.9fr)', gap: '18px' }}>
        <div className="table-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Entity Type, 표시명, 설명 검색" style={{ width: '360px', ...fieldStyle }} />
            <button className="btn-secondary" onClick={fetchEntities}>새로고침</button>
          </div>
          {message && <div style={{ padding: '12px 18px', color: 'var(--color-text-sub)', borderBottom: '1px solid var(--color-border)' }}>{message}</div>}
          <table>
            <thead>
              <tr>
                <th>Entity Type</th>
                <th>표시명</th>
                <th>Value Type</th>
                <th>Synonym</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (<tr key={idx}><td><Skeleton width="100px" /></td><td><Skeleton width="80px" /></td><td><Skeleton width="150px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="120px" /></td><td><Skeleton width="80px" /></td></tr>))
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>등록된 Entity가 없습니다.</td></tr>
              ) : paginatedItems.map((entity) => (
                <tr key={entity.entity_type}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{entity.entity_type}</td>
                  <td style={{ fontWeight: 600 }}>{entity.display_name}</td>
                  <td>{entity.value_type}</td>
                  <td>{entity.synonym_count || 0}건</td>
                  <td>{entity.status}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-table" onClick={() => startEdit(entity)}>수정</button>
                      <button className="btn-table" onClick={() => archive(entity.entity_type)}>보관</button>
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

        <div className="table-area" style={{ padding: '22px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{selected ? 'Entity 수정' : 'Entity 등록'}</h3>
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            <label>
              <span className="modal-label">Entity Type</span>
              <input value={form.entity_type} disabled={Boolean(selected)} onChange={(e) => updateForm({ entity_type: e.target.value })} style={fieldStyle} placeholder="예: scope" />
            </label>
            <label>
              <span className="modal-label">표시명</span>
              <input value={form.display_name} onChange={(e) => updateForm({ display_name: e.target.value })} style={fieldStyle} placeholder="예: Scope" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label>
                <span className="modal-label">Value Type</span>
                <select value={form.value_type} onChange={(e) => updateForm({ value_type: e.target.value })} style={fieldStyle}>
                  {['string', 'code', 'enum', 'date_range', 'number'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span className="modal-label">상태</span>
                <select value={form.status} onChange={(e) => updateForm({ status: e.target.value })} style={fieldStyle}>
                  {['active', 'draft', 'inactive'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-sub)' }}>
              <input type="checkbox" checked={form.required_validation} onChange={(e) => updateForm({ required_validation: e.target.checked })} />
              값 검증 필요
            </label>
            <label>
              <span className="modal-label">정규화 규칙</span>
              <input value={form.normalization_rule || ''} onChange={(e) => updateForm({ normalization_rule: e.target.value })} style={fieldStyle} placeholder="예: entity_synonyms" />
            </label>
            <label>
              <span className="modal-label">설명</span>
              <textarea value={form.description || ''} onChange={(e) => updateForm({ description: e.target.value })} style={{ ...fieldStyle, minHeight: '72px', resize: 'vertical' }} />
            </label>

            <div>
              <span className="modal-label">Synonym 값</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={synonymInput} onChange={(e) => setSynonymInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSynonym(); } }} style={fieldStyle} placeholder="canonical | synonym1, synonym2 | code" />
                <button type="button" className="btn-secondary" onClick={addSynonym}>추가</button>
              </div>
              <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                {(form.synonyms || []).map((item, index) => (
                  <div key={`${item.canonical_value}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div>
                      <strong>{item.canonical_value}</strong>
                      <div style={{ color: 'var(--color-text-sub)', fontSize: '12px', marginTop: '4px' }}>{(item.synonyms || []).join(', ') || '동의어 없음'} {item.code ? `· ${item.code}` : ''}</div>
                    </div>
                    <button type="button" className="btn-table" onClick={() => removeSynonym(index)}>삭제</button>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityList;
