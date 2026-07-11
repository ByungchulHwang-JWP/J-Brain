import { Spinner } from '../../components/common/Loader';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  listPackExports,
  importPackExport,
  listRuntimePacks,
  getActivePack,
  activateRuntimePack,
  approveRuntimePack,
} from '../../api/intentFactory';
import { CheckCircle2, DownloadCloud, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';

const GlowDotBadge = ({ status, label }) => {
  const tone = {
    active: 'active', completed: 'completed', validated: 'validated',
    approved: 'active', pending: 'pending', error: 'error', failed: 'error',
  }[status] || 'pending';
  return (
    <span className={`glow-dot-badge ${tone}`}>
      <span className="glow-dot" />
      {label || status}
    </span>
  );
};

const PackVersions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const routeProjectId = searchParams.get('projectId') || searchParams.get('project');
  const projectId = routeProjectId || selectedProjectId;

  const [exports, setExports] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [activePack, setActivePack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [justDeployedPacks, setJustDeployedPacks] = useState(new Set());
  const [expandedExportId, setExpandedExportId] = useState(null);

  useEffect(() => {
    if (routeProjectId && routeProjectId !== selectedProjectId) {
      setSelectedProjectId(routeProjectId);
    }
  }, [routeProjectId, selectedProjectId, setSelectedProjectId]);

  const handleProjectChange = (nextProjectId) => {
    setSelectedProjectId(nextProjectId);
    setSearchParams({ projectId: nextProjectId }, { replace: true });
  };

  const loadData = async () => {
    if (!projectId) {
      setExports([]);
      setRuntimePacks([]);
      setActivePack(null);
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const [expRes, rpRes, actRes] = await Promise.all([
        listPackExports(projectId),
        listRuntimePacks(projectId),
        getActivePack(projectId),
      ]);
      setExports(expRes?.items || (Array.isArray(expRes) ? expRes : []));
      setRuntimePacks(rpRes?.items || (Array.isArray(rpRes) ? rpRes : []));
      setActivePack(actRes);
    } catch (err) {
      console.error(err);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [projectId]);

  const handleImport = async (exportId) => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    try {
      setLoading(true);
      await importPackExport(projectId, exportId);
      toast.success('런타임 Pack으로 등록되었습니다.');
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Import 중 오류가 발생했습니다: ' + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  const handleActivate = async (packId, packVersion) => {
    if (!projectId) {
      toast.error('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    try {
      setLoading(true);
      const pack = runtimePacks.find(p => p.pack_id === packId && p.pack_version === packVersion);
      if (pack && pack.status !== 'approved') {
        try {
          await approveRuntimePack(projectId, packId, packVersion, { approved_by: 'admin' });
        } catch (approveErr) {
          console.warn('Approve failed, but proceeding to activate:', approveErr);
        }
      }

      await activateRuntimePack(projectId, {
        pack_id: packId,
        pack_version: packVersion,
        activated_by: 'admin',
      });
      toast.success(`v${packVersion} 버전이 성공적으로 배포되었습니다.`);
      setJustDeployedPacks(prev => new Set(prev).add(`${packId}_${packVersion}`));
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('배포 중 오류가 발생했습니다: ' + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  return (
    <div className="inner">
      

      <div className="breadcrumb">
        <span>Pack 제작/배포</span> {'>'} <span>버전/배포 관리</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>버전/배포 관리</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
            생성된 Pack Export를 런타임으로 등록하고 실제 서비스 환경에 배포합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            style={{ minWidth: '220px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}
          >
            {projects.length === 0 && <option value="">프로젝트 없음</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

        {/* ── Runtime Packs Section (Glass Card) ── */}
        <div className="glass-card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlayCircle size={20} color="var(--color-primary)" />
              런타임 배포 현황
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
              현재 활성화된 버전과 런타임에 등록된 Pack 목록입니다.
            </p>
          </div>

          <table className="table-compact" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>상태</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>Pack ID</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>버전</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>등록 일시</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {runtimePacks.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--color-text-sub)' }}>등록된 런타임 Pack이 없습니다. 아래의 Export 이력에서 등록해주세요.</td></tr>
              ) : (
                runtimePacks.map((pack) => {
                  const isActive = activePack?.pack_id === pack.pack_id && activePack?.pack_version === pack.pack_version;
                  const isJustDeployed = justDeployedPacks.has(`${pack.pack_id}_${pack.pack_version}`);
                  return (
                    <tr key={`${pack.pack_id}_${pack.pack_version}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 8px' }}>
                        {isActive ? (
                          <GlowDotBadge status="active" label={isJustDeployed ? '방금 적용됨' : '현재 활성 (Active)'} />
                        ) : (
                          <GlowDotBadge status="pending" label="대기 중" />
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{pack.pack_id}</td>
                      <td style={{ padding: '10px 8px' }}>v{pack.pack_version}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--color-text-sub)' }}>{new Date(pack.created_at || pack.imported_at || Date.now()).toLocaleString()}</td>
                      <td style={{ padding: '10px 8px' }}>
                        {!isActive ? (
                          <button
                            className="btn-neon small"
                            style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleActivate(pack.pack_id, pack.pack_version)}
                            disabled={loading}
                          >
                            적용 (Deploy)
                          </button>
                        ) : isJustDeployed ? (
                          <span style={{ color: 'var(--color-text-sub)', fontSize: '13px', fontWeight: 500 }}>
                            배포 완료
                          </span>
                        ) : (
                          <button
                            className="btn-secondary small"
                            onClick={() => handleActivate(pack.pack_id, pack.pack_version)}
                            disabled={loading}
                            title="동일 버전으로 덮어쓴 경우 런타임에 다시 배포합니다."
                          >
                            재적용 (Redeploy)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Export History Section (Glass Card + Accordion) ── */}
        <div className="glass-card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DownloadCloud size={20} color="var(--color-text-sub)" />
              Pack Export 이력
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
              Pack Builder에서 생성된 압축 패키지 내역입니다. 런타임에 등록해야 배포할 수 있습니다.
            </p>
          </div>

          <table className="table-compact" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>Export ID</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>Pack ID</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>버전</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>상태</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>생성 일시</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {exports.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--color-text-sub)' }}>Export 내역이 없습니다. Pack Builder에서 Export를 진행해 주세요.</td></tr>
              ) : (
                exports.map((exp, idx) => (
                  <React.Fragment key={exp.export_id}>
                    <tr
                      style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                      onClick={() => setExpandedExportId(expandedExportId === exp.export_id ? null : exp.export_id)}
                    >
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {expandedExportId === exp.export_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {exp.export_id}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--color-text-sub)' }}>{exp.pack_id || '-'}</td>
                      <td style={{ padding: '10px 8px' }}>v{exp.pack_version}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <GlowDotBadge status={exp.status} label={exp.status} />
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--color-text-sub)' }}>{new Date(exp.created_at).toLocaleString()}</td>
                      <td style={{ padding: '10px 8px' }} onClick={(e) => e.stopPropagation()}>
                        {idx === 0 ? (
                          <button
                            className="btn-neon small"
                            style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleImport(exp.export_id)}
                            disabled={loading || !['completed', 'validated'].includes(exp.status)}
                          >
                            런타임 등록 (Import)
                          </button>
                        ) : (
                          <button
                            className="btn-secondary small"
                            onClick={() => handleImport(exp.export_id)}
                            disabled={loading || !['completed', 'validated'].includes(exp.status)}
                          >
                            런타임 등록
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedExportId === exp.export_id && (
                      <tr>
                        <td colSpan="6" className="accordion-detail">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div><strong>Export ID</strong><br /><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{exp.export_id}</span></div>
                            <div><strong>Pack ID</strong><br />{exp.pack_id || '-'}</div>
                            <div><strong>생성 방식</strong><br />{exp.source || 'DB Export'}</div>
                            <div><strong>포함 Intent 수</strong><br />{exp.intent_count ?? '-'}건</div>
                            <div><strong>포함 Entity 수</strong><br />{exp.entity_count ?? '-'}건</div>
                            <div><strong>파일 크기</strong><br />{exp.file_size ? `${(exp.file_size / 1024).toFixed(1)} KB` : '-'}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default PackVersions;
