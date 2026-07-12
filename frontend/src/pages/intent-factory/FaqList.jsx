import toast from 'react-hot-toast';
import { Skeleton, Spinner } from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import {
  archiveFaq,
  createFaq,
  getFaq,
  listFaqs,
  updateFaq,
} from '../../api/intentFactory';

const emptyForm = {
  faq_id: '',
  question: '',
  answer: '',
  category: '',
  tags_text: '',
  source_id: '',
  action_id: 'SEARCH_DOC',
  approved_for_pack: true,
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
  minHeight: '100px',
  resize: 'vertical',
};

const parseTags = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const tagsToText = (tags) => (Array.isArray(tags) ? tags.join(', ') : '');
const generateFaqId = (projectId) => {
  const normalizedProjectId = String(projectId || 'PROJECT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PROJECT';
  return `FAQ-${normalizedProjectId}-${Date.now().toString().slice(-6)}`;
};

const FaqList = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const projectId = selectedProjectId;
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedFaqId, setSelectedFaqId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadFaqs = async (targetProjectId = projectId) => {
    if (!targetProjectId) {
      setItems([]);
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await listFaqs(targetProjectId);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('FAQ 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs(projectId);
    setSelectedFaqId(null);
    setForm(emptyForm);
  }, [projectId]);

  const filteredItems = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [
      item.faq_id,
      item.question,
      item.answer,
      item.category,
      ...(item.tags || []),
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
    const activeCount = items.filter((item) => item.status === 'active').length;
    const approvedCount = items.filter((item) => item.approved_for_pack).length;
    return [
      ['전체 FAQ', `${items.length}건`],
      ['활성 FAQ', `${activeCount}건`],
      ['Pack 반영', `${approvedCount}건`],
      ['주요 Action', 'SEARCH_DOC'],
    ];
  }, [items]);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleNew = () => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setSelectedFaqId(null);
    setForm({ ...emptyForm, faq_id: generateFaqId(projectId) });
    setMessage('신규 FAQ를 등록할 수 있습니다.');
  };

  const handleSelect = async (faqId) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setSelectedFaqId(faqId);
    setMessage('');
    try {
      const detail = await getFaq(projectId, faqId);
      setForm({
        faq_id: detail.faq_id || '',
        question: detail.question || '',
        answer: detail.answer || '',
        category: detail.category || '',
        tags_text: tagsToText(detail.tags || []),
        source_id: detail.source_id || '',
        action_id: detail.action_id || 'SEARCH_DOC',
        approved_for_pack: Boolean(detail.approved_for_pack),
        status: detail.status || 'active',
      });
    } catch (err) {
      console.error(err);
      setMessage('FAQ 상세 정보를 불러오지 못했습니다.');
    }
  };

  const buildPayload = () => ({
    faq_id: (form.faq_id || generateFaqId(projectId)).trim(),
    question: form.question.trim(),
    answer: form.answer.trim(),
    category: form.category.trim() || null,
    tags: parseTags(form.tags_text),
    source_id: form.source_id.trim() || null,
    action_id: form.action_id.trim() || 'SEARCH_DOC',
    approved_for_pack: Boolean(form.approved_for_pack),
    status: form.status,
  });

  const handleSave = async () => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    const payload = buildPayload();
    if (!payload.question || !payload.answer) {
      toast.error('질문, 답변을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      if (selectedFaqId) {
        const { faq_id: _ignored, ...updatePayload } = payload;
        await updateFaq(projectId, selectedFaqId, updatePayload);
      } else {
        await createFaq(projectId, payload);
        setSelectedFaqId(payload.faq_id);
      }
      setMessage('FAQ가 저장되었습니다. Pack Builder에서 Export하면 knowledge/faqs.json에 반영됩니다.');
      await loadFaqs(projectId);
    } catch (err) {
      console.error(err);
      setMessage('FAQ 저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedFaqId) return;
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!window.confirm(`${selectedFaqId} FAQ를 보관 처리할까요?`)) return;
    try {
      await archiveFaq(projectId, selectedFaqId);
      setSelectedFaqId(null);
      setForm(emptyForm);
      setMessage('FAQ가 보관 처리되었습니다.');
      await loadFaqs(projectId);
    } catch (err) {
      console.error(err);
      setMessage('FAQ 보관 처리에 실패했습니다.');
    }
  };

  return (
    <div className={embedded ? '' : 'inner'}>
      {!embedded && (
        <div className="breadcrumb">
          <span>Intent Factory</span> {'>'} <span>FAQ 관리</span>
        </div>
      )}

      <div className={embedded ? 'console-embedded-toolbar' : 'page-header'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: embedded ? undefined : '12px 0 20px', margin: 0 }}>
        <div>
          {embedded ? <h3>FAQ 관리</h3> : <h2 style={{ fontWeight: 700 }}>FAQ 관리</h2>}
          {!embedded && (
            <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
              자주 묻는 질문과 승인된 답변을 관리하고 Pack의 FAQ 지식으로 반영합니다.
            </p>
          )}
        </div>
        <div className="responsive-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={() => loadFaqs(projectId)} disabled={loading}>{loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}</button>
          <button className="btn-primary" onClick={handleNew} disabled={!projectId}>FAQ 등록</button>
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

      <div className="responsive-split-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(620px, 1fr) minmax(420px, 0.8fr)', gap: '18px', alignItems: 'start' }}>
        <div className="table-area" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>FAQ 목록</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 360px', maxWidth: '520px' }}>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="FAQ ID, 질문, 답변, 태그 검색"
                style={{ minWidth: '0', ...fieldStyle }}
              />
              <button type="button" className="btn-secondary" onClick={() => loadFaqs(projectId)}>검색</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>FAQ ID</th>
                <th>질문</th>
                <th>분류</th>
                <th>Pack</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                    등록된 FAQ가 없습니다.
                  </td>
                </tr>
              ) : paginatedItems.map((item) => (
                <tr
                  key={item.faq_id}
                  onClick={() => handleSelect(item.faq_id)}
                  style={{ cursor: 'pointer', background: selectedFaqId === item.faq_id ? 'var(--color-bg-elevated)' : undefined }}
                >
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.faq_id}</td>
                  <td style={{ whiteSpace: 'normal', lineHeight: 1.45, wordBreak: 'keep-all' }}>{item.question}</td>
                  <td>{item.category || '-'}</td>
                  <td><span className={`badge ${item.approved_for_pack ? 'active' : 'warning'}`}>{item.approved_for_pack ? '반영' : '제외'}</span></td>
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
            <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedFaqId ? 'FAQ 상세/수정' : 'FAQ 등록'}</h3>
            {selectedFaqId && <button className="btn-secondary" onClick={handleArchive}>보관</button>}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label>
              <span className="modal-label">FAQ ID</span>
              <input value={form.faq_id} disabled onChange={(e) => updateForm({ faq_id: e.target.value })} style={fieldStyle} placeholder="자동 생성됩니다." />
            </label>
            <label>
              <span className="modal-label">질문</span>
              <textarea value={form.question} onChange={(e) => updateForm({ question: e.target.value })} style={textareaStyle} placeholder="예: Scope 1 기준은 무엇인가요?" />
            </label>
            <label>
              <span className="modal-label">답변</span>
              <textarea value={form.answer} onChange={(e) => updateForm({ answer: e.target.value })} style={{ ...textareaStyle, minHeight: '150px' }} placeholder="승인된 답변 내용을 입력합니다." />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <span className="modal-label">분류</span>
                <input value={form.category} onChange={(e) => updateForm({ category: e.target.value })} style={fieldStyle} placeholder="예: 탄소중립 기준" />
              </label>
              <label>
                <span className="modal-label">Source ID</span>
                <input value={form.source_id} onChange={(e) => updateForm({ source_id: e.target.value })} style={fieldStyle} placeholder="선택 입력" />
              </label>
            </div>
            <label>
              <span className="modal-label">태그</span>
              <input value={form.tags_text} onChange={(e) => updateForm({ tags_text: e.target.value })} style={fieldStyle} placeholder="예: scope1, 기준, 배출량" />
            </label>
            <label>
              <span className="modal-label">Action ID</span>
              <input value={form.action_id} onChange={(e) => updateForm({ action_id: e.target.value })} style={fieldStyle} placeholder="SEARCH_DOC" />
            </label>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-text-main)' }}>
              <input type="checkbox" checked={form.approved_for_pack} onChange={(e) => updateForm({ approved_for_pack: e.target.checked })} />
              Pack Export에 반영
            </label>
            <label>
              <span className="modal-label">상태</span>
              <select value={form.status} onChange={(e) => updateForm({ status: e.target.value })} style={fieldStyle}>
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="inactive">inactive</option>
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

export default FaqList;
