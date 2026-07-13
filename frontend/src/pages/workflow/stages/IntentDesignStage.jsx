import { Skeleton } from '../../../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BrainCircuit, GitMerge, Lightbulb, MessageSquarePlus, PauseCircle, PlusCircle, X } from 'lucide-react';
import IntentForm from '../../../components/intent-factory/IntentForm';
import Pagination from '../../../components/common/Pagination';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { createIntent, listActions, listIntents } from '../../../api/intentFactory';

const tabs = [
  { key: 'registered', label: '등록 Intent' },
  { key: 'merge', label: '병합 후보' },
  { key: 'hold', label: '보류' },
];

const categoryLabel = (category) => category || '미분류';

const emptyIntentForm = {
  intent_id: '',
  intent_name: '',
  description: '',
  category: 'SEARCH_DOC',
  action_id: '',
  status: 'draft',
  priority: 100,
  examples: [],
  source_scope: {
    source_category: '',
    source_status: 'completed',
    document_types: [],
    tags: [],
    top_k: 5,
    score_threshold: 0.65,
  },
};

const generateIntentId = (projectId) => {
  const normalizedProjectId = String(projectId || 'PROJECT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PROJECT';
  return `INT-${normalizedProjectId}-${Date.now().toString().slice(-6)}`;
};

const IntentDesignStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('registered');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [intentForm, setIntentForm] = useState(() => ({ ...emptyIntentForm, intent_id: generateIntentId(projectId) }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadIntents = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await listIntents(projectId);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('Intent 목록을 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntents();
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('ai_access_token');
    setIntentForm({ ...emptyIntentForm, intent_id: generateIntentId(projectId) });
    Promise.allSettled([
      listActions(projectId),
      axios.get(`/api/v1/projects/${encodeURIComponent(projectId)}/sources`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    ]).then(([actionResult, sourceResult]) => {
      setActionOptions(actionResult.status === 'fulfilled' ? actionResult.value.items || [] : []);
      setSourceOptions(sourceResult.status === 'fulfilled' ? sourceResult.value.data || [] : []);
    });
  }, [projectId]);

  const openIntentDrawer = () => {
    setIntentForm({ ...emptyIntentForm, intent_id: generateIntentId(projectId) });
    setDrawerOpen(true);
  };

  const closeIntentDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const handleIntentSubmit = async (event) => {
    event.preventDefault();
    if (!intentForm.intent_name?.trim()) {
      setMessage('Intent 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await createIntent(projectId, {
        ...intentForm,
        description: intentForm.description?.trim() || null,
        action_id: intentForm.action_id?.trim() || null,
        source_scope: intentForm.source_scope || null,
      });
      setDrawerOpen(false);
      setMessage('Intent가 등록되었습니다. 현재 단계에서 목록을 갱신했습니다.');
      await loadIntents();
    } catch (err) {
      console.error(err);
      setMessage(`Intent 등록에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const metrics = summary.metrics || {};
  const activeItems = items.filter((item) => item.status !== 'archived');
  const actionLinked = activeItems.filter((item) => item.action_id).length;
  const exampleReady = activeItems.filter((item) => Number(item.example_count || 0) >= 3).length;
  const searchDocCount = activeItems.filter((item) => String(item.category || '').toUpperCase() === 'SEARCH_DOC').length;

  const mergeCandidates = useMemo(() => {
    const byCategory = activeItems.reduce((acc, item) => {
      const key = `${item.category || 'NONE'}::${item.action_id || 'NONE'}`;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    return Object.values(byCategory).filter((group) => group.length > 1).flat();
  }, [activeItems]);

  const holdCandidates = useMemo(() => (
    activeItems.filter((item) => !item.action_id || Number(item.example_count || 0) === 0 || item.status !== 'active')
  ), [activeItems]);

  const currentItems = activeTab === 'registered'
    ? activeItems
    : activeTab === 'merge'
      ? mergeCandidates
      : holdCandidates;

  const sortedItems = useMemo(() => {
    return [...currentItems].sort((a, b) => b.intent_id.localeCompare(a.intent_id));
  }, [currentItems]);
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const workCards = [
    {
      icon: PlusCircle,
      title: 'Intent 등록',
      description: '업무 질문 의도를 Intent 단위로 정의하고 대표 질문을 함께 입력합니다.',
      button: '신규 Intent',
      action: openIntentDrawer,
      primary: true,
    },
    {
      icon: MessageSquarePlus,
      title: '예상 질문 보강',
      description: 'Intent별 다양한 표현을 추가해 자연어 매칭 커버리지를 높입니다.',
      button: 'Intent 관리',
      action: () => setActivePanel('examples'),
    },
    {
      icon: GitMerge,
      title: '병합 후보 검토',
      description: 'Category와 Action이 유사한 Intent를 병합하거나 역할을 분리합니다.',
      button: '후보 확인',
      action: () => setActiveTab('merge'),
    },
    {
      icon: Lightbulb,
      title: 'LLM 지원 도구',
      description: '외부망에서 Intent 초안을 만들고 내부망 Pack에는 검증된 결과만 반영합니다.',
      button: '지원 도구',
      action: () => setActivePanel('assist'),
    },
  ];

  const quickPanels = {
    examples: {
      eyebrow: '3단계 의도 설계',
      title: '예상 질문 보강',
      description: 'Intent별 대표 질문만으로는 실제 사용자 표현을 충분히 커버하기 어렵습니다. 이 패널에서 보강 기준을 확인한 뒤 필요한 경우 전체 Intent 관리 화면으로 이동합니다.',
      items: [
        { title: 'Intent별 최소 3개 이상', description: '동일한 의미를 다른 말투와 문장 길이로 추가합니다.' },
        { title: '오타와 줄임말 포함', description: '띄어쓰기 누락, 한글/영문 혼용, 약어를 함께 관리합니다.' },
        { title: '검증 질문 후보 표시', description: '대표성이 높은 질문은 8단계 Pack 품질검증 질문으로 전환합니다.' },
      ],
      secondaryAction: {
        label: '전체 Intent 관리',
        onClick: () => navigate(`/admin/intent-factory/intents?project=${encodeURIComponent(projectId)}`),
      },
    },
    assist: {
      eyebrow: '3단계 의도 설계',
      title: 'LLM 지원 도구 활용',
      description: '외부망에서 Source를 분석해 Intent 초안을 만들 수 있지만, 내부망 Runtime에는 검증된 Pack 결과만 반영해야 합니다.',
      items: [
        { title: '초안 생성', description: '문서 목차와 FAQ를 기준으로 후보 Intent와 예시 질문을 생성합니다.' },
        { title: '운영자 검토', description: '자동 생성된 후보는 승인/제외 상태를 거쳐 다음 단계에 반영합니다.' },
        { title: 'Pack 반영', description: '승인된 항목만 Pack Build 대상이 되도록 관리합니다.' },
      ],
      secondaryAction: {
        label: '지원 도구 열기',
        onClick: () => navigate('/admin/intent-factory/llm-assist'),
      },
    },
  };

  const readiness = [
    { label: '등록 Intent', done: activeItems.length > 0, meta: `${activeItems.length || metrics.intent_count || 0}건` },
    { label: 'Action 후보 연결', done: actionLinked > 0, meta: `${actionLinked}건` },
    { label: '예상 질문 3개 이상', done: exampleReady > 0, meta: `${exampleReady}건` },
    { label: '문서 검색 Intent', done: searchDocCount > 0, meta: `${searchDocCount}건` },
  ];

  return (
    <section className="workflow-intent-stage">
      <div className="workflow-intent-hero panel">
        <div>
          <span className="workflow-pill blue">3단계 의도 설계</span>
          <h3>Intent 구조 설계</h3>
          <p>
            지식 준비 단계에서 수집한 Source와 FAQ를 기준으로 사용자의 질문 의도를 정의합니다.
            등록 Intent, 병합 후보, 보류 항목을 분리해서 Pack 품질검증 전에 의도 체계를 정리합니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={openIntentDrawer}>
          <PlusCircle size={16} /> Intent 등록
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>등록 Intent</span><strong>{activeItems.length || metrics.intent_count || 0}건</strong><small>보관 제외 기준</small></div>
        <div className="panel workflow-status-card"><span>Action 연결</span><strong>{actionLinked}건</strong><small>실행 연결 후보</small></div>
        <div className="panel workflow-status-card"><span>병합 후보</span><strong>{mergeCandidates.length}건</strong><small>중복 가능성 검토</small></div>
        <div className="panel workflow-status-card"><span>보류 후보</span><strong>{holdCandidates.length}건</strong><small>입력 보강 필요</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>주요 작업</h3>
              <p>Intent를 등록하고, 질문 표현과 Action 후보를 정리합니다.</p>
            </div>
            <span className="workflow-pill amber">설계 단계</span>
          </div>
          <div className="workflow-work-card-grid">
            {workCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  className={`workflow-work-card ${card.primary ? 'primary' : ''}`}
                  onClick={card.action}
                >
                  <span className="workflow-work-icon"><Icon size={18} /></span>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <small>{card.button} <ArrowRight size={13} /></small>
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
            {stage?.locked_reason || 'Intent가 준비되면 같은 3단계 안에서 질문 커버리지 탭의 예상 질문을 본격적으로 보강합니다.'}
          </div>
        </aside>
      </div>

      <div className="panel workflow-intent-board">
        <div className="workflow-board-head">
          <div>
            <h3>Intent 설계 보드</h3>
            <p>운영자가 현재 설계 상태를 빠르게 구분해 검토할 수 있도록 탭으로 분리했습니다.</p>
          </div>
          <BrainCircuit size={20} />
        </div>

        <div className="workflow-tabbar">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
              <span>{tab.key === 'registered' ? activeItems.length : tab.key === 'merge' ? mergeCandidates.length : holdCandidates.length}</span>
            </button>
          ))}
        </div>

        <div className="workflow-table-card">
          <table>
            <thead><tr><th>Intent ID</th><th>Intent 이름</th><th>Category</th><th>Action</th><th>예상 질문</th><th>상태</th><th>관리</th></tr></thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (<tr key={idx}><td><Skeleton width="100px" /></td><td><Skeleton width="150px" /></td><td><Skeleton width="80px" /></td><td><Skeleton width="100px" /></td><td><Skeleton width="40px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="80px" /></td></tr>))
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="7">{activeTab === 'registered' ? '등록된 Intent가 없습니다.' : '검토 대상이 없습니다.'}</td></tr>
              ) : paginatedItems.map((item) => (
                <tr key={`${activeTab}-${item.intent_id}`}>
                  <td><div className="name mono">{item.intent_id}</div></td>
                  <td><div className="name">{item.intent_name}</div></td>
                  <td><span className="badge active">{categoryLabel(item.category)}</span></td>
                  <td>{item.action_id || '-'}</td>
                  <td>{item.example_count || 0}건</td>
                  <td>{item.status || '-'}</td>
                  <td>
                    <button className="btn-table" type="button" onClick={() => navigate(`/admin/intent-factory/intents/${encodeURIComponent(item.intent_id)}?project=${encodeURIComponent(projectId)}`)}>
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>


      {drawerOpen && (
        <div className="workflow-drawer-overlay" role="presentation" onClick={closeIntentDrawer}>
          <aside className="workflow-drawer workflow-side-drawer" role="dialog" aria-modal="true" aria-label="Intent 등록" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-drawer-head">
              <div>
                <span>3단계 의도 설계</span>
                <h3>Intent 등록</h3>
              </div>
              <button type="button" className="icon-btn" onClick={closeIntentDrawer} aria-label="닫기">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleIntentSubmit} className="workflow-drawer-body">
              <IntentForm
                form={intentForm}
                setForm={setIntentForm}
                mode="new"
                actionOptions={actionOptions}
                sourceOptions={sourceOptions}
              />
              <div className="workflow-drawer-actions">
                <button className="btn-secondary" type="button" onClick={closeIntentDrawer} disabled={saving}>취소</button>
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? '저장 중...' : 'Intent 저장'}</button>
              </div>
            </form>
          </aside>
        </div>
      )}

      <WorkflowQuickPanel
        open={Boolean(activePanel)}
        {...(quickPanels[activePanel] || {})}
        primaryAction={{ label: '현재 단계에서 계속하기', onClick: () => setActivePanel(null) }}
        onClose={() => setActivePanel(null)}
      />
    </section>
  );
};

export default IntentDesignStage;
