import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, DatabaseZap, Link2, MousePointerClick, PlayCircle, Search, X } from 'lucide-react';
import { createAction, listActions, listIntents } from '../../../api/intentFactory';

const actionTypeMeta = {
  NAVIGATE: { label: '화면 이동', icon: MousePointerClick },
  SEARCH_DOC: { label: '문서 검색', icon: Search },
  QUERY: { label: '정형 조회', icon: DatabaseZap },
  API: { label: 'API 호출', icon: DatabaseZap },
  GUIDE: { label: '안내', icon: Compass },
};

const emptyActionForm = {
  action_id: '',
  action_name: '',
  action_type: 'NAVIGATE',
  description: '',
  execution_mode: 'local',
  route_value: '',
  menu_name: '',
  api_method: 'GET',
  api_endpoint: '',
  sql_template: '',
  allowed_roles_text: 'ROLE_ADMIN',
};

const normalizeActionIdPart = (value) => String(value || '')
  .replace(/[^a-zA-Z0-9가-힣\s_-]/g, '')
  .trim()
  .replace(/\s+/g, '_')
  .replace(/[^a-zA-Z0-9_-]/g, '')
  .toUpperCase();

const ActionConnectionStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [intents, setIntents] = useState([]);
  const [activeView, setActiveView] = useState('unlinked');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [actionForm, setActionForm] = useState(emptyActionForm);
  const [savingAction, setSavingAction] = useState(false);
  const [selectedTestActionId, setSelectedTestActionId] = useState('');
  const [testResult, setTestResult] = useState(null);

  const loadConnections = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [actionData, intentData] = await Promise.all([
          listActions(projectId),
          listIntents(projectId),
        ]);
        setActions(actionData.items || []);
        setIntents(intentData.items || []);
      } catch (err) {
        console.error(err);
        setActions([]);
        setIntents([]);
        setMessage('Action 연결 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadConnections();
  }, [projectId]);

  const activeActions = actions.filter((action) => action.status !== 'archived');
  const activeIntents = intents.filter((intent) => intent.status !== 'archived');
  const linkedIntents = activeIntents.filter((intent) => intent.action_id);
  const unlinkedIntents = activeIntents.filter((intent) => !intent.action_id);
  const orphanActions = activeActions.filter((action) => Number(action.linked_intent_count || 0) === 0);
  const navigateActions = activeActions.filter((action) => action.action_type === 'NAVIGATE');
  const searchActions = activeActions.filter((action) => action.action_type === 'SEARCH_DOC');
  const queryActions = activeActions.filter((action) => ['QUERY', 'API'].includes(action.action_type));
  const linkRate = activeIntents.length > 0 ? Math.round((linkedIntents.length / activeIntents.length) * 100) : 0;

  const currentRows = useMemo(() => {
    if (activeView === 'actions') return activeActions;
    if (activeView === 'orphan') return orphanActions;
    return unlinkedIntents;
  }, [activeActions, activeView, orphanActions, unlinkedIntents]);

  const generateActionId = (type, name) => {
    const normalizedProjectId = normalizeActionIdPart(projectId) || 'PROJECT';
    const normalizedName = normalizeActionIdPart(name) || Date.now().toString().slice(-6);
    return `ACT-${normalizedProjectId}-${type}-${normalizedName}`;
  };

  const updateActionForm = (patch) => {
    setActionForm((prev) => {
      const next = { ...prev, ...patch };
      if (!prev.action_id || prev.action_id === generateActionId(prev.action_type, prev.action_name)) {
        next.action_id = generateActionId(next.action_type, next.action_name);
      }
      return next;
    });
  };

  const openActionDrawer = (preset = {}) => {
    const next = {
      ...emptyActionForm,
      ...preset,
    };
    next.action_id = generateActionId(next.action_type, next.action_name);
    setActionForm(next);
    setActionDrawerOpen(true);
  };

  const closeActionDrawer = () => {
    setActionDrawerOpen(false);
    setActionForm(emptyActionForm);
  };

  const parseRoles = (value) => value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const handleActionSave = async (event) => {
    event.preventDefault();
    if (!actionForm.action_name.trim()) {
      setMessage('Action 이름을 입력해 주세요.');
      return;
    }

    const payload = {
      action_id: actionForm.action_id || generateActionId(actionForm.action_type, actionForm.action_name),
      action_name: actionForm.action_name.trim(),
      action_type: actionForm.action_type,
      description: actionForm.description.trim() || null,
      execution_mode: actionForm.execution_mode,
      route_value: actionForm.route_value.trim() || null,
      menu_name: actionForm.menu_name.trim() || null,
      api_method: actionForm.api_method || null,
      api_endpoint: actionForm.api_endpoint.trim() || null,
      sql_template: actionForm.sql_template.trim() || null,
      allowed_roles: parseRoles(actionForm.allowed_roles_text),
      status: 'active',
    };

    setSavingAction(true);
    setMessage('');
    try {
      await createAction(projectId, payload);
      setMessage('Action이 등록되었습니다. Intent 상세에서 해당 Action을 연결할 수 있습니다.');
      closeActionDrawer();
      await loadConnections();
      setActiveView('actions');
    } catch (err) {
      console.error(err);
      setMessage(`Action 등록에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const openActionTest = () => {
    setSelectedTestActionId(activeActions[0]?.action_id || '');
    setTestResult(null);
    setTestDrawerOpen(true);
  };

  const runActionTest = (event) => {
    event.preventDefault();
    const action = activeActions.find((item) => item.action_id === selectedTestActionId);
    if (!action) {
      setTestResult({ status: 'fail', title: 'Action을 선택해 주세요.', details: [] });
      return;
    }

    const details = [
      { label: 'Action ID', value: action.action_id },
      { label: 'Action 유형', value: action.action_type },
      { label: '실행 방식', value: action.execution_mode || '-' },
      { label: '연결 Intent', value: `${action.linked_intent_count || 0}건` },
    ];

    if (action.action_type === 'NAVIGATE') {
      details.push({ label: '이동 URL', value: action.route_value || '미지정' });
    }
    if (['API', 'QUERY'].includes(action.action_type)) {
      details.push({ label: 'API Endpoint', value: action.api_endpoint || '미지정' });
    }
    if (action.action_type === 'SEARCH_DOC') {
      details.push({ label: '검색 정책', value: 'FAQ/Source Scope 기준' });
    }

    const hasRequiredTarget = action.action_type === 'NAVIGATE'
      ? Boolean(action.route_value)
      : action.action_type === 'SEARCH_DOC'
        ? true
        : Boolean(action.api_endpoint || action.sql_template);

    setTestResult({
      status: hasRequiredTarget ? 'pass' : 'warn',
      title: hasRequiredTarget ? 'Action 실행 정의가 준비되었습니다.' : 'Action 실행 대상 정보 보강이 필요합니다.',
      details,
    });
  };

  const workCards = [
    {
      icon: Link2,
      title: 'Intent-Action 연결',
      description: 'Intent 상세에서 실행할 Action ID를 지정해 Runtime 카드가 반환되도록 연결합니다.',
      action: 'Intent 관리',
      path: `/admin/intent-factory/intents?project=${encodeURIComponent(projectId)}`,
      primary: true,
    },
    {
      icon: MousePointerClick,
      title: '화면 이동 Action',
      description: '운영 현황, 문서 목록, 로그 조회처럼 관리자 화면으로 이동하는 Action을 관리합니다.',
      action: '빠른 등록',
      onClick: () => openActionDrawer({
        action_name: '화면 이동 Action',
        action_type: 'NAVIGATE',
        execution_mode: 'screen',
      }),
    },
    {
      icon: Search,
      title: '문서 검색 Action',
      description: 'SEARCH_DOC Action이 FAQ/Source 근거를 찾도록 Source Scope와 답변 정책을 확인합니다.',
      action: '검색 테스트',
      path: '/admin/knowledge/search-test',
    },
    {
      icon: PlayCircle,
      title: 'Action 실행 테스트',
      description: 'Intent 매칭 후 Action Router가 반환하는 실행 카드와 라우팅 결과를 확인합니다.',
      action: '현재 화면에서 테스트',
      onClick: openActionTest,
    },
  ];

  const readiness = [
    { label: 'Action 등록', done: activeActions.length > 0, meta: `${activeActions.length || summary.metrics.action_count || 0}건` },
    { label: 'Intent 연결', done: linkedIntents.length > 0, meta: `${linkedIntents.length || summary.metrics.action_link_count || 0}건` },
    { label: '미연결 Intent 없음', done: unlinkedIntents.length === 0 && activeIntents.length > 0, meta: unlinkedIntents.length === 0 ? '충족' : `${unlinkedIntents.length}건` },
    { label: '검색 Action 준비', done: searchActions.length > 0, meta: `${searchActions.length}건` },
  ];

  return (
    <section className="workflow-action-stage">
      <div className="workflow-action-hero panel">
        <div>
          <span className="workflow-pill blue">4단계 실행 연결</span>
          <h3>Intent-Action 실행 연결</h3>
          <p>
            Intent가 화면 이동, 문서 검색, API/SQL 실행 Action과 올바르게 연결되는지 확인합니다.
            폐쇄망 Runtime에서는 허용된 Action만 실행되므로 연결 상태와 테스트 동선이 중요합니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => openActionDrawer()}>
          <Link2 size={16} /> Action 빠른 등록
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>Action</span><strong>{activeActions.length || summary.metrics.action_count || 0}건</strong><small>등록 실행 정의</small></div>
        <div className="panel workflow-status-card"><span>연결률</span><strong>{linkRate}%</strong><small>Intent 기준</small></div>
        <div className="panel workflow-status-card"><span>미연결 Intent</span><strong>{unlinkedIntents.length}건</strong><small>Action 보강 대상</small></div>
        <div className="panel workflow-status-card"><span>미사용 Action</span><strong>{orphanActions.length}건</strong><small>연결 검토 대상</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>실행 연결 작업</h3>
              <p>Intent 매칭 이후 실제 화면 이동/검색/조회가 실행되도록 연결합니다.</p>
            </div>
            <span className="workflow-pill amber">Whitelist Action</span>
          </div>
          <div className="workflow-work-card-grid">
            {workCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  className={`workflow-work-card ${card.primary ? 'primary' : ''}`}
                  key={card.title}
                  type="button"
                  onClick={() => card.onClick ? card.onClick() : navigate(card.path)}
                >
                  <span className="workflow-work-icon"><Icon size={18} /></span>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <small>{card.action} <ArrowRight size={13} /></small>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel workflow-status-card">
          <div className="workflow-section-title"><span>완료 조건 요약</span></div>
          <div className="workflow-foundation-checks">
            {readiness.map((item) => (
              <div className="workflow-foundation-check" key={item.label}>
                <span className={`workflow-dot ${item.done ? 'done' : 'todo'}`}>{item.done ? '✓' : '!'}</span>
                <div><strong>{item.label}</strong><small>{item.meta}</small></div>
              </div>
            ))}
          </div>
          <div className="workflow-inline-note">
            {stage?.locked_reason || '실행 연결이 준비되면 5단계 Pack 검증/빌드에서 질문별 기대 Intent/Action을 검증합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-intent-board">
          <div className="workflow-board-head">
            <div>
              <h3>실행 연결 보드</h3>
              <p>미연결 Intent와 미사용 Action을 우선 확인합니다.</p>
            </div>
            <PlayCircle size={20} />
          </div>
          <div className="workflow-tabbar">
            <button type="button" className={activeView === 'unlinked' ? 'active' : ''} onClick={() => setActiveView('unlinked')}>미연결 Intent<span>{unlinkedIntents.length}</span></button>
            <button type="button" className={activeView === 'orphan' ? 'active' : ''} onClick={() => setActiveView('orphan')}>미사용 Action<span>{orphanActions.length}</span></button>
            <button type="button" className={activeView === 'actions' ? 'active' : ''} onClick={() => setActiveView('actions')}>전체 Action<span>{activeActions.length}</span></button>
          </div>
          <div className="workflow-table-card">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>이름</th><th>유형/Category</th><th>연결</th><th>상태</th><th>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">실행 연결 정보를 불러오는 중입니다.</td></tr>
                ) : currentRows.length === 0 ? (
                  <tr><td colSpan="6">표시할 항목이 없습니다.</td></tr>
                ) : currentRows.map((item) => {
                  const isAction = Boolean(item.action_type);
                  const meta = isAction ? actionTypeMeta[item.action_type] : null;
                  const Icon = meta?.icon || Link2;
                  return (
                    <tr key={`${activeView}-${item.action_id || item.intent_id}`}>
                      <td><div className="name mono">{item.action_id || item.intent_id}</div></td>
                      <td><div className="name">{item.action_name || item.intent_name}</div><div className="meta">{isAction ? item.description || '-' : item.action_id || 'Action 미지정'}</div></td>
                      <td>{isAction ? <span className="badge active"><Icon size={12} /> {meta?.label || item.action_type}</span> : item.category || '-'}</td>
                      <td>{isAction ? `${item.linked_intent_count || 0}건` : item.action_id || '-'}</td>
                      <td>{item.status || '-'}</td>
                      <td>
                        <button
                          className="btn-table"
                          type="button"
                          onClick={() => navigate(isAction ? '/admin/intent-factory/actions' : `/admin/intent-factory/intents/${encodeURIComponent(item.intent_id)}?project=${encodeURIComponent(projectId)}`)}
                        >
                          열기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {actionDrawerOpen && (
        <div className="workflow-drawer-overlay" role="presentation" onClick={closeActionDrawer}>
          <aside className="workflow-drawer workflow-side-drawer" role="dialog" aria-modal="true" aria-label="Action 빠른 등록" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-drawer-head">
              <div>
                <span>실행 연결</span>
                <h3>Action 빠른 등록</h3>
              </div>
              <button type="button" className="icon-btn" onClick={closeActionDrawer} aria-label="닫기"><X size={18} /></button>
            </div>
            <form className="workflow-drawer-body" onSubmit={handleActionSave}>
              <div className="workflow-panel-form">
                <label>
                  <span>Action ID</span>
                  <input value={actionForm.action_id} disabled />
                </label>
                <label>
                  <span>Action 이름</span>
                  <input
                    value={actionForm.action_name}
                    onChange={(event) => updateActionForm({ action_name: event.target.value })}
                    placeholder="예: 운영 현황 화면 이동"
                  />
                </label>
                <div className="workflow-form-split">
                  <label>
                    <span>Action 유형</span>
                    <select value={actionForm.action_type} onChange={(event) => updateActionForm({ action_type: event.target.value })}>
                      <option value="NAVIGATE">NAVIGATE</option>
                      <option value="SEARCH_DOC">SEARCH_DOC</option>
                      <option value="QUERY">QUERY</option>
                      <option value="GUIDE">GUIDE</option>
                      <option value="API">API</option>
                    </select>
                  </label>
                  <label>
                    <span>실행 방식</span>
                    <select value={actionForm.execution_mode} onChange={(event) => updateActionForm({ execution_mode: event.target.value })}>
                      <option value="local">local</option>
                      <option value="screen">screen</option>
                      <option value="api">api</option>
                      <option value="sql_template">sql_template</option>
                    </select>
                  </label>
                </div>
                {actionForm.action_type === 'NAVIGATE' && (
                  <div className="workflow-form-split">
                    <label>
                      <span>메뉴명</span>
                      <input value={actionForm.menu_name} onChange={(event) => updateActionForm({ menu_name: event.target.value })} placeholder="예: 운영 현황" />
                    </label>
                    <label>
                      <span>화면 URL</span>
                      <input value={actionForm.route_value} onChange={(event) => updateActionForm({ route_value: event.target.value })} placeholder="예: /admin/dashboard" />
                    </label>
                  </div>
                )}
                {['API', 'QUERY'].includes(actionForm.action_type) && (
                  <div className="workflow-form-split">
                    <label>
                      <span>Method</span>
                      <select value={actionForm.api_method} onChange={(event) => updateActionForm({ api_method: event.target.value })}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </label>
                    <label>
                      <span>API Endpoint</span>
                      <input value={actionForm.api_endpoint} onChange={(event) => updateActionForm({ api_endpoint: event.target.value })} placeholder="예: /api/v1/projects/{project_id}/stats" />
                    </label>
                  </div>
                )}
                {actionForm.action_type === 'QUERY' && (
                  <label>
                    <span>SQL Template</span>
                    <textarea value={actionForm.sql_template} onChange={(event) => updateActionForm({ sql_template: event.target.value })} placeholder="SELECT ... WHERE project_id = :project_id" />
                  </label>
                )}
                <label>
                  <span>설명</span>
                  <textarea
                    value={actionForm.description}
                    onChange={(event) => updateActionForm({ description: event.target.value })}
                    placeholder="운영자가 Action 목적을 이해할 수 있는 설명을 입력합니다."
                  />
                </label>
                <label>
                  <span>허용 Role</span>
                  <input value={actionForm.allowed_roles_text} onChange={(event) => updateActionForm({ allowed_roles_text: event.target.value })} placeholder="예: ROLE_ADMIN, ROLE_OPERATOR" />
                </label>
                <div className="workflow-inline-note">
                  빠른 등록 후 Intent 상세에서 이 Action을 연결하면 Runtime에서 실행 카드로 반환됩니다.
                </div>
              </div>
              <div className="workflow-drawer-actions">
                <button className="btn-secondary" type="button" onClick={() => navigate('/admin/intent-factory/actions')}>전체 Action 관리</button>
                <button className="btn-primary" type="submit" disabled={savingAction}>{savingAction ? '저장 중...' : 'Action 저장'}</button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {testDrawerOpen && (
        <div className="workflow-overlay" role="presentation" onClick={() => setTestDrawerOpen(false)}>
          <section className="workflow-modal workflow-modal-wide" role="dialog" aria-modal="true" aria-label="Action 실행 테스트" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-drawer-head">
              <div>
                <span>실행 연결</span>
                <h3>Action 실행 테스트</h3>
              </div>
              <button type="button" className="workflow-icon-button" onClick={() => setTestDrawerOpen(false)} aria-label="닫기"><X size={18} /></button>
            </div>
            <form className="workflow-panel-form" onSubmit={runActionTest}>
              <label>
                <span>테스트 Action</span>
                <select value={selectedTestActionId} onChange={(event) => setSelectedTestActionId(event.target.value)}>
                  <option value="">Action을 선택해 주세요</option>
                  {activeActions.map((action) => (
                    <option key={action.action_id} value={action.action_id}>
                      {action.action_name} ({action.action_id})
                    </option>
                  ))}
                </select>
              </label>
              <div className="workflow-inline-note">
                현재 단계에서는 Action 정의가 Runtime 실행 가능한 형태인지 우선 진단합니다. 실제 사용자 질문 기반 실행은 Runtime 시뮬레이션 단계에서 확인합니다.
              </div>
              <div className="workflow-drawer-actions">
                <button className="btn-secondary" type="button" onClick={() => navigate('/admin/runtime?tab=action-route')}>상세 실행 테스트</button>
                <button className="btn-primary" type="submit">테스트 실행</button>
              </div>
            </form>
            {testResult && (
              <div className={`workflow-test-result ${testResult.status}`}>
                <strong>{testResult.title}</strong>
                <div className="workflow-job-list">
                  {testResult.details.map((item) => (
                    <div className="workflow-job-row" key={item.label}>
                      <div><strong>{item.label}</strong></div>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

export default ActionConnectionStage;
