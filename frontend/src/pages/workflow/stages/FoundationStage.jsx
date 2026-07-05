import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, CheckCircle2, Clock3, FileText, History, Save, Settings2 } from 'lucide-react';

const defaultProject = (projectId) => ({
  id: projectId,
  name: projectId,
  description: '',
  status: 'active',
  created_at: '-',
});

const draftKey = (projectId) => `jbrain-workflow-foundation-draft-${projectId}`;

const FoundationStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [project, setProject] = useState(() => defaultProject(projectId));
  const [form, setForm] = useState(() => defaultProject(projectId));
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotice('');
      try {
        const token = localStorage.getItem('ai_access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [projectRes, sourceRes] = await Promise.all([
          axios.get('/api/v1/projects', { headers }),
          axios.get('/api/v1/sources', { headers }),
        ]);

        const matched = (projectRes.data || []).find((item) => item.id === projectId);
        if (!matched) {
          setNotice('프로젝트 정보를 찾을 수 없습니다. 프로젝트 선택 화면에서 다시 선택해 주세요.');
          return;
        }
        const projectForm = {
          id: matched.id || projectId,
          name: matched.name || projectId,
          description: matched.description || '',
          status: matched.status || 'active',
          created_at: matched.created_at || '-',
        };
        const draft = JSON.parse(localStorage.getItem(draftKey(projectId)) || 'null');

        setProject(projectForm);
        setForm(draft || projectForm);
        setSources((sourceRes.data || []).filter((item) => item.category === projectId).slice(0, 5));
        setHistory([
          { type: '조회', message: '프로젝트 기본 정보를 불러왔습니다.', time: new Date().toLocaleString('ko-KR') },
          ...(draft ? [{ type: '임시 저장', message: '저장되지 않은 임시 변경사항이 있습니다.', time: draft.saved_at || '-' }] : []),
        ]);
      } catch (err) {
        console.error(err);
        setProject(defaultProject(projectId));
        setForm(defaultProject(projectId));
        setNotice('프로젝트 정보를 불러오지 못했습니다. 기본 정보로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const metrics = summary.metrics || {};
  const sourceCount = Number(metrics.source_count || sources.length || 0);
  const completedSourceCount = Number(metrics.completed_source_count || 0);
  const isDirty = form.description !== project.description || form.status !== project.status;
  const stageChecks = stage?.checks || [];
  const canGoNext = stageChecks.length === 0 || stageChecks.every((check) => check.status === 'done');

  const completionItems = useMemo(() => [
    { label: '프로젝트 ID 확인', done: Boolean(projectId), meta: projectId },
    { label: '프로젝트명 입력', done: Boolean(form.name?.trim()), meta: form.name || '미입력' },
    { label: '프로젝트 상태 확인', done: form.status === 'active', meta: form.status === 'active' ? '활성' : '비활성' },
    { label: '다음 단계 이동 조건', done: canGoNext, meta: canGoNext ? '충족' : '확인 필요' },
  ], [canGoNext, form.name, form.status, projectId]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTemporarySave = () => {
    const draft = { ...form, saved_at: new Date().toLocaleString('ko-KR') };
    localStorage.setItem(draftKey(projectId), JSON.stringify(draft));
    setHistory((prev) => [{ type: '임시 저장', message: '현재 입력값을 브라우저 임시 저장소에 보관했습니다.', time: draft.saved_at }, ...prev]);
    setNotice('임시 저장되었습니다. 실제 프로젝트 데이터는 저장하기 버튼을 눌러 반영합니다.');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNotice('프로젝트명을 입력해 주세요.');
      return;
    }

    setSaving(true);
    setNotice('');
    try {
      const token = localStorage.getItem('ai_access_token');
      await axios.patch(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
        description: form.description,
        status: form.status,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      localStorage.removeItem(draftKey(projectId));
      const saved = { ...form, name: form.name.trim() };
      setProject(saved);
      setForm(saved);
      setHistory((prev) => [{ type: '저장', message: '프로젝트 기본 정보를 저장했습니다.', time: new Date().toLocaleString('ko-KR') }, ...prev]);
      setNotice('저장되었습니다.');
    } catch (err) {
      console.error(err);
      setNotice(`저장에 실패했습니다. ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workflow-foundation">
      <div className="workflow-foundation-hero panel">
        <div>
          <span className="workflow-pill blue">1단계 프로젝트 준비</span>
          <h3>프로젝트 정보 관리</h3>
          <p>
            이 단계에서는 챗봇 구축 작업을 시작하기 위한 최소 프로젝트 정보를 확정합니다.
            고객사/서비스 상세, 환경 정보, 권한 정책은 현재 범위에서 제외하고 이후 단계와 연결되는 식별 정보 중심으로 관리합니다.
          </p>
        </div>
        <div className="workflow-foundation-actions">
          <button className="btn-secondary" type="button" onClick={handleTemporarySave} disabled={loading}>
            <Save size={16} /> 임시 저장
          </button>
          <button className="btn-primary" type="button" onClick={handleSave} disabled={loading || saving || !isDirty}>
            <CheckCircle2 size={16} /> {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {notice && <div className="workflow-message">{notice}</div>}

      <div className="workflow-foundation-grid">
        <div className="panel workflow-foundation-form">
          <div className="workflow-section-title">
            <span>기본 정보</span>
            {isDirty && <small>저장되지 않은 변경사항 있음</small>}
          </div>

          <label className="workflow-field">
            <span>프로젝트 ID</span>
            <input value={form.id || projectId} disabled />
          </label>
          <label className="workflow-field">
            <span>프로젝트명</span>
            <input value={form.name} disabled title="현재 프로젝트명은 Project ID 기준으로 관리됩니다." />
          </label>
          <label className="workflow-field">
            <span>설명</span>
            <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} rows={4} placeholder="프로젝트 설명을 입력하세요." />
          </label>
          <label className="workflow-field">
            <span>상태</span>
            <select value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </label>

          <div className="workflow-form-footer">
            <button className="btn-secondary" type="button" onClick={() => navigate('/admin/workflow/projects')}>
              프로젝트 변경
            </button>
            <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/2`)}>
              다음 단계로 이동 <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <aside className="workflow-foundation-side">
          <div className="panel workflow-status-card">
            <div className="workflow-section-title"><span>프로젝트 현황</span></div>
            <div className="workflow-status-grid">
              <div><span>등록 Source</span><strong>{sourceCount}건</strong></div>
              <div><span>벡터화 완료</span><strong>{completedSourceCount}건</strong></div>
              <div><span>진행률</span><strong>{summary.overall_progress}%</strong></div>
              <div><span>상태</span><strong>{form.status === 'active' ? '활성' : '비활성'}</strong></div>
            </div>
          </div>

          <div className="panel workflow-status-card">
            <div className="workflow-section-title"><span>완료 조건 요약</span></div>
            <div className="workflow-foundation-checks">
              {completionItems.map((item) => (
                <div className="workflow-foundation-check" key={item.label}>
                  <span className={`workflow-dot ${item.done ? 'done' : 'todo'}`}>{item.done ? '✓' : '!'}</span>
                  <div><strong>{item.label}</strong><small>{item.meta}</small></div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="workflow-foundation-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>최근 등록 문서</h3>
              <p>기반 설정 이후 지식 준비 단계에서 이어서 관리할 Source입니다.</p>
            </div>
            <button className="btn-secondary workflow-compact-button" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/2`)}>
              <FileText size={16} /> 2단계 지식 준비
            </button>
          </div>
          <table>
            <thead><tr><th>문서명</th><th>상태</th><th>연결 단계</th></tr></thead>
            <tbody>
              {sources.length === 0 ? (
                <tr><td colSpan="3">등록된 문서가 없습니다.</td></tr>
              ) : sources.map((source) => (
                <tr key={source.id}>
                  <td><div className="name">{source.filename || source.file_name || source.title || '-'}</div><div className="meta">{source.category || projectId}</div></td>
                  <td><span className={`badge ${source.status === 'success' || source.status === 'active' ? 'active' : 'warning'}`}>{source.status || '-'}</span></td>
                  <td>2. 지식 준비</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel workflow-history-card">
          <div className="workflow-board-head">
            <div>
              <h3>수정 이력</h3>
              <p>이번 화면에서 발생한 조회, 임시 저장, 저장 이벤트를 표시합니다.</p>
            </div>
            <History size={18} />
          </div>
          <div className="workflow-history-list">
            {history.map((item, index) => (
              <div className="workflow-history-item" key={`${item.type}-${item.time}-${index}`}>
                <span className="workflow-history-icon">{item.type === '저장' ? <CheckCircle2 size={15} /> : item.type === '임시 저장' ? <Clock3 size={15} /> : <Settings2 size={15} />}</span>
                <div><strong>{item.type}</strong><p>{item.message}</p><small>{item.time}</small></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoundationStage;
