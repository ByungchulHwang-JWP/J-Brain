import { OverlayLoader } from '../../components/common/Loader';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import { createPackExport, getPackDraft, getPackExportDownloadUrl, listPackExports } from '../../api/intentFactory';

const PackBuilder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const routeProjectId = searchParams.get('projectId') || searchParams.get('project');
  const projectId = routeProjectId || selectedProjectId;
  const [draft, setDraft] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  useEffect(() => {
    if (routeProjectId && routeProjectId !== selectedProjectId) {
      setSelectedProjectId(routeProjectId);
    }
  }, [routeProjectId, selectedProjectId, setSelectedProjectId]);

  const handleProjectChange = (nextProjectId) => {
    setSelectedProjectId(nextProjectId);
    setSearchParams({ projectId: nextProjectId }, { replace: true });
  };

  const loadDraft = async () => {
    if (!projectId) {
      setDraft(null);
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await getPackDraft(projectId);
      setDraft(data);
      setExportResult(null);
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

  const handleExport = async () => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setExporting(true);
    setMessage('');
    try {
      const exportsRes = await listPackExports(projectId);
      const exportItems = exportsRes?.items || (Array.isArray(exportsRes) ? exportsRes : []);
      let nextVersion = '0.1.0';
      if (exportItems.length > 0) {
        const versions = exportItems.map(e => e.pack_version);
        const maxMinor = Math.max(...versions.map(v => {
          const parts = v.split('.');
          return parseInt(parts[1] || '0', 10);
        }));
        nextVersion = `0.${maxMinor + 1}.0`;
      }
      const result = await createPackExport(projectId, {
        pack_id: `${projectId}-intent-pack`,
        pack_version: nextVersion,
      });
      setExportResult(result);
      setMessage(`Pack 빌드 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setExportResult(null);
      setMessage('Pack 빌드에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setExporting(false);
    }
  };

  const counts = draft?.counts || {};
  const validation = exportResult?.validation;

  return (
    <div className="inner">
      {exporting && <OverlayLoader title="Pack 빌드 중..." description="인텐트 및 액션을 패키징하고 있습니다." />}
      <div className="breadcrumb">
        <span>Pack 제작/배포</span> {'>'} <span>Pack Builder</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>Pack Builder</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>DB에 저장된 Intent, Entity, Action 연결, Source Scope로 Pack JSON 초안을 생성합니다.</p>
        </div>
        <div className="responsive-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-primary" onClick={loadDraft} disabled={loading || !projectId}>{loading ? '생성 중...' : 'Draft 생성'}</button>
          <button className="btn-secondary" onClick={handleExport} disabled={exporting || !draft || !projectId}>{exporting ? '빌드 중...' : 'Pack 빌드'}</button>
        </div>
      </div>

      <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {[
          ['Intent', counts.intents ?? 0],
          ['Example', counts.intent_examples ?? 0],
          ['Entity', counts.entities ?? 0],
          ['Action Param', counts.action_parameters ?? 0],
          ['FAQ', counts.faqs ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="table-area" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
            <strong style={{ fontSize: '24px', color: 'var(--color-primary)' }}>{value}건</strong>
          </div>
        ))}
      </div>

      {exportResult && (
        <div className="table-area" style={{ padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Export 결과</h3>
              <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)' }}>
                {exportResult.pack_id} v{exportResult.pack_version} / {exportResult.status}
              </p>
            </div>
            <a
              className="btn-primary"
              href={getPackExportDownloadUrl(projectId, exportResult.export_id)}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              ZIP 다운로드
            </a>
          </div>
          <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div>
              <div style={{ color: 'var(--color-text-sub)', fontSize: '13px' }}>검증 상태</div>
              <strong style={{ color: validation?.valid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {validation?.valid ? '통과' : '실패'}
              </strong>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-sub)', fontSize: '13px' }}>오류 수</div>
              <strong>{validation?.error_count ?? 0}건</strong>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-sub)', fontSize: '13px' }}>Export ID</div>
              <strong>{exportResult.export_id}</strong>
            </div>
          </div>
          {validation?.errors?.length > 0 && (
            <ul style={{ margin: '14px 0 0', color: 'var(--color-danger)' }}>
              {validation.errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          )}
        </div>
      )}

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
