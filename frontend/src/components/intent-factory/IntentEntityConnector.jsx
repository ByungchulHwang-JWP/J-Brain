import { useEffect, useMemo, useState } from 'react';
import { getIntentEntities, listEntities, updateIntentEntities } from '../../api/intentFactory';

const normalizeItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.entities)) return data.entities;
  return [];
};

const resolveEntityId = (entity) => entity.entity_type || entity.entity_id || entity.id || entity.code || entity.name;

const resolveEntityName = (entity) => entity.display_name || entity.entity_name || entity.name || entity.entity_type || entity.entity_id || entity.id;

const IntentEntityConnector = ({ projectId, intentId, enabled }) => {
  const [entities, setEntities] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    if (!projectId || !intentId || !enabled) return;
    setLoading(true);
    setMessage('');
    try {
      const [entityData, linkData] = await Promise.all([
        listEntities(projectId),
        getIntentEntities(projectId, intentId),
      ]);
      const nextEntities = normalizeItems(entityData);
      const linkedItems = normalizeItems(linkData);
      const ids = linkedItems.map((item) => item.entity_type || resolveEntityId(item)).filter(Boolean);

      setEntities(nextEntities);
      setSelectedIds(ids);
    } catch (err) {
      console.error(err);
      setEntities([]);
      setSelectedIds([]);
      setMessage('Entity 후보를 불러오지 못했습니다. 백엔드 Entity API 준비 상태를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, intentId, enabled]);

  const filteredEntities = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return entities;
    return entities.filter((entity) => [
      resolveEntityId(entity),
      resolveEntityName(entity),
      entity.entity_type,
      entity.description,
      ...(entity.synonyms || []),
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [entities, keyword]);

  const toggleEntity = (entityId) => {
    setSelectedIds((current) => (
      current.includes(entityId)
        ? current.filter((id) => id !== entityId)
        : [...current, entityId]
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateIntentEntities(projectId, intentId, {
        links: selectedIds.map((entityType) => ({ entity_type: entityType })),
      });
      setMessage(`Entity 연결 저장 완료: ${selectedIds.length}건`);
    } catch (err) {
      console.error(err);
      setMessage('Entity 연결 저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="table-area" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Entity 연결</h3>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-sub)', fontSize: '13px' }}>
            Intent 매칭 및 슬롯 추출에 사용할 Entity 후보를 연결합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>새로고침</button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '연결 저장'}</button>
        </div>
      </div>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Entity ID, 이름, Synonym 검색"
        style={{ width: '360px', maxWidth: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', marginBottom: '14px' }}
      />

      {message && <div style={{ marginBottom: '12px', color: 'var(--color-text-sub)', fontSize: '13px' }}>{message}</div>}

      <div style={{ display: 'grid', gap: '8px' }}>
        {loading ? (
          <div style={{ padding: '18px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Entity 후보를 불러오는 중...</div>
        ) : filteredEntities.length === 0 ? (
          <div style={{ padding: '18px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
            등록된 Entity가 없습니다. Entity 관리 화면에서 먼저 등록해 주세요.
          </div>
        ) : filteredEntities.map((entity) => {
          const entityId = resolveEntityId(entity);
          const checked = selectedIds.includes(entityId);
          return (
            <label
              key={entityId}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr auto',
                gap: '10px',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: checked ? 'var(--color-primary-subtle)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" checked={checked} onChange={() => toggleEntity(entityId)} />
              <div>
                <div style={{ fontWeight: 700 }}>{resolveEntityName(entity)}</div>
                <div style={{ marginTop: '4px', color: 'var(--color-text-sub)', fontSize: '12px' }}>
                  {entityId} · {entity.value_type || 'string'} · 동의어 {entity.synonym_count ?? 0}건
                </div>
              </div>
              <span className="badge inactive">{entity.status || 'active'}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default IntentEntityConnector;
