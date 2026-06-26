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

const parseList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

const SourceScopeEditor = ({ value, onChange }) => {
  const scope = value || {
    source_category: '',
    source_status: 'completed',
    document_types: [],
    tags: [],
    top_k: 5,
    score_threshold: 0.65,
  };

  const update = (patch) => onChange({ ...scope, ...patch });

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '18px', background: 'var(--color-bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Source 검색 범위</h3>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-sub)', fontSize: '13px' }}>
            SEARCH_DOC Intent가 참조할 지식문서 범위를 저장합니다.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => onChange(null)}>범위 제거</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
        <label>
          <span className="modal-label">Source Category</span>
          <input style={fieldStyle} value={scope.source_category || ''} onChange={(e) => update({ source_category: e.target.value })} placeholder="예: J-Brain, NETZERO" />
        </label>
        <label>
          <span className="modal-label">Source Status</span>
          <select style={fieldStyle} value={scope.source_status || 'completed'} onChange={(e) => update({ source_status: e.target.value })}>
            <option value="completed">completed</option>
            <option value="active">active</option>
            <option value="draft">draft</option>
          </select>
        </label>
        <label>
          <span className="modal-label">문서 유형</span>
          <input style={fieldStyle} value={(scope.document_types || []).join(', ')} onChange={(e) => update({ document_types: parseList(e.target.value) })} placeholder="예: manual, faq" />
        </label>
        <label>
          <span className="modal-label">태그</span>
          <input style={fieldStyle} value={(scope.tags || []).join(', ')} onChange={(e) => update({ tags: parseList(e.target.value) })} placeholder="예: scope1, 전력" />
        </label>
        <label>
          <span className="modal-label">Top K</span>
          <input type="number" min="1" max="20" style={fieldStyle} value={scope.top_k ?? 5} onChange={(e) => update({ top_k: Number(e.target.value) })} />
        </label>
        <label>
          <span className="modal-label">Score Threshold</span>
          <input type="number" min="0" max="1" step="0.01" style={fieldStyle} value={scope.score_threshold ?? 0.65} onChange={(e) => update({ score_threshold: Number(e.target.value) })} />
        </label>
      </div>
    </div>
  );
};

export default SourceScopeEditor;
