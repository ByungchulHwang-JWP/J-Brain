import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowRight, Boxes, CheckCircle2, Download, FileJson2, PackageCheck, ShieldCheck, Workflow } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { getPackDraft, listPackExports } from '../../../api/intentFactory';

const requiredFiles = [
  { key: 'manifest', label: 'Pack Manifest', file: 'manifest.json' },
  { key: 'profile', label: 'Profile', file: 'profile/profile.json' },
  { key: 'nlu', label: 'NLU', file: 'nlu/intent_examples.json' },
  { key: 'actions', label: 'Action', file: 'actions/action_registry.json' },
  { key: 'knowledge', label: 'Knowledge', file: 'knowledge/faqs.json' },
  { key: 'validation', label: 'Validation', file: 'validation/validation_questions.json' },
];

const PackBuildStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [exports, setExports] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [draftData, exportData] = await Promise.all([
          getPackDraft(projectId),
          listPackExports(projectId),
        ]);
        setDraft(draftData);
        setExports(exportData.items || []);
      } catch (err) {
        console.error(err);
        setDraft(null);
        setExports([]);
        setMessage('Pack Build 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const counts = draft?.counts || {};
  const latestExport = exports[0] || null;
  const exportCount = exports.length || Number(summary.metrics.export_count || 0);
  const contentReadyCount = [
    Number(counts.intents || summary.metrics.intent_count || 0) > 0,
    Number(counts.intent_examples || summary.metrics.intent_example_count || 0) > 0,
    Number(counts.entities || summary.metrics.entity_count || 0) > 0,
    Number(counts.faqs || summary.metrics.faq_count || 0) > 0,
  ].filter(Boolean).length;
  const buildReadyRate = Math.round((contentReadyCount / 4) * 100);

  const fileChecks = requiredFiles.map((item) => ({
    ...item,
    ready: Boolean(draft) || exportCount > 0,
  }));

  const workCards = [
    {
      icon: Workflow,
      title: 'DB Draft 생성',
      description: 'Intent, Example, Entity, FAQ, Action 정보를 Pack Draft로 묶습니다.',
      action: 'Pack Builder',
      panel: 'draft',
      primary: true,
    },
    {
      icon: Archive,
      title: 'Export / ZIP 생성',
      description: '표준 Intent Pack 디렉터리 구조와 Service-Pack ZIP을 생성합니다.',
      action: 'Export 생성',
      panel: 'export',
    },
    {
      icon: ShieldCheck,
      title: 'Export 검증',
      description: 'Export 전후 Loader/Manifest/필수 파일 검증 결과를 확인합니다.',
      action: 'Pack 검증',
      panel: 'validation',
    },
    {
      icon: PackageCheck,
      title: 'Repository 등록',
      description: '생성된 Export ZIP 이력과 Runtime Import 후보를 확인합니다.',
      action: 'Repository',
      panel: 'repository',
    },
  ];

  const quickPanels = {
    draft: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: 'DB Draft 생성',
      description: '현재 DB에 저장된 Intent, Example, Entity, FAQ, Action, Source Scope를 Pack 초안으로 묶습니다.',
      items: [
        { title: '구성 데이터 집계', description: 'Intent와 연결된 Action, FAQ, Source Scope가 누락되지 않았는지 확인합니다.' },
        { title: 'Draft 구조 확인', description: 'Runtime이 읽을 표준 Pack 구조로 변환 가능한지 점검합니다.' },
        { title: 'Export 전 검증', description: '필수 파일을 만들 수 있는 최소 조건을 확인합니다.' },
      ],
      secondaryAction: { label: 'Pack Builder 열기', onClick: () => navigate('/admin/packs/builder') },
    },
    export: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: 'Export / ZIP 생성',
      description: 'Draft를 표준 Intent Pack 디렉터리 구조로 변환하고 고객 내부망 반입용 ZIP으로 생성합니다.',
      items: [
        { title: '표준 파일 생성', description: 'manifest, nlu, actions, knowledge, validation 파일을 생성합니다.' },
        { title: 'ZIP 패키징', description: 'Runtime Pack Store에 반입할 수 있는 Service-Pack ZIP을 만듭니다.' },
        { title: 'Export 이력 저장', description: '생성 시점, 버전, 포함 건수, 검증 상태를 Repository에 남깁니다.' },
      ],
      secondaryAction: { label: 'Export 생성 화면 열기', onClick: () => navigate('/admin/packs/builder') },
    },
    validation: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: 'Export 검증',
      description: '생성된 Pack이 Loader로 읽히는지, 필수 파일과 Manifest가 유효한지 확인합니다.',
      items: [
        { title: 'Loader 검증', description: 'Runtime에서 읽을 수 있는 Pack 구조인지 확인합니다.' },
        { title: '질문 검증 연계', description: 'Validation Question 결과와 함께 승인 가능성을 판단합니다.' },
        { title: '오류 보완', description: '필수 파일 누락이나 스키마 오류가 있으면 Draft 단계로 되돌립니다.' },
      ],
      secondaryAction: { label: 'Pack 검증 열기', onClick: () => navigate('/admin/packs/validation') },
    },
    repository: {
      eyebrow: '5단계 Pack 검증/빌드',
      title: 'Repository 등록',
      description: 'Export ZIP 이력을 확인하고 다음 단계의 Runtime Pack Store Import 대상으로 준비합니다.',
      items: [
        { title: 'Export 이력 확인', description: '버전, 상태, 포함된 Intent/Entity/FAQ 수를 확인합니다.' },
        { title: '반입 대상 결정', description: '검증된 Export만 Runtime Pack Store로 Import합니다.' },
        { title: '배포 추적', description: 'Import, 승인, 활성화, Rollback까지 같은 Repository에서 추적합니다.' },
      ],
      secondaryAction: { label: 'Pack Repository 열기', onClick: () => navigate('/admin/packs/repository') },
    },
  };

  const readiness = [
    { label: 'Pack Draft', done: Boolean(draft), meta: draft ? '생성 가능' : '조회 필요' },
    { label: '콘텐츠 구성', done: buildReadyRate >= 75, meta: `${buildReadyRate}%` },
    { label: 'Export ZIP', done: exportCount > 0, meta: `${exportCount}건` },
    { label: '최근 Export', done: Boolean(latestExport), meta: latestExport ? `${latestExport.pack_id} v${latestExport.pack_version}` : '없음' },
  ];

  const exportRows = useMemo(() => exports.slice(0, 6), [exports]);

  return (
    <section className="workflow-build-stage">
      <div className="workflow-build-hero panel">
        <div>
          <span className="workflow-pill blue">5단계 Pack 검증/빌드</span>
          <h3>DB Draft 기반 Service-Pack ZIP 생성</h3>
          <p>
            DB에 저장된 Intent, Entity, FAQ, Action, Source Scope 정보를 표준 Intent Pack 구조로 Export합니다.
            생성된 ZIP은 고객 내부망 Runtime Pack Store로 Import되는 배포 단위입니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setActivePanel('draft')}>
          <Boxes size={16} /> Pack Builder 열기
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>Intent</span><strong>{counts.intents ?? summary.metrics.intent_count ?? 0}건</strong><small>Pack NLU 구성</small></div>
        <div className="panel workflow-status-card"><span>Example</span><strong>{counts.intent_examples ?? summary.metrics.intent_example_count ?? 0}건</strong><small>질문 샘플</small></div>
        <div className="panel workflow-status-card"><span>FAQ</span><strong>{counts.faqs ?? summary.metrics.faq_count ?? 0}건</strong><small>Knowledge 구성</small></div>
        <div className="panel workflow-status-card"><span>Export ZIP</span><strong>{exportCount}건</strong><small>생성 이력</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>Pack Build 작업</h3>
              <p>DB Draft 생성부터 ZIP Export, Repository 등록까지 이어지는 작업입니다.</p>
            </div>
            <span className="workflow-pill amber">Service-Pack</span>
          </div>
          <div className="workflow-work-card-grid">
            {workCards.map((card) => {
              const Icon = card.icon;
              return (
                <button className={`workflow-work-card ${card.primary ? 'primary' : ''}`} key={card.title} type="button" onClick={() => setActivePanel(card.panel)}>
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
            {stage?.locked_reason || 'Pack Build가 완료되면 6단계 배포 및 운영 개선에서 고객 내부망 Runtime Pack Store로 Import합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>표준 Pack 파일 구성</h3>
              <p>Export ZIP에 포함되어야 하는 핵심 파일 구조입니다.</p>
            </div>
            <FileJson2 size={20} />
          </div>
          <table>
            <thead><tr><th>구성 요소</th><th>파일</th><th>상태</th></tr></thead>
            <tbody>
              {fileChecks.map((item) => (
                <tr key={item.key}>
                  <td><div className="name">{item.label}</div></td>
                  <td><div className="name mono">{item.file}</div></td>
                  <td><span className={`badge ${item.ready ? 'active' : 'warning'}`}>{item.ready ? '준비' : '대기'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel workflow-stage-guide">
          <div className="workflow-board-head">
            <div>
              <h3>Build 흐름</h3>
              <p>운영자가 Pack을 생성할 때 따라야 하는 표준 절차입니다.</p>
            </div>
            <CheckCircle2 size={18} />
          </div>
          <div className="workflow-guide-steps">
            <div><strong>1</strong><span>DB Draft 생성</span></div>
            <div><strong>2</strong><span>필수 파일 검증</span></div>
            <div><strong>3</strong><span>ZIP Export 생성</span></div>
            <div><strong>4</strong><span>Repository 이력 확인</span></div>
          </div>
          <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/6?tab=11`)}>
            6단계 배포/활성화 탭으로 이동 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="panel workflow-table-card">
        <div className="workflow-board-head">
          <div>
            <h3>최근 Export ZIP 이력</h3>
            <p>Pack Builder에서 생성된 최신 Export 이력입니다.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={() => navigate('/admin/packs/repository')}>Repository 열기</button>
        </div>
        <table>
          <thead><tr><th>Export ID</th><th>Pack</th><th>Status</th><th>Counts</th><th>Created</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Pack Export 정보를 불러오는 중입니다.</td></tr>
            ) : exportRows.length === 0 ? (
              <tr><td colSpan="5">생성된 Export ZIP이 없습니다.</td></tr>
            ) : exportRows.map((item) => (
              <tr key={item.export_id}>
                <td><div className="name mono">{item.export_id}</div></td>
                <td>{item.pack_id} v{item.pack_version}</td>
                <td><span className={`badge ${item.status === 'validated' ? 'active' : 'warning'}`}>{item.status}</span></td>
                <td>Intent {item.counts?.intents ?? 0}, Entity {item.counts?.entities ?? 0}, FAQ {item.counts?.faqs ?? 0}</td>
                <td>{item.created_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WorkflowQuickPanel
        open={Boolean(activePanel)}
        {...(quickPanels[activePanel] || {})}
        primaryAction={{ label: '현재 단계에서 계속하기', onClick: () => setActivePanel(null) }}
        onClose={() => setActivePanel(null)}
      />
    </section>
  );
};

export default PackBuildStage;
