import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import IntentForm from '../../components/intent-factory/IntentForm';
import IntentEntityConnector from '../../components/intent-factory/IntentEntityConnector';
import { useProjectContext } from '../../context/ProjectContext';
import { createIntent, getIntent, listActions, updateIntent } from '../../api/intentFactory';

const emptyForm = {
  intent_id: '',
  intent_name: '',
  description: '',
  category: 'SEARCH_DOC',
  action_id: '',
  status: 'draft',
  priority: 100,
  examples: [],
  source_scope: {
    source_category: '',
    source_status: 'completed',
    document_types: [],
    tags: [],
    top_k: 5,
    score_threshold: 0.65,
  },
};

const generateIntentId = (projectId) => {
  const normalizedProjectId = String(projectId || 'PROJECT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PROJECT';
  return `INT-${normalizedProjectId}-${Date.now().toString().slice(-6)}`;
};

const IntentDetail = ({ mode = 'edit' }) => {
  const navigate = useNavigate();
  const { intentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const projectId = selectedProjectId;
  const [form, setForm] = useState(() => (mode === 'new' ? { ...emptyForm, intent_id: generateIntentId(selectedProjectId) } : emptyForm));
  const [actionOptions, setActionOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => (mode === 'new' ? 'Intent 등록' : 'Intent 상세/수정'), [mode]);

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

  useEffect(() => {
    if (mode === 'new' && projectId) {
      setForm((prev) => (
        !prev.intent_id || prev.intent_id.startsWith('INT-PROJECT-')
          ? { ...prev, intent_id: generateIntentId(projectId) }
          : prev
      ));
    }
  }, [mode, projectId]);

  useEffect(() => {
    if (mode !== 'edit' || !intentId || !projectId) return;
    let cancelled = false;
    setLoading(true);
    getIntent(projectId, intentId)
      .then((data) => {
        if (!cancelled) setForm({ ...emptyForm, ...data, source_scope: data.source_scope || null });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Intent 상세 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode, intentId, projectId]);

  useEffect(() => {
    if (!projectId) return;
    listActions(projectId)
      .then((data) => setActionOptions(data.items || []))
      .catch((err) => {
        console.error(err);
        setActionOptions([]);
      });
    const token = localStorage.getItem('ai_access_token');
    axios.get(`/api/v1/projects/${encodeURIComponent(projectId)}/sources`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => setSourceOptions(res.data || []))
      .catch((err) => {
        console.error(err);
        setSourceOptions([]);
      });
  }, [projectId]);

  const handleProjectChange = (nextProjectId) => {
    setSelectedProjectId(nextProjectId);
    setSearchParams({ project: nextProjectId }, { replace: true });
    if (mode === 'new') {
      setForm((prev) => ({ ...prev, intent_id: generateIntentId(nextProjectId) }));
    }
  };

  const handleSave = async () => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!form.intent_name?.trim()) {
      toast.error('Intent 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        action_id: form.action_id?.trim() || null,
        description: form.description?.trim() || null,
        source_scope: form.source_scope || null,
      };
      const saved = mode === 'new'
        ? await createIntent(projectId, payload)
        : await updateIntent(projectId, intentId, payload);
      toast.success('Intent가 저장되었습니다.');
      navigate(`/admin/intent-factory/intents/${encodeURIComponent(saved.intent_id || form.intent_id)}?project=${encodeURIComponent(projectId)}`);
    } catch (err) {
      console.error(err);
      toast.error('저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Intent Factory</span> {'>'} <span>{title}</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>{title}</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>Intent, 예시 질문, Action 연결, Source 검색 범위를 DB에 저장합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={{ minWidth: '220px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}>
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={() => navigate(`/admin/intent-factory/intents?project=${encodeURIComponent(projectId)}`)}>목록</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !projectId}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>

      {loading ? (
        <div className="table-area" style={{ padding: '32px', textAlign: 'center' }}><Spinner size={24} color="var(--color-primary)" /><p style={{marginTop: 12, color: 'var(--color-text-muted)'}}>상세 정보를 불러오는 중입니다...</p></div>
      ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          <IntentForm form={form} setForm={setForm} mode={mode} actionOptions={actionOptions} sourceOptions={sourceOptions} />
          <IntentEntityConnector
            projectId={projectId}
            intentId={intentId || form.intent_id}
            enabled={mode === 'edit'}
          />
        </div>
      )}
    </div>
  );
};

export default IntentDetail;
