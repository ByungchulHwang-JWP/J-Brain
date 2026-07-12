import { Spinner } from '../../components/common/Loader';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useProjectContext } from '../../context/ProjectContext';
import {
  activateRuntimePack,
  approveRuntimePack,
  getActivePack,
  importPackExport,
  listPackAuditLogs,
  listPackExports,
  listRuntimePacks,
  rejectRuntimePack,
  rollbackActivePack,
} from '../../api/intentFactory';
import PackHistoryPanels from './PackHistoryPanels';
import PackLifecycleSummary from './PackLifecycleSummary';
import RuntimePackStoreTable from './RuntimePackStoreTable';
import { getPackLifecycleSummary } from './packLifecycleModel';

const fieldStyle = {
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
};

const PackRepository = ({ embedded = false, onLifecycleSummaryChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectContext();
  const routeProjectId = searchParams.get('projectId') || searchParams.get('project');
  const projectId = routeProjectId || selectedProjectId;
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
    if (routeProjectId && routeProjectId !== selectedProjectId) {
      setSelectedProjectId(routeProjectId);
    }
  }, [routeProjectId, selectedProjectId, setSelectedProjectId]);

  const handleProjectChange = (nextProjectId) => {
    setSelectedProjectId(nextProjectId);
    setSearchParams({ projectId: nextProjectId }, { replace: true });
  };

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
    if (!projectId) {
      setExports([]);
      setRuntimePacks([]);
      setActivePack(null);
      setAuditLogs([]);
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
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

  const handleImport = async (exportId) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    const key = makeOperationKey('import', exportId);
    setOperationKey(key);
    setMessage('Runtime Store 반입 처리 중입니다. Pack ZIP을 반입하고 Loader 검증을 수행합니다.');
    try {
      const result = await importPackExport(projectId, exportId);
      await fetchAll();
      setMessage(`Runtime Store 반입 완료: ${result.pack_id} v${result.pack_version}. 아직 챗봇에는 적용되지 않았습니다.`);
    } catch (err) {
      console.error(err);
      setMessage('Runtime Store 반입 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleActivate = async (pack) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    const key = makeOperationKey('activate', pack.import_id || `${pack.pack_id}:${pack.pack_version}`);
    setOperationKey(key);
    setMessage('챗봇 적용 처리 중입니다. 승인된 Pack을 현재 Runtime 기준으로 설정합니다.');
    try {
      const result = await activateRuntimePack(projectId, {
        pack_id: pack.pack_id,
        pack_version: pack.pack_version,
        activated_by: 'System Admin',
      });
      await fetchAll();
      setMessage(`챗봇 적용 완료: ${result.pack_id} v${result.pack_version}. 이제 챗봇 위젯과 Runtime Simulation에서 사용됩니다.`);
    } catch (err) {
      console.error(err);
      setMessage('챗봇 적용 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleApprove = async (pack) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    const key = makeOperationKey('approve', pack.import_id || `${pack.pack_id}:${pack.pack_version}`);
    setOperationKey(key);
    setMessage('운영 승인 처리 중입니다. 승인 후 챗봇 적용 후보가 됩니다.');
    try {
      const result = await approveRuntimePack(projectId, pack.pack_id, pack.pack_version, {
        approved_by: 'System Admin',
      });
      await fetchAll();
      setMessage(`운영 승인 완료: ${result.pack_id} v${result.pack_version}. "챗봇에 적용"을 실행하면 실제 Runtime 기준이 변경됩니다.`);
    } catch (err) {
      console.error(err);
      setMessage('운영 승인 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOperationKey('');
    }
  };

  const handleReject = async (pack, reason = '') => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
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
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setOperationKey('rollback');
    setMessage('이전 Pack으로 되돌리는 중입니다. 직전 정상 Pack을 챗봇 적용 Pack으로 복구합니다.');
    try {
      const result = await rollbackActivePack(projectId);
      await fetchAll();
      setMessage(`이전 Pack으로 되돌리기 완료: ${result.pack_id} v${result.pack_version}`);
    } catch (err) {
      console.error(err);
      setMessage('이전 Pack으로 되돌리기 실패: ' + (err.response?.data?.detail || err.message));
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
        title: 'Pack ZIP을 Runtime Store에 반입할까요?',
        description: `${payload.export_id} Export ZIP을 Runtime Pack Store에 반입하고 Loader 검증을 수행합니다. 이 단계만으로는 챗봇에 적용되지 않습니다.`,
        confirmLabel: 'Runtime Store 반입',
      };
    }
    if (type === 'approve') {
      return {
        title: 'Runtime Pack을 운영 승인할까요?',
        description: `${payload.pack.pack_id} v${payload.pack.pack_version} Pack을 챗봇 적용 가능한 승인 상태로 변경합니다. 승인 후에도 "챗봇에 적용"을 실행해야 실제 Runtime 기준이 바뀝니다.`,
        confirmLabel: '운영 승인',
      };
    }
    if (type === 'reject') {
      return {
        title: 'Runtime Pack을 반려할까요?',
        description: `${payload.pack.pack_id} v${payload.pack.pack_version} Pack을 반려 상태로 변경합니다. 반려된 Pack은 챗봇에 적용할 수 없습니다.`,
        confirmLabel: '반려',
        tone: 'danger',
      };
    }
    if (type === 'activate') {
      return {
        title: '이 Pack을 챗봇에 적용할까요?',
        description: `${payload.pack.pack_id} v${payload.pack.pack_version} Pack을 현재 프로젝트의 적용 Pack으로 설정합니다. 적용 후 오른쪽 하단 챗봇 위젯과 Runtime 시뮬레이션이 이 Pack 기준으로 응답합니다.`,
        confirmLabel: '챗봇에 적용',
      };
    }
    if (type === 'rollback') {
      return {
        title: '이전 Pack으로 되돌릴까요?',
        description: '현재 챗봇 적용 Pack을 이전 정상 Pack으로 되돌립니다. 운영 중인 Runtime 응답 기준이 변경됩니다.',
        confirmLabel: '이전 Pack으로 되돌리기',
        tone: 'danger',
      };
    }
    return {};
  })();

  const lifecycleSummary = getPackLifecycleSummary({ exports, runtimePacks, activePack });
  const validationLabel = runtimePacks.length > 0 ? 'Runtime Pack 준비' : '최근 검증 정보 없음';

  useEffect(() => {
    onLifecycleSummaryChange?.(lifecycleSummary);
  }, [lifecycleSummary.currentStepId, lifecycleSummary.nextActionLabel, onLifecycleSummaryChange]);

  return (
    <div className={embedded ? '' : 'inner'}>
      {!embedded && (
        <>
          <div className="breadcrumb">
            <span>Pack 제작/배포</span> {'>'} <span>Pack Repository</span>
          </div>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: 0 }}>
            <div>
              <h2 style={{ fontWeight: 700 }}>Release & Deploy</h2>
              <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>Pack을 Runtime Store에 반입하고, 운영 승인 후 챗봇에 적용합니다.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
                {projects.length === 0 && <option value="">프로젝트 없음</option>}
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
              </select>
              <button className="btn-secondary" onClick={fetchAll} disabled={loading || Boolean(operationKey)}>{loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}</button>
            </div>
          </div>
        </>
      )}
      {embedded && (
        <div className="console-embedded-toolbar">
          <div>
            <h3>Release & Deploy</h3>
            <p>Import는 반입, Approve는 운영 승인, Activate는 실제 챗봇 적용입니다.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} style={{ minWidth: '220px', ...fieldStyle }}>
              {projects.length === 0 && <option value="">프로젝트 없음</option>}
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.id})</option>)}
            </select>
            <button className="btn-secondary" onClick={fetchAll} disabled={loading || Boolean(operationKey)}>{loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}</button>
          </div>
        </div>
      )}

      <PackLifecycleSummary summary={lifecycleSummary} validationLabel={validationLabel} />

      {message && <div className="table-area" style={{ padding: '12px 18px', marginBottom: '18px', color: 'var(--color-text-sub)' }}>{message}</div>}

      <RuntimePackStoreTable
        packs={paginatedRuntime}
        activePack={activePack}
        operationKey={operationKey}
        onApprove={(pack) => openOperationConfirm('approve', { pack })}
        onReject={(pack) => openOperationConfirm('reject', { pack })}
        onActivate={(pack) => openOperationConfirm('activate', { pack })}
        paginationProps={!loading ? {
          currentPage: runtimePage,
          totalPages: runtimePages,
          totalItems: runtimeTotal,
          pageSize: runtimePageSize,
          onPageChange: setRuntimePage,
          onPageSizeChange: setRuntimePageSize,
        } : null}
      />

      <PackHistoryPanels
        exports={paginatedExports}
        auditLogs={paginatedAudit}
        projectId={projectId}
        operationKey={operationKey}
        activePack={activePack}
        onImport={(exportId) => openOperationConfirm('import', { export_id: exportId })}
        onRollback={() => openOperationConfirm('rollback', {})}
        exportPaginationProps={!loading ? {
          currentPage: exportsPage,
          totalPages: exportsPages,
          totalItems: exportsTotal,
          pageSize: exportsPageSize,
          onPageChange: setExportsPage,
          onPageSizeChange: setExportsPageSize,
        } : null}
        auditPaginationProps={!loading ? {
          currentPage: auditPage,
          totalPages: auditPages,
          totalItems: auditTotal,
          pageSize: auditPageSize,
          onPageChange: setAuditPage,
          onPageSizeChange: setAuditPageSize,
        } : null}
      />

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
                {operationKey ? '처리 중...' : '반려'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PackRepository;
