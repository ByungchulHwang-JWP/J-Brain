import React, { useEffect, useState } from 'react';
import useProjects from '../../hooks/useProjects';
import {
  listPackExports,
  importPackExport,
  listRuntimePacks,
  getActivePack,
  activateRuntimePack,
  approveRuntimePack,
} from '../../api/intentFactory';
import { CheckCircle2, DownloadCloud, PlayCircle } from 'lucide-react';

const PackVersions = () => {
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState('J-Brain');
  
  const [exports, setExports] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [activePack, setActivePack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [justDeployedPacks, setJustDeployedPacks] = useState(new Set());

  const loadData = async () => {
    setLoading(true);
    setMessage('');
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
      setMessage('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [projectId]);

  const handleImport = async (exportId) => {
    try {
      setLoading(true);
      await importPackExport(projectId, exportId);
      setMessage('성공적으로 런타임 Pack으로 등록되었습니다.');
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage('Import 중 오류가 발생했습니다: ' + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  const handleActivate = async (packId, packVersion) => {
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
      setMessage('런타임 Pack이 성공적으로 배포(활성화)되었습니다.');
      setJustDeployedPacks(prev => new Set(prev).add(`${packId}_${packVersion}`));
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage('배포 중 오류가 발생했습니다: ' + (err.response?.data?.detail || err.message));
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
            onChange={(e) => setProjectId(e.target.value)} 
            style={{ minWidth: '220px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}
          >
            {projects.length === 0 && <option value={projectId}>{projectId}</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? '조회 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {message && <div style={{ padding: '12px 16px', background: 'var(--color-input-bg)', borderRadius: '6px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Runtime Packs Section */}
        <div className="table-area" style={{ padding: '20px', background: 'var(--color-bg-elevated)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlayCircle size={20} color="var(--color-primary)" />
              런타임 배포 현황
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
              현재 활성화된 버전과 런타임에 등록된 Pack 목록입니다.
            </p>
          </div>
          
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>상태</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>Pack ID</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>버전</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>등록 일시</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>관리</th>
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
                    <tr key={`${pack.pack_id}_${pack.pack_version}`} style={{ borderBottom: '1px solid var(--color-border)', background: isActive ? 'rgba(0, 120, 255, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '12px 8px' }}>
                        {isActive ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 600, fontSize: '13px', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                            <CheckCircle2 size={14} /> {isJustDeployed ? '방금 적용됨' : '현재 활성 (Active)'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-sub)', fontSize: '13px' }}>대기 중</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 500 }}>{pack.pack_id}</td>
                      <td style={{ padding: '12px 8px' }}>v{pack.pack_version}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--color-text-sub)' }}>{new Date(pack.created_at || pack.imported_at || Date.now()).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {!isActive ? (
                          <button 
                            className="btn-primary small" 
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

        {/* Export History Section */}
        <div className="table-area" style={{ padding: '20px', background: 'var(--color-bg-elevated)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DownloadCloud size={20} color="var(--color-text-sub)" />
              Pack Export 이력
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
              Pack Builder에서 생성된 압축 패키지 내역입니다. 런타임에 등록해야 배포할 수 있습니다.
            </p>
          </div>

          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>Export ID</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>버전</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>상태</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>생성 일시</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-sub)', fontWeight: 500 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {exports.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--color-text-sub)' }}>Export 내역이 없습니다. Pack Builder에서 Export를 진행해 주세요.</td></tr>
              ) : (
                exports.map((exp) => (
                  <tr key={exp.export_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{exp.export_id}</td>
                    <td style={{ padding: '12px 8px' }}>v{exp.pack_version}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: exp.status === 'completed' ? 'var(--color-success)' : 'var(--color-text-sub)', fontSize: '13px' }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-sub)' }}>{new Date(exp.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <button 
                        className="btn-secondary small" 
                        onClick={() => handleImport(exp.export_id)}
                        disabled={loading || !['completed', 'validated'].includes(exp.status)}
                      >
                        런타임 등록 (Import)
                      </button>
                    </td>
                  </tr>
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
