import { useEffect, useState } from 'react';
import useProjects from '../../hooks/useProjects';
import { getPackDraft } from '../../api/intentFactory';

const PackBuilder = () => {
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState('J-Brain');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fieldStyle = {
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    background: 'var(--color-input-bg)',
    color: 'var(--color-text-main)',
    fontFamily: 'inherit',
    fontSize: '14px',
  };

  const loadDraft = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await getPackDraft(projectId);
      setDraft(data);
      setMessage('DB 기반 Pack Draft를 생성했습니다.');
    } catch (err) {
      console.error(err);
      setDraft(null);
      setMessage('Pack Draft 생성에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDraft(); }, [projectId]);

  const counts = draft?.counts || {};

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Pack 제작/배포</span> {'>'} <span>Pack Builder</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>Pack Builder</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>DB에 저장된 Intent, Entity, Action 연결, Source Scope로 Pack JSON 초안을 생성합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value={projectId}>{projectId}</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-primary" onClick={loadDraft} disabled={loading}>{loading ? '생성 중...' : 'Draft 생성'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {[
          ['Intent', counts.intents ?? 0],
          ['Example', counts.intent_examples ?? 0],
          ['Entity', counts.entities ?? 0],
          ['Action Param', counts.action_parameters ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="table-area" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
            <strong style={{ fontSize: '24px', color: 'var(--color-primary)' }}>{value}건</strong>
          </div>
        ))}
      </div>

      <div className="table-area" style={{ padding: '18px' }}>
        {message && <div style={{ marginBottom: '12px', color: 'var(--color-text-sub)' }}>{message}</div>}
        <pre style={{ margin: 0, padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-elevated)', color: 'var(--color-text-main)', overflow: 'auto', maxHeight: '620px', fontSize: '12px', lineHeight: 1.55 }}>
          {draft ? JSON.stringify(draft, null, 2) : 'Pack Draft가 없습니다.'}
        </pre>
      </div>
    </div>
  );
};

export default PackBuilder;
