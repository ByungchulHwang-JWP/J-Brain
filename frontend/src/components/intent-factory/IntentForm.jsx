import { useState } from 'react';
import SourceScopeEditor from './SourceScopeEditor';

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '15px',
  lineHeight: '1.5',
};

const textareaStyle = {
  ...fieldStyle,
  minHeight: '120px',
  resize: 'vertical',
};

const categoryOptions = ['NAVIGATION', 'SEARCH_DOC', 'DATA_QUERY', 'FAQ', 'ACTION', 'GUIDE'];
const statusOptions = ['draft', 'active', 'inactive'];

const categoryGuides = {
  NAVIGATION: '화면/메뉴 이동 Intent입니다. Action은 NAVEGATE 계열 화면 이동 Action을 선택합니다.',
  SEARCH_DOC: '문서/FAQ 검색 Intent입니다. 아래 Source 검색 범위에서 참조할 지식 문서를 확인하고 범위를 지정합니다.',
  DATA_QUERY: '정형 데이터 조회 Intent입니다. 운영 API 또는 SQL Template Action과 연결해야 합니다.',
  FAQ: '정형 FAQ 응답 Intent입니다. FAQ 관리에서 승인된 답변과 함께 관리하는 것을 권장합니다.',
  ACTION: '외부 API/업무 실행 Intent입니다. 허용된 Whitelist Action과 연결해야 합니다.',
  GUIDE: '사용자 안내 Intent입니다. 별도 실행 없이 안내성 Action 또는 FAQ로 연결할 수 있습니다.',
};

const IntentForm = ({ form, setForm, mode, actionOptions = [], sourceOptions = [] }) => {
  const [exampleInput, setExampleInput] = useState('');
  const update = (patch) => setForm((current) => ({ ...current, ...patch }));
  const examples = form.examples || [];
  const selectedCategory = form.category || 'SEARCH_DOC';

  const addExample = () => {
    const value = exampleInput.trim();
    if (!value) return;
    if (examples.includes(value)) {
      setExampleInput('');
      return;
    }
    update({ examples: [...examples, value] });
    setExampleInput('');
  };

  const removeExample = (index) => {
    update({ examples: examples.filter((_, currentIndex) => currentIndex !== index) });
  };

  return (
    <div style={{ display: 'grid', gap: '24px', marginTop: '12px' }}>
      <div className="table-area" style={{ padding: '26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '32px 24px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>Intent ID</span>
            <input
              style={fieldStyle}
              value={form.intent_id || ''}
              onChange={(e) => update({ intent_id: e.target.value })}
              disabled
              placeholder="자동 생성됩니다."
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>Intent 이름</span>
            <input style={fieldStyle} value={form.intent_name || ''} onChange={(e) => update({ intent_name: e.target.value })} placeholder="예: Scope 1 기준 안내" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>Category</span>
            <select
              style={fieldStyle}
              value={selectedCategory}
              onChange={(e) => {
                const nextCategory = e.target.value;
                update({
                  category: nextCategory,
                  source_scope: nextCategory === 'SEARCH_DOC'
                    ? (form.source_scope || { source_category: '', source_status: 'completed', document_types: [], tags: [], top_k: 5, score_threshold: 0.65 })
                    : form.source_scope,
                });
              }}
            >
              {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>Status</span>
            <select style={fieldStyle} value={form.status || 'draft'} onChange={(e) => update({ status: e.target.value })}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>Action 연결</span>
            <select
              style={fieldStyle}
              value={form.action_id || ''}
              onChange={(e) => update({ action_id: e.target.value })}
            >
              <option value="">Action 선택 전</option>
              {actionOptions.map((action) => (
                <option key={action.action_id} value={action.action_id}>
                  {action.action_id} / {action.action_name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>우선순위</span>
            <input type="number" style={fieldStyle} value={form.priority ?? 100} onChange={(e) => update({ priority: Number(e.target.value) })} />
          </label>
        </div>

        <div style={{ marginTop: '16px', padding: '14px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-elevated)', color: 'var(--color-text-sub)', fontSize: '13px', lineHeight: 1.6 }}>
          <strong style={{ display: 'block', color: 'var(--color-text-main)', marginBottom: '4px' }}>Category 기준 작업 안내</strong>
          {categoryGuides[selectedCategory] || '선택한 Category 기준으로 Action과 Source 범위를 설정합니다.'}
        </div>

        {selectedCategory === 'SEARCH_DOC' && (
          <div style={{ marginTop: '16px', padding: '14px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <strong style={{ color: 'var(--color-text-main)' }}>등록 Source 선택</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-sub)', fontSize: '13px' }}>SEARCH_DOC Intent가 참조할 프로젝트 지식 문서를 확인합니다.</p>
              </div>
              <span className="badge active">{sourceOptions.length}건</span>
            </div>
            <select
              style={fieldStyle}
              value={form.source_scope?.source_category || ''}
              onChange={(e) => update({
                source_scope: {
                  ...(form.source_scope || { source_status: 'completed', document_types: [], tags: [], top_k: 5, score_threshold: 0.65 }),
                  source_category: e.target.value,
                },
              })}
            >
              <option value="">프로젝트 전체 Source 검색</option>
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.filename || source.id}>
                  {source.filename || source.id} / {source.status || '상태 없음'}
                </option>
              ))}
            </select>
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>설명</span>
            <textarea style={{ ...textareaStyle, minHeight: '100px' }} value={form.description || ''} onChange={(e) => update({ description: e.target.value })} placeholder="운영자가 Intent 목적을 이해할 수 있는 설명을 입력합니다." />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
            <span className="modal-label" style={{ marginBottom: 0, fontSize: '14px' }}>예시 질문</span>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              style={fieldStyle}
              value={exampleInput}
              onChange={(e) => setExampleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addExample();
                }
              }}
              placeholder="예시 질문을 입력하고 Enter 또는 추가를 누릅니다."
            />
            <button type="button" className="btn-secondary" onClick={addExample} style={{ whiteSpace: 'nowrap' }}>추가</button>
          </div>
          <textarea
            style={{ ...textareaStyle, minHeight: '90px' }}
            value={examples.join('\n')}
            onChange={(e) => update({ examples: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })}
            placeholder={'여러 질문을 한 번에 붙여넣을 수 있습니다.\n예: Scope 1 기준 알려줘\n예: 직접배출 산정 기준이 뭐야?'}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {examples.map((example, index) => (
              <span
                key={`${example}-${index}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  maxWidth: '100%',
                  padding: '7px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '999px',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text-main)',
                  fontSize: '13px',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{example}</span>
                <button type="button" onClick={() => removeExample(index)} style={{ border: 0, background: 'transparent', color: 'var(--color-text-sub)', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
              </span>
            ))}
          </div>
        </div>
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
