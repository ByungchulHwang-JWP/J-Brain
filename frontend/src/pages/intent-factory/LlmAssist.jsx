import { OverlayLoader, Skeleton, Spinner } from '../../components/common/Loader';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleSlash2, DatabaseZap, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { useProjectContext } from '../../context/ProjectContext';
import {
  applyApprovedDiscoveryCandidates,
  createDiscoveryRun,
  listDiscoveryCandidates,
  updateDiscoveryCandidateStatus,
} from '../../api/intentFactory';

const typeLabels = {
  ALL: '전체',
  CATEGORY: 'Category',
  INTENT: 'Intent',
  ENTITY: 'Entity',
  FAQ: 'FAQ',
  SOURCE_SCOPE: 'Source Scope',
  ACTION: 'Action',
};

const statusLabels = {
  pending: '검토 대기',
  approved: '승인',
  applied: '적용 완료',
  rejected: '제외',
};

const statusTone = {
  pending: 'amber',
  approved: 'green',
  applied: 'blue',
  rejected: 'red',
};

const LlmAssist = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectContext();
  const projectId = selectedProjectId;
  
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState('ALL');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  const loadCandidates = async (targetProjectId = projectId) => {
    if (!targetProjectId) {
      setItems([]);
      setSummary({});
      setMessage('프로젝트를 먼저 선택해 주세요.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await listDiscoveryCandidates(targetProjectId);
      setItems(data.items || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error(err);
      setMessage('후보 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates(projectId);
  }, [projectId]);

  const handleProjectChange = (e) => {
    const nextProjectId = e.target.value;
    setSelectedProjectId(nextProjectId);
    setSearchParams({ project: nextProjectId }, { replace: true });
  };

  const byType = useMemo(() => summary.by_type || {}, [summary]);
  const latestRun = summary.latest_run || null;
  const latestRunSourceNames = latestRun?.source_names || [];
  const approvedPendingCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items],
  );
  
  const filteredAndOrderedItems = useMemo(() => {
    const statusOrder = { pending: 0, approved: 1, rejected: 2, applied: 3 };
    let filtered = items;
    if (activeTab !== 'ALL') {
      filtered = items.filter(item => item.candidate_type === activeTab);
    }
    return [...filtered].sort((a, b) => {
      const statusCompare = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      if (statusCompare !== 0) return statusCompare;
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });
  }, [items, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, projectId]);

  const totalItems = filteredAndOrderedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndOrderedItems.slice(start, start + pageSize);
  }, [filteredAndOrderedItems, currentPage, pageSize]);

  const handleRun = async (scope = 'all') => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setRunning(true);
    setMessage('');
    try {
      const run = await createDiscoveryRun(projectId, scope);
      setSummary(run.summary || {});
      await loadCandidates();
      setMessage(
        scope === 'new'
          ? '신규 자료 분석이 완료되었습니다. 새 Source 기준 후보가 기존 검토 후보에 병합되었습니다.'
          : '전체 재분석이 완료되었습니다. 기존 검토 후보는 최신 결과로 교체되었습니다.',
      );
    } catch (err) {
      console.error(err);
      setMessage(`자동 후보 생성에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleStatus = async (candidateId, status) => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setMessage('');
    try {
      await updateDiscoveryCandidateStatus(projectId, candidateId, status);
      await loadCandidates();
    } catch (err) {
      console.error(err);
      setMessage(`상태 변경에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleApplyApproved = async () => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    setApplying(true);
    setMessage('');
    try {
      const result = await applyApprovedDiscoveryCandidates(projectId);
      await loadCandidates();
      setMessage(
        `승인 후보 적용이 완료되었습니다. Intent ${result.applied?.intents || 0}건, `
        + `Entity ${result.applied?.entities || 0}건, FAQ ${result.applied?.faqs || 0}건, `
        + `Action ${result.applied?.actions || 0}건, `
        + `검증 질문 ${result.applied?.validation_questions || 0}건이 반영되었습니다.`
      );
    } catch (err) {
      console.error(err);
      setMessage(`승인 후보 적용에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setApplying(false);
    }
  };

  const handleApproveAll = async () => {
    if (!projectId) {
      setMessage('프로젝트를 먼저 선택해 주세요.');
      return;
    }
    const pendingItems = filteredAndOrderedItems.filter(item => item.status === 'pending');
    if (pendingItems.length === 0 && approvedPendingCount === 0) {
      setMessage('현재 목록에 승인하거나 적용할 후보가 없습니다.');
      return;
    }

    const confirmMessage = pendingItems.length > 0
      ? `현재 목록의 대기 중인 ${pendingItems.length}건을 일괄 승인하고 Intent Factory DB에 적용하시겠습니까?`
      : `이미 승인된 ${approvedPendingCount}건을 Intent Factory DB에 적용하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setApplying(true);
    setMessage('');
    try {
      await Promise.all(pendingItems.map(item =>
        updateDiscoveryCandidateStatus(projectId, item.candidate_id, 'approved')
      ));
      const result = await applyApprovedDiscoveryCandidates(projectId);
      await loadCandidates();
      setMessage(
        `${pendingItems.length || approvedPendingCount}건이 승인 및 적용되었습니다. Intent ${result.applied?.intents || 0}건, `
        + `Entity ${result.applied?.entities || 0}건, FAQ ${result.applied?.faqs || 0}건, `
        + `Action ${result.applied?.actions || 0}건이 반영되었습니다.`
      );
    } catch (err) {
      console.error(err);
      setMessage(`일괄 승인에 실패했습니다: ${err.message}`);
    } finally {
      setApplying(false);
    }
  };

  const renderPayload = (payload = {}) => {
    const fields = [
      payload.intent_id,
      payload.intent_name,
      payload.action_id,
      payload.action_name,
      payload.entity_type,
      payload.display_name,
      payload.faq_id,
      payload.question,
      payload.category,
      payload.source_category,
    ].filter(Boolean);
    return fields.slice(0, 4).join(' / ') || '-';
  };

  const sourceNames = (payload = {}) => payload.source_names || payload.sourceNames || [];

  const toggleRowExpanded = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <div className="inner">
      {running && <OverlayLoader title="LLM 초안 생성 중..." description="문서를 분석하여 Intent와 질문을 생성하고 있습니다." />}
      <div className="breadcrumb">
        <span>Intent Factory</span> {'>'} <span>LLM 지원 도구</span>
      </div>

      <div className="page-header" style={{ padding: '12px 0 20px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontWeight: 600 }}>LLM 지원 도구</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
            외부망에서 Intent/Entity/FAQ 후보를 생성하고 전문가 검수로 확정하는 지원 도구입니다.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-sub)' }}>대상 프로젝트:</span>
          <select 
            className="input" 
            style={{ width: '200px', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }} 
            value={projectId} 
            onChange={handleProjectChange}
            disabled={loadingProjects}
          >
            {loadingProjects ? (
              <option value="">불러오는 중...</option>
            ) : projects.length === 0 ? (
              <option value="">프로젝트 없음</option>
            ) : (
              projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="workflow-knowledge-metrics" style={{ marginBottom: '20px' }}>
        <div className="panel workflow-status-card"><span>전체 후보</span><strong>{summary.total || 0}건</strong><small>생성된 후보</small></div>
        <div className="panel workflow-status-card"><span>승인/적용</span><strong>{summary.approved || 0}건</strong><small>진행률 반영</small></div>
        <div className="panel workflow-status-card"><span>검토 대기</span><strong>{summary.pending || 0}건</strong><small>상태 결정 필요</small></div>
        <div className="panel workflow-status-card"><span>제외</span><strong>{summary.rejected || 0}건</strong><small>진행률 제외</small></div>
      </div>

      <div className="workflow-header-actions" style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        <button className="btn-secondary" type="button" onClick={() => handleRun('new')} disabled={running || !projectId}>
          <Sparkles size={16} /> {running ? '분석 중...' : '신규 자료 분석'}
        </button>
        <button className="btn-primary" type="button" onClick={() => handleRun('all')} disabled={running || !projectId}>
          <Sparkles size={16} /> {running ? '생성 중...' : '전체 재분석'}
        </button>
        <button
          className="btn-primary"
          type="button"
          onClick={handleApplyApproved}
          disabled={applying || approvedPendingCount === 0 || !projectId}
        >
          <DatabaseZap size={16} /> {applying ? '적용 중...' : '승인 후보 적용'}
        </button>
      </div>

      {message && <div className="workflow-message" style={{ marginBottom: '20px' }}>{message}</div>}

      {latestRun && (
        <div className="workflow-inline-note" style={{ marginBottom: '20px' }}>
          최근 분석 결과: {latestRun.scope === 'new' ? '신규 자료 분석' : '전체 재분석'}
          {' · '}분석 대상 Source {latestRun.source_count || latestRunSourceNames.length || 0}건
          {latestRunSourceNames.length > 0 && ` · ${latestRunSourceNames.join(', ')}`}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {Object.entries(typeLabels).map(([key, label]) => {
          if (key === 'ALL') {
             return (
              <button 
                key={key} 
                className={activeTab === key ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setActiveTab(key)}
              >
                {label} <span style={{ opacity: 0.7, fontSize: '0.9em', marginLeft: '4px' }}>{summary.total || 0}</span>
              </button>
            )
          }
          return (
            <button 
              key={key} 
              className={activeTab === key ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab(key)}
            >
              {label} <span style={{ opacity: 0.7, fontSize: '0.9em', marginLeft: '4px' }}>{byType[key] || 0}</span>
            </button>
          )
        })}
      </div>

      <section className="panel workflow-table-card">
        <div className="workflow-board-head">
          <div>
            <h3>후보 목록</h3>
            <p>상태를 승인으로 변경하면 해당 후보 유형이 다음 단계 진행률에 반영됩니다.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleApproveAll}
              disabled={applying || (filteredAndOrderedItems.filter(i => i.status === 'pending').length === 0 && approvedPendingCount === 0)}
            >
              <CheckCircle2 size={14} style={{ marginRight: 6 }} /> 목록 전체 승인 및 적용
            </button>
            <button className="btn-secondary" type="button" onClick={() => loadCandidates(projectId)} disabled={loading || !projectId}>
              {loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}
            </button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}></th>
              <th>유형</th>
              <th>후보</th>
              <th>주요 값</th>
              <th>신뢰도</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-sub)' }}>후보 목록을 불러오는 중입니다.</td></tr>
            ) : paginatedItems.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-sub)' }}>생성된 후보가 없습니다. 자동 후보 생성을 실행해 주세요.</td></tr>
            ) : paginatedItems.map((item) => {
              const names = sourceNames(item.payload);
              const isExpanded = expandedRowId === item.candidate_id;
              return (
                <React.Fragment key={item.candidate_id}>
                  <tr style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)' }} onClick={() => toggleRowExpanded(item.candidate_id)}>
                    <td style={{ textAlign: 'center', color: 'var(--color-text-sub)' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                    <td>{typeLabels[item.candidate_type] || item.candidate_type}</td>
                    <td>
                      <div className="name" style={{ fontWeight: 500 }}>{item.title}</div>
                      <div className="meta" style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '4px' }}>{item.reason}</div>
                      {names.length > 0 && <div className="meta" style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '2px' }}>분석 Source: {names.join(', ')}</div>}
                    </td>
                    <td>{renderPayload(item.payload)}</td>
                    <td>{Math.round(Number(item.confidence_score || 0) * 100)}%</td>
                    <td><span className={`workflow-pill ${statusTone[item.status] || 'amber'}`}>{statusLabels[item.status] || item.status}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {item.status === 'applied' ? (
                        <span className="meta">DB 반영 완료</span>
                      ) : (
                        <div className="workflow-row-actions" style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" className="btn-secondary small" onClick={() => handleStatus(item.candidate_id, 'approved')}>
                            <CheckCircle2 size={14} /> 승인
                          </button>
                          <button type="button" className="btn-secondary small" onClick={() => handleStatus(item.candidate_id, 'rejected')}>
                            <CircleSlash2 size={14} /> 제외
                          </button>
                          <button type="button" className="btn-secondary small" onClick={() => handleStatus(item.candidate_id, 'pending')}>
                            <RotateCcw size={14} /> 대기
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td colSpan="7" style={{ padding: '0' }}>
                        <div style={{ padding: '16px 24px', background: 'var(--color-bg-sub)', borderTop: '1px dashed var(--color-border)' }}>
                           <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-main)' }}>상세 데이터 (Payload)</h4>
                           <pre style={{ margin: 0, padding: '12px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '6px', overflowX: 'auto', fontSize: '13px', color: 'var(--color-text-main)' }}>
                             {JSON.stringify(item.payload, null, 2)}
                           </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
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
      </section>
    </div>
  );
};

export default LlmAssist;
