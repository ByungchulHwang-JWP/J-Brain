import { Skeleton, Spinner } from '../../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, CircleSlash2, DatabaseZap, RotateCcw, Sparkles } from 'lucide-react';
import {
  applyApprovedDiscoveryCandidates,
  createDiscoveryRun,
  listDiscoveryCandidates,
  updateDiscoveryCandidateStatus,
} from '../../api/intentFactory';

const typeLabels = {
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

const CandidateReview = () => {
  const { projectId = 'J-Brain' } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');

  const loadCandidates = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await listDiscoveryCandidates(projectId);
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
    loadCandidates();
  }, [projectId]);

  const byType = useMemo(() => summary.by_type || {}, [summary]);
  const latestRun = summary.latest_run || null;
  const latestRunSourceNames = latestRun?.source_names || [];
  const approvedPendingCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items],
  );
  const orderedItems = useMemo(() => {
    const statusOrder = { pending: 0, approved: 1, rejected: 2, applied: 3 };
    return [...items].sort((a, b) => {
      const statusCompare = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      if (statusCompare !== 0) return statusCompare;
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });
  }, [items]);

  const handleRun = async (scope = 'all') => {
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
    setApplying(true);
    setMessage('');
    try {
      const result = await applyApprovedDiscoveryCandidates(projectId);
      await loadCandidates();
      setMessage(
        `승인 후보 적용이 완료되었습니다. Intent ${result.applied?.intents || 0}건, `
        + `Entity ${result.applied?.entities || 0}건, FAQ ${result.applied?.faqs || 0}건, `
        + `Action ${result.applied?.actions || 0}건, `
        + `검증 질문 ${result.applied?.validation_questions || 0}건이 반영되었습니다.`,
      );
    } catch (err) {
      console.error(err);
      setMessage(`승인 후보 적용에 실패했습니다: ${err.response?.data?.detail || err.message}`);
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

  return (
    <div className="inner workflow-page">
      <div className="breadcrumb">
        <span>구축 워크플로우</span> {'>'} <span>{projectId}</span> {'>'} <span>자동 후보 검토</span>
      </div>

      <div className="workflow-header">
        <div>
          <h2>Auto Discovery 후보 검토</h2>
          <p>Source/FAQ 기반으로 생성된 후보를 승인하거나 제외합니다. 승인된 후보만 워크플로우 진행률에 반영됩니다.</p>
        </div>
        <div className="workflow-header-actions">
          <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/2`)}>
            2단계로 돌아가기
          </button>
          <button className="btn-secondary" type="button" onClick={() => handleRun('new')} disabled={running}>
            <Sparkles size={16} /> {running ? '분석 중...' : '신규 자료 분석'}
          </button>
          <button className="btn-primary" type="button" onClick={() => handleRun('all')} disabled={running}>
            <Sparkles size={16} /> {running ? '생성 중...' : '전체 재분석'}
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={handleApplyApproved}
            disabled={applying || approvedPendingCount === 0}
          >
            <DatabaseZap size={16} /> {applying ? '적용 중...' : '승인 후보 적용'}
          </button>
        </div>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      {latestRun && (
        <div className="workflow-inline-note">
          최근 분석 결과: {latestRun.scope === 'new' ? '신규 자료 분석' : '전체 재분석'}
          {' · '}분석 대상 Source {latestRun.source_count || latestRunSourceNames.length || 0}건
          {latestRunSourceNames.length > 0 && ` · ${latestRunSourceNames.join(', ')}`}
        </div>
      )}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>전체 후보</span><strong>{summary.total || 0}건</strong><small>생성된 후보</small></div>
        <div className="panel workflow-status-card"><span>승인/적용</span><strong>{summary.approved || 0}건</strong><small>진행률 반영</small></div>
        <div className="panel workflow-status-card"><span>검토 대기</span><strong>{summary.pending || 0}건</strong><small>상태 결정 필요</small></div>
        <div className="panel workflow-status-card"><span>제외</span><strong>{summary.rejected || 0}건</strong><small>진행률 제외</small></div>
      </div>

      <section className="panel workflow-discovery-summary">
        <div className="workflow-board-head">
          <div>
            <h3>후보 유형별 현황</h3>
            <p>Category, Intent, Entity, FAQ, Source Scope, Action 후보를 한 번에 검토합니다.</p>
          </div>
        </div>
        <div className="workflow-type-chip-row">
          {Object.keys(typeLabels).map((type) => (
            <span className="workflow-pill blue" key={type}>{typeLabels[type]} {byType[type] || 0}</span>
          ))}
        </div>
      </section>

      <section className="panel workflow-table-card">
        <div className="workflow-board-head">
          <div>
            <h3>후보 목록</h3>
            <p>상태를 승인으로 변경하면 해당 후보 유형이 다음 단계 진행률에 반영됩니다.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={loadCandidates} disabled={loading}>
            {loading ? <><Spinner size={14} style={{marginRight: 6}} /> 새로고침</> : '새로고침'}
          </button>
        </div>
        <table>
          <thead>
            <tr>
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
              <tr><td colSpan="6">후보 목록을 불러오는 중입니다.</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6">생성된 후보가 없습니다. 자동 후보 생성을 실행해 주세요.</td></tr>
            ) : orderedItems.map((item) => {
              const names = sourceNames(item.payload);
              return (
              <tr key={item.candidate_id}>
                <td>{typeLabels[item.candidate_type] || item.candidate_type}</td>
                <td>
                  <div className="name">{item.title}</div>
                  <div className="meta">{item.reason}</div>
                  {names.length > 0 && <div className="meta">분석 Source: {names.join(', ')}</div>}
                </td>
                <td>{renderPayload(item.payload)}</td>
                <td>{Math.round(Number(item.confidence_score || 0) * 100)}%</td>
                <td><span className={`workflow-pill ${statusTone[item.status] || 'amber'}`}>{statusLabels[item.status] || item.status}</span></td>
                <td>
                  {item.status === 'applied' ? (
                    <span className="meta">Intent Factory DB 반영 완료</span>
                  ) : (
                    <div className="workflow-row-actions">
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
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default CandidateReview;
