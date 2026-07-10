import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import useProjects from '../../hooks/useProjects';
import {
  archiveValidationQuestion,
  createValidationQuestion,
  listPackValidationResults,
  listRuntimePacks,
  listValidationQuestions,
  runPackValidation,
  updateValidationQuestion,
} from '../../api/intentFactory';

const emptyQuestion = {
  question_id: '',
  question: '',
  expected_intent_id: '',
  expected_action_id: '',
  min_confidence_score: 0.65,
  pack_id: '',
  pack_version: '',
  status: 'active',
};

const makeValidationQuestionId = (projectId, index) => {
  const normalizedProject = String(projectId || 'PROJECT')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `VAL-${normalizedProject}-${String(index).padStart(3, '0')}`;
};

const makeEmptyQuestion = (projectId, index = 1) => ({
  ...emptyQuestion,
  question_id: makeValidationQuestionId(projectId, index),
});

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
  minHeight: '86px',
  resize: 'vertical',
};

const PackValidation = () => {
  const { projects } = useProjects();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || localStorage.getItem('jbrain-workflow-project-id') || 'J-Brain';
  const [projectId, setProjectId] = useState(initialProjectId);
  const [questions, setQuestions] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [targetPackKey, setTargetPackKey] = useState('');
  const [targetType, setTargetType] = useState('runtime_pack');
  const [latestResult, setLatestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  useEffect(() => {
    const requestedProjectId = searchParams.get('projectId');
    if (requestedProjectId && requestedProjectId !== projectId) {
      setProjectId(requestedProjectId);
      return;
    }
    if (projects.length > 0 && !projects.some((project) => project.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects, searchParams]);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem('jbrain-workflow-project-id', projectId);
    }
  }, [projectId]);

  const fetchAll = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [questionData, runtimeData, resultData] = await Promise.all([
        listValidationQuestions(projectId),
        listRuntimePacks(projectId),
        listPackValidationResults(projectId),
      ]);
      const packItems = runtimeData.items || [];
      setQuestions(questionData.items || []);
      setRuntimePacks(packItems);
      setResults(resultData.items || []);
      if (!targetPackKey && packItems.length > 0) {
        setTargetPackKey(`${packItems[0].pack_id}::${packItems[0].pack_version}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Pack 검증 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [projectId]);

  const stats = useMemo(() => {
    const latest = results[0];
    return [
      ['검증 질문', `${questions.length}건`],
      ['Runtime Pack', `${runtimePacks.length}건`],
      ['최근 검증', latest ? latest.status : '없음'],
      ['승인 전 기준', 'Validation Pass'],
    ];
  }, [questions.length, results, runtimePacks.length]);

  const updateQuestionForm = (patch) => setQuestionForm((prev) => ({ ...prev, ...patch }));

  const handleNew = () => {
    setSelectedQuestionId(null);
    setQuestionForm(makeEmptyQuestion(projectId, questions.length + 1));
    setQuestionDrawerOpen(true);
    setMessage('신규 검증 질문을 등록할 수 있습니다.');
  };

  const handleSelectQuestion = (item) => {
    setSelectedQuestionId(item.question_id);
    setQuestionForm({
      question_id: item.question_id || '',
      question: item.question || '',
      expected_intent_id: item.expected_intent_id || '',
      expected_action_id: item.expected_action_id || '',
      min_confidence_score: item.min_confidence_score ?? 0.65,
      pack_id: item.pack_id || '',
      pack_version: item.pack_version || '',
      status: item.status || 'active',
    });
    setQuestionDrawerOpen(true);
    setMessage('');
  };

  const buildQuestionPayload = () => ({
    question_id: questionForm.question_id.trim(),
    question: questionForm.question.trim(),
    expected_intent_id: questionForm.expected_intent_id.trim(),
    expected_action_id: questionForm.expected_action_id.trim(),
    min_confidence_score: Number(questionForm.min_confidence_score),
    pack_id: questionForm.pack_id.trim() || null,
    pack_version: questionForm.pack_version.trim() || null,
    status: questionForm.status,
  });

  const handleSaveQuestion = async () => {
    const payload = buildQuestionPayload();
    if (!payload.question_id || !payload.question || !payload.expected_intent_id || !payload.expected_action_id) {
      toast.error('Question ID, 질문, 기대 Intent, 기대 Action을 입력해 주세요.');
      return;
    }
    try {
      if (selectedQuestionId) {
        const { question_id: _ignored, ...updatePayload } = payload;
        await updateValidationQuestion(projectId, selectedQuestionId, updatePayload);
      } else {
        await createValidationQuestion(projectId, payload);
        setSelectedQuestionId(payload.question_id);
      }
      setMessage('검증 질문이 저장되었습니다.');
      setQuestionDrawerOpen(false);
      await fetchAll();
    } catch (err) {
      console.error(err);
      setMessage('검증 질문 저장 실패: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleArchiveQuestion = async () => {
    if (!selectedQuestionId) return;
    try {
      await archiveValidationQuestion(projectId, selectedQuestionId);
      setSelectedQuestionId(null);
      setQuestionForm(makeEmptyQuestion(projectId, questions.length + 1));
      setQuestionDrawerOpen(false);
      setArchiveConfirmOpen(false);
      setMessage('검증 질문이 보관 처리되었습니다.');
      await fetchAll();
    } catch (err) {
      console.error(err);
      setMessage('검증 질문 보관 실패: ' + (err.response?.data?.detail || err.message));
      setArchiveConfirmOpen(false);
    }
  };

  const selectedPack = useMemo(() => {
    if (targetType === 'draft') {
      return {
        pack_id: `${projectId}-db-draft`,
        pack_version: '0.1-draft',
      };
    }
    const [packId, packVersion] = targetPackKey.split('::');
    return packId && packVersion ? { pack_id: packId, pack_version: packVersion } : null;
  }, [projectId, targetPackKey, targetType]);

  const handleRunValidation = async () => {
    if (!selectedPack) {
      toast.error('검증할 Pack을 선택해 주세요.');
      return;
    }
    setValidating(true);
    setLatestResult(null);
    setMessage('Pack 검증을 실행 중입니다. 잠시만 기다려 주세요.');
    try {
      const result = await runPackValidation(projectId, {
        ...selectedPack,
        target_type: targetType,
      });
      setLatestResult(result);
      const totalQuestions = result.summary?.total_questions ?? 0;
      const autoSeededQuestions = result.summary?.auto_seeded_validation_questions ?? 0;
      if (totalQuestions === 0) {
        setMessage(
          `Pack 검증 완료: 검증 질문 0건입니다. ${selectedPack.pack_id} v${selectedPack.pack_version}에 연결된 활성 검증 질문을 등록해 주세요.`,
        );
      } else {
        const seededMessage = autoSeededQuestions > 0 ? ` / 검증 질문 자동 생성 ${autoSeededQuestions}건` : '';
        setMessage(`Pack 검증 완료: ${result.status} (${result.summary?.passed_count ?? 0}/${totalQuestions})${seededMessage}`);
      }
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Pack 검증 실패');
      setMessage('Pack 검증 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Pack 제작/배포</span> {'>'} <span>Pack 검증</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>Pack 검증</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
            검증 질문과 기대 Intent/Action을 관리하고, 선택한 Pack의 Pass/Fail 결과를 저장합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value={projectId}>{projectId}</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={fetchAll} disabled={loading}>{loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {stats.map(([label, value]) => (
          <div key={label} className="table-area" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
            <strong style={{ fontSize: '22px', color: 'var(--color-primary)' }}>{value}</strong>
          </div>
        ))}
      </div>

      {message && <div className="pack-validation-message table-area">{message}</div>}

      <div className="table-area" style={{ padding: '18px', marginBottom: '18px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Pack 검증 실행</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '12px', alignItems: 'end' }}>
          <label>
            <span className="modal-label">대상 유형</span>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} style={fieldStyle}>
              <option value="runtime_pack">Runtime Pack</option>
              <option value="draft">DB Draft</option>
            </select>
          </label>
          {targetType === 'runtime_pack' ? (
            <label>
              <span className="modal-label">Runtime Pack</span>
              <select value={targetPackKey} onChange={(e) => setTargetPackKey(e.target.value)} style={fieldStyle}>
                {runtimePacks.length === 0 && <option value="">Import된 Runtime Pack 없음</option>}
                {runtimePacks.map((pack) => (
                  <option key={`${pack.pack_id}-${pack.pack_version}`} value={`${pack.pack_id}::${pack.pack_version}`}>
                    {pack.pack_id} v{pack.pack_version} / {pack.status}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div>
              <span className="modal-label">DB Draft Pack</span>
              <div style={{ ...fieldStyle, minHeight: '42px' }}>{selectedPack?.pack_id} v{selectedPack?.pack_version}</div>
            </div>
          )}
          <button className="btn-primary" onClick={handleRunValidation} disabled={validating}>
            {validating ? '검증 중...' : '검증 실행'}
          </button>
        </div>
      </div>

      {latestResult && (
        <div className={`table-area pack-validation-result-card ${latestResult.status === 'passed' ? 'pass' : 'fail'}`} style={{ marginBottom: '18px' }}>
          <div className="pack-validation-result-head">
            <h3 style={{ margin: 0, fontSize: '16px' }}>최근 검증 결과</h3>
            <span className={`badge ${latestResult.status === 'passed' ? 'active' : 'warning'}`}>{latestResult.status || 'unknown'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>질문</th>
                <th>기대 Intent</th>
                <th>실제 Intent</th>
                <th>Score</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              {(latestResult.results || []).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                    검증 결과 항목이 없습니다. 활성 검증 질문을 등록한 뒤 다시 실행해 주세요.
                  </td>
                </tr>
              ) : (latestResult.results || []).map((item) => (
                <tr key={item.question_id}>
                  <td>{item.question}</td>
                  <td>{item.expected_intent_id}</td>
                  <td>{item.actual_intent_id || '-'}</td>
                  <td>{Number(item.score || 0).toFixed(3)} / {Number(item.min_confidence_score || 0).toFixed(3)}</td>
                  <td><span className={`badge ${item.passed ? 'active' : 'warning'}`}>{item.passed ? 'PASS' : 'FAIL'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', alignItems: 'start' }}>
        <div className="table-area" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>검증 질문 목록</h3>
            <button className="btn-primary" onClick={handleNew}><Plus size={16} /> 질문 등록</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Question ID</th>
                <th>질문</th>
                <th>기대 Intent</th>
                <th>최소 Score</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>등록된 검증 질문이 없습니다.</td></tr>
              ) : questions.map((item) => (
                <tr key={item.question_id} onClick={() => handleSelectQuestion(item)} style={{ cursor: 'pointer', background: selectedQuestionId === item.question_id ? 'var(--color-bg-elevated)' : undefined }}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.question_id}</td>
                  <td>{item.question}</td>
                  <td>{item.expected_intent_id}</td>
                  <td>{Number(item.min_confidence_score).toFixed(2)}</td>
                </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {questionDrawerOpen && (
        <div className="workflow-drawer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setQuestionDrawerOpen(false)}>
          <aside className="workflow-drawer workflow-side-drawer" role="dialog" aria-modal="true" aria-label="검증 질문 등록" onMouseDown={(event) => event.stopPropagation()}>
            <div className="workflow-drawer-head">
              <div>
                <span>Pack Validation</span>
                <h3>{selectedQuestionId ? '검증 질문 수정' : '검증 질문 등록'}</h3>
              </div>
              <button className="workflow-icon-button" type="button" onClick={() => setQuestionDrawerOpen(false)} aria-label="닫기">
                <X size={18} />
              </button>
            </div>
            <div className="workflow-drawer-body">
              <div style={{ display: 'grid', gap: '12px' }}>
                <label>
                  <span className="modal-label">Question ID</span>
                  <input value={questionForm.question_id} disabled onChange={(e) => updateQuestionForm({ question_id: e.target.value })} style={fieldStyle} placeholder="예: VAL-JB-001" />
                </label>
                <label>
                  <span className="modal-label">질문</span>
                  <textarea value={questionForm.question} onChange={(e) => updateQuestionForm({ question: e.target.value })} style={textareaStyle} placeholder="예: 운영 현황 보여줘" />
                </label>
                <label>
                  <span className="modal-label">기대 Intent ID</span>
                  <input value={questionForm.expected_intent_id} onChange={(e) => updateQuestionForm({ expected_intent_id: e.target.value })} style={fieldStyle} placeholder="예: INT-JB-GO-DASHBOARD" />
                </label>
                <label>
                  <span className="modal-label">기대 Action ID</span>
                  <input value={questionForm.expected_action_id} onChange={(e) => updateQuestionForm({ expected_action_id: e.target.value })} style={fieldStyle} placeholder="예: ACT-JB-GO-DASHBOARD" />
                </label>
                <label>
                  <span className="modal-label">최소 Confidence Score</span>
                  <input type="number" min="0" max="1" step="0.01" value={questionForm.min_confidence_score} onChange={(e) => updateQuestionForm({ min_confidence_score: e.target.value })} style={fieldStyle} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    <span className="modal-label">Pack ID 제한</span>
                    <input value={questionForm.pack_id} onChange={(e) => updateQuestionForm({ pack_id: e.target.value })} style={fieldStyle} placeholder="비워두면 공통" />
                  </label>
                  <label>
                    <span className="modal-label">Pack Version 제한</span>
                    <input value={questionForm.pack_version} onChange={(e) => updateQuestionForm({ pack_version: e.target.value })} style={fieldStyle} placeholder="비워두면 공통" />
                  </label>
                </div>
              </div>
              <div className="workflow-drawer-actions">
                {selectedQuestionId && <button className="btn-secondary" type="button" onClick={() => setArchiveConfirmOpen(true)}>보관</button>}
                <button className="btn-secondary" type="button" onClick={() => setQuestionDrawerOpen(false)}>취소</button>
                <button className="btn-primary" type="button" onClick={handleSaveQuestion}>저장</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <ConfirmModal
        open={archiveConfirmOpen}
        title="검증 질문을 보관 처리할까요?"
        description={`${selectedQuestionId || ''} 질문은 검증 대상에서 제외됩니다.`}
        confirmLabel="보관 처리"
        cancelLabel="취소"
        tone="danger"
        onConfirm={handleArchiveQuestion}
        onCancel={() => setArchiveConfirmOpen(false)}
      />
    </div>
  );
};

export default PackValidation;
