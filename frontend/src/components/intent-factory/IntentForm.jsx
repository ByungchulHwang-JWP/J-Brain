import SourceScopeEditor from './SourceScopeEditor';

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
  minHeight: '120px',
  resize: 'vertical',
};

const categoryOptions = ['NAVIGATION', 'SEARCH_DOC', 'DATA_QUERY', 'FAQ', 'ACTION', 'GUIDE'];
const statusOptions = ['draft', 'active', 'inactive'];

const IntentForm = ({ form, setForm, mode }) => {
  const update = (patch) => setForm((current) => ({ ...current, ...patch }));

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div className="table-area" style={{ padding: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          <label>
            <span className="modal-label">Intent ID</span>
            <input
              style={fieldStyle}
              value={form.intent_id || ''}
              onChange={(e) => update({ intent_id: e.target.value })}
              disabled={mode === 'edit'}
              placeholder="예: NETZERO_SCOPE1_GUIDE"
            />
          </label>
          <label>
            <span className="modal-label">Intent 이름</span>
            <input style={fieldStyle} value={form.intent_name || ''} onChange={(e) => update({ intent_name: e.target.value })} placeholder="예: Scope 1 기준 안내" />
          </label>
          <label>
            <span className="modal-label">Category</span>
            <select style={fieldStyle} value={form.category || 'SEARCH_DOC'} onChange={(e) => update({ category: e.target.value })}>
              {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="modal-label">Status</span>
            <select style={fieldStyle} value={form.status || 'draft'} onChange={(e) => update({ status: e.target.value })}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="modal-label">Action ID</span>
            <input style={fieldStyle} value={form.action_id || ''} onChange={(e) => update({ action_id: e.target.value })} placeholder="예: NAV_ADMIN_QA" />
          </label>
          <label>
            <span className="modal-label">우선순위</span>
            <input type="number" style={fieldStyle} value={form.priority ?? 100} onChange={(e) => update({ priority: Number(e.target.value) })} />
          </label>
        </div>

        <label style={{ display: 'block', marginTop: '16px' }}>
          <span className="modal-label">설명</span>
          <textarea style={{ ...textareaStyle, minHeight: '80px' }} value={form.description || ''} onChange={(e) => update({ description: e.target.value })} placeholder="운영자가 Intent 목적을 이해할 수 있는 설명을 입력합니다." />
        </label>

        <label style={{ display: 'block', marginTop: '16px' }}>
          <span className="modal-label">예시 질문</span>
          <textarea
            style={textareaStyle}
            value={(form.examples || []).join('\n')}
            onChange={(e) => update({ examples: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })}
            placeholder={'한 줄에 하나씩 입력합니다.\n예: Scope 1 기준 알려줘\n예: 직접배출 산정 기준이 뭐야?'}
          />
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!form.source_scope && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => update({ source_scope: { source_category: '', source_status: 'completed', document_types: [], tags: [], top_k: 5, score_threshold: 0.65 } })}
          >
            + Source 검색 범위 추가
          </button>
        )}
      </div>

      {form.source_scope && (
        <SourceScopeEditor value={form.source_scope} onChange={(source_scope) => update({ source_scope })} />
      )}
    </div>
  );
};

export default IntentForm;
