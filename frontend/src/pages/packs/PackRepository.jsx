import { Spinner } from '../../components/common/Loader';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import useProjects from '../../hooks/useProjects';
import {
  activateRuntimePack,
  approveRuntimePack,
  getActivePack,
  getPackExportDownloadUrl,
  importPackExport,
  listPackAuditLogs,
  listPackExports,
  listRuntimePacks,
  rejectRuntimePack,
  rollbackActivePack,
} from '../../api/intentFactory';

const fieldStyle = {
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
};

const PackRepository = () => {
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState('J-Brain');
  const [exports, setExports] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [activePack, setActivePack] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationKey, setOperationKey] = useState('');
  const [message, setMessage] = useState('');
  const [pendingOperation, setPendingOperation] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [exportsPage, setExportsPage] = useState(1);
  const [exportsPageSize, setExportsPageSize] = useState(10);

  const [runtimePage, setRuntimePage] = useState(1);
  const [runtimePageSize, setRuntimePageSize] = useState(10);

  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  useEffect(() => {
    setExportsPage(1);
    setRuntimePage(1);
    setAuditPage(1);
  }, [projectId]);

  const exportsTotal = exports.length;
  const exportsPages = Math.ceil(exportsTotal / exportsPageSize);
  const paginatedExports = exports.slice((exportsPage - 1) * exportsPageSize, exportsPage * exportsPageSize);

  const runtimeTotal = runtimePacks.length;
  const runtimePages = Math.ceil(runtimeTotal / runtimePageSize);
  const paginatedRuntime = runtimePacks.slice((runtimePage - 1) * runtimePageSize, runtimePage * runtimePageSize);

  const auditTotal = auditLogs.length;
  const auditPages = Math.ceil(auditTotal / auditPageSize);
  const paginatedAudit = auditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);

  const fetchAll = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [exportsData, runtimeData, activeData, logsData] = await Promise.all([
        listPackExports(projectId),
        listRuntimePacks(projectId),
        getActivePack(projectId),
        listPackAuditLogs(projectId),
      ]);
      setExports(exportsData.items || []);
      setRuntimePacks(runtimeData.items || []);
      setActivePack(activeData);
      setAuditLogs(logsData.items || []);
    } catch (err) {
      console.error(err);
      setMessage('Pack Repository 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [projectId]);

  const makeOperationKey = (action, id) => `${action}:${id}`;

  const isOperationRunning = (action, id) => operationKey === makeOperationKey(action, id);

  const handleImport = async (exportId) => {
    const key = makeOperationKey('import', exportId);
    setOperationKey(key);
    setMessage('Import 처리 중입니다. Pack ZIP을 Runtime Store에 반입하고 검증합니다.');
    try {
      const result = await importPackExport(projectId, exportId);
      await fetchAll();
      setMessage(`Import 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setMessage('Import 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleActivate = async (pack) => {
    const key = makeOperationKey('activate', pack.import_id || `${pack.pack_id}:${pack.pack_version}`);
    setOperationKey(key);
    setMessage('Active 전환 처리 중입니다. 승인된 Pack을 현재 Runtime 기준으로 설정합니다.');
    try {
      const result = await activateRuntimePack(projectId, {
        pack_id: pack.pack_id,
        pack_version: pack.pack_version,
        activated_by: 'System Admin',
      });
      await fetchAll();
      setMessage(`Active Pack 전환 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setMessage('Active 전환 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleApprove = async (pack) => {
    const key = makeOperationKey('approve', pack.import_id || `${pack.pack_id}:${pack.pack_version}`);
    setOperationKey(key);
    setMessage('Pack 승인 처리 중입니다. 승인 후 Active 전환 후보가 됩니다.');
    try {
      const result = await approveRuntimePack(projectId, pack.pack_id, pack.pack_version, {
        approved_by: 'System Admin',
      });
      await fetchAll();
      setMessage(`Pack 승인 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setMessage('Pack 승인 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleReject = async (pack, reason = '') => {
    const key = makeOperationKey('reject', pack.import_id || `${pack.pack_id}:${pack.pack_version}`);
    setOperationKey(key);
    setMessage('Pack 반려 처리 중입니다.');
    try {
      const result = await rejectRuntimePack(projectId, pack.pack_id, pack.pack_version, {
        approved_by: 'System Admin',
        reason: reason.trim() || '운영자 반려',
      });
      await fetchAll();
      setMessage(`Pack 반려 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setMessage('Pack 반려 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleRollback = async () => {
    setOperationKey('rollback');
    setMessage('Rollback 처리 중입니다. 직전 정상 Pack으로 되돌립니다.');
    try {
      const result = await rollbackActivePack(projectId);
      await fetchAll();
      setMessage(`Rollback 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setMessage('Rollback 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const openOperationConfirm = (type, payload) => {
    setRejectReason('');
    setPendingOperation({ type, payload });
  };

  const closeOperationConfirm = () => {
    if (operationKey) return;
    setPendingOperation(null);
    setRejectReason('');
  };

  const executePendingOperation = async () => {
    if (!pendingOperation) return;
    const { type, payload } = pendingOperation;
    if (type === 'import') {
      await handleImport(payload.export_id);
    } else if (type === 'approve') {
      await handleApprove(payload.pack);
    } else if (type === 'reject') {
      await handleReject(payload.pack, rejectReason);
    } else if (type === 'activate') {
      await handleActivate(payload.pack);
    } else if (type === 'rollback') {
      await handleRollback();
    }
    setPendingOperation(null);
    setRejectReason('');
  };

  const operationCopy = (() => {
    if (!pendingOperation) return {};
    const { type, payload } = pendingOperation;
    if (type === 'import') {
      return {
        title: 'Pack ZIP을 Runtime Store에 Import할까요?',
        description: `${payload.export_id} Export ZIP을 고객 내부망 Runtime Pack Store에 반입하고 Loader 검증을 수행합니다.`,
        confirmLabel: 'Import 실행',
      };
    }
    if (type === 'approve') {
      return {
        title: 'Runtime Pack을 승인할까요?',
        description: `${payload.pack.pack_id} v${payload.pack.pack_version} Pack을 Active 전환 가능한 승인 상태로 변경합니다.`,
        confirmLabel: 'Approve',
      };
    }
    if (type === 'reject') {
      return {
        title: 'Runtime Pack을 반려할까요?',
        description: `${payload.pack.pack_id} v${payload.pack.pack_version} Pack을 반려 상태로 변경합니다. 반려된 Pack은 Active 전환할 수 없습니다.`,
        confirmLabel: 'Reject',
        tone: 'danger',
      };
    }
    if (type === 'activate') {
      return {
        title: 'Active Pack으로 전환할까요?',
        description: `${payload.pack.pack_id} v${payload.pack.pack_version} Pack을 현재 프로젝트의 Runtime 기준 Pack으로 설정합니다.`,
        confirmLabel: 'Activate',
      };
    }
    if (type === 'rollback') {
      return {
        title: '직전 정상 Pack으로 Rollback할까요?',
        description: '현재 Active Pack을 이전 정상 Pack으로 되돌립니다. 운영 중인 Runtime 응답 기준이 변경됩니다.',
        confirmLabel: 'Rollback',
        tone: 'danger',
      };
    }
    return {};
  })();

  const activeLabel = activePack?.pack_id
    ? `${activePack.pack_id} v${activePack.pack_version}`
    : '미지정';

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Pack 제작/배포</span> {'>'} <span>Pack Repository</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>Pack Repository</h2>
          <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>Export ZIP, Runtime Pack Store, Active Pack, Rollback 상태를 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
            {projects.length === 0 && <option value={projectId}>{projectId}</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
          </select>
          <button className="btn-secondary" onClick={fetchAll} disabled={loading || Boolean(operationKey)}>{loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {[
          ['Export 이력', `${exports.length}건`],
          ['Runtime Store', `${runtimePacks.length}건`],
          ['Active Pack', activeLabel],
          ['Rollback 후보', activePack?.previous_pack_id ? `${activePack.previous_pack_id} v${activePack.previous_pack_version}` : '없음'],
        ].map(([label, value]) => (
          <div key={label} className="table-area" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--color-text-sub)', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
            <strong style={{ fontSize: label === 'Active Pack' ? '16px' : '22px', color: 'var(--color-primary)' }}>{value}</strong>
          </div>
        ))}
      </div>

      {message && <div className="table-area" style={{ padding: '12px 18px', marginBottom: '18px', color: 'var(--color-text-sub)' }}>{message}</div>}

      <div className="table-area" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Export ZIP 이력</h3>
          <button className="btn-secondary" onClick={() => openOperationConfirm('rollback', {})} disabled={!activePack?.previous_pack_id || Boolean(operationKey)}>
            {operationKey === 'rollback' ? 'Rollback 중...' : 'Rollback'}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Export ID</th>
              <th>Pack</th>
              <th>Status</th>
              <th>Counts</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExports.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Export된 Pack이 없습니다.</td></tr>
            ) : paginatedExports.map((item) => (
              <tr key={item.export_id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.export_id}</td>
                <td>{item.pack_id} v{item.pack_version}</td>
                <td><span className={`badge ${item.status === 'validated' ? 'active' : 'warning'}`}>{item.status}</span></td>
                <td style={{ color: 'var(--color-text-sub)' }}>Intent {item.counts?.intents ?? 0}, Entity {item.counts?.entities ?? 0}, FAQ {item.counts?.faqs ?? 0}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{item.created_at || '-'}</td>
                <td className="pack-repository-action-cell">
                  <a className="btn-table pack-action-button" href={getPackExportDownloadUrl(projectId, item.export_id)} target="_blank" rel="noreferrer" title="ZIP 다운로드">
                    <Download size={13} /> ZIP
                  </a>
                  <button className="btn-table pack-action-button" onClick={() => openOperationConfirm('import', { export_id: item.export_id })} disabled={Boolean(operationKey)}>
                    {isOperationRunning('import', item.export_id) ? 'Import 중...' : 'Import'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (
          <Pagination
            currentPage={exportsPage}
            totalPages={exportsPages}
            totalItems={exportsTotal}
            pageSize={exportsPageSize}
            onPageChange={setExportsPage}
            onPageSizeChange={setExportsPageSize}
          />
        )}
      </div>

      <div className="table-area" style={{ marginBottom: '18px' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Runtime Pack Store</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Import ID</th>
              <th>Pack</th>
              <th>Status</th>
              <th>승인</th>
              <th>Source Export</th>
              <th>Imported</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRuntime.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Import된 Runtime Pack이 없습니다.</td></tr>
            ) : paginatedRuntime.map((pack) => {
              const isActive = activePack?.pack_id === pack.pack_id && activePack?.pack_version === pack.pack_version;
              const canApprove = pack.status === 'validated';
              const canActivate = pack.status === 'approved' && !isActive;
              const operationId = pack.import_id || `${pack.pack_id}:${pack.pack_version}`;
              return (
                <tr key={pack.import_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{pack.import_id}</td>
                  <td>{pack.pack_id} v{pack.pack_version} {isActive && <span className="badge active">ACTIVE</span>}</td>
                  <td><span className={`badge ${['validated', 'approved', 'active'].includes(pack.status) ? 'active' : 'warning'}`}>{pack.status}</span></td>
                  <td style={{ color: 'var(--color-text-sub)' }}>
                    {pack.approved_by ? `${pack.approved_by}` : '-'}
                    {pack.rejected_reason ? ` / ${pack.rejected_reason}` : ''}
                  </td>
                  <td>{pack.source_export_id || '-'}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{pack.imported_at || '-'}</td>
                  <td className="pack-repository-action-cell">
                    <button className="btn-table pack-action-button" onClick={() => openOperationConfirm('approve', { pack })} disabled={!canApprove || Boolean(operationKey)}>
                      {isOperationRunning('approve', operationId) ? '승인 중...' : 'Approve'}
                    </button>
                    <button className="btn-table pack-action-button" onClick={() => openOperationConfirm('reject', { pack })} disabled={isActive || Boolean(operationKey)}>
                      {isOperationRunning('reject', operationId) ? '반려 중...' : 'Reject'}
                    </button>
                    <button className="btn-table pack-action-button" onClick={() => openOperationConfirm('activate', { pack })} disabled={!canActivate || Boolean(operationKey)}>
                      {isOperationRunning('activate', operationId) ? '활성화 중...' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && (
          <Pagination
            currentPage={runtimePage}
            totalPages={runtimePages}
            totalItems={runtimeTotal}
            pageSize={runtimePageSize}
            onPageChange={setRuntimePage}
            onPageSizeChange={setRuntimePageSize}
          />
        )}
      </div>

      <div className="table-area">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Pack Operation Audit</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Pack</th>
              <th>Status</th>
              <th>Message</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAudit.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>감사 로그가 없습니다.</td></tr>
            ) : paginatedAudit.map((log, index) => (
              <tr key={`${log.operation}-${log.created_at}-${index}`}>
                <td>{log.operation}</td>
                <td>{log.pack_id ? `${log.pack_id} v${log.pack_version}` : '-'}</td>
                <td><span className="badge active">{log.status}</span></td>
                <td style={{ color: 'var(--color-text-sub)' }}>{log.message || '-'}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{log.created_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (
          <Pagination
            currentPage={auditPage}
            totalPages={auditPages}
            totalItems={auditTotal}
            pageSize={auditPageSize}
            onPageChange={setAuditPage}
            onPageSizeChange={setAuditPageSize}
          />
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingOperation && pendingOperation.type !== 'reject')}
        title={operationCopy.title}
        description={operationCopy.description}
        confirmLabel={operationCopy.confirmLabel}
        cancelLabel="취소"
        tone={operationCopy.tone || 'default'}
        onConfirm={executePendingOperation}
        onCancel={closeOperationConfirm}
        loading={Boolean(operationKey)}
      />
      {pendingOperation?.type === 'reject' && (
        <div className="modal-overlay pack-reject-reason-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeOperationConfirm()}>
          <section className="modal-box confirm-modal danger" role="dialog" aria-modal="true">
            <h3>Runtime Pack 반려</h3>
            <p>{operationCopy.description}</p>
            <label className="confirm-modal-field">
              <span>반려 사유</span>
              <input
                type="text"
                className="modal-input"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="예: 검증 질문 실패로 반려"
              />
            </label>
            <div className="confirm-modal-actions">
              <button className="btn-secondary" type="button" onClick={closeOperationConfirm} disabled={Boolean(operationKey)}>취소</button>
              <button className="btn-danger" type="button" onClick={executePendingOperation} disabled={Boolean(operationKey)}>
                {operationKey ? '처리 중...' : 'Reject'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PackRepository;
