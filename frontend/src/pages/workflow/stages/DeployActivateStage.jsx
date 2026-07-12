import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileArchive, History, PackageOpen, RotateCcw, ShieldCheck, UploadCloud } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { getActivePack, listPackAuditLogs, listPackExports, listRuntimePacks } from '../../../api/intentFactory';

const DeployActivateStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [exports, setExports] = useState([]);
  const [runtimePacks, setRuntimePacks] = useState([]);
  const [activePack, setActivePack] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
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
        setActivePack(activeData?.pack_id ? activeData : null);
        setAuditLogs(logsData.items || []);
      } catch (err) {
        console.error(err);
        setExports([]);
        setRuntimePacks([]);
        setActivePack(null);
        setAuditLogs([]);
        setMessage('배포/활성화 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const validatedExports = exports.filter((item) => ['validated', 'exported'].includes(String(item.status || '').toLowerCase()));
  const approvedPacks = runtimePacks.filter((pack) => ['approved', 'active'].includes(String(pack.status || '').toLowerCase()));
  const rejectedPacks = runtimePacks.filter((pack) => String(pack.status || '').toLowerCase() === 'rejected');
  const rollbackReady = Boolean(activePack?.previous_pack_id);

  const workCards = [
    {
      icon: UploadCloud,
      title: 'Runtime Store 반입',
      description: '생성된 Service-Pack ZIP을 Runtime Pack Store에 반입합니다. 아직 챗봇에는 적용되지 않습니다.',
      action: '반입 관리',
      panel: 'import',
      primary: true,
    },
    {
      icon: ShieldCheck,
      title: '운영 승인/반려',
      description: '반입된 Runtime Pack을 운영자가 승인하거나 반려합니다.',
      action: '운영 승인',
      panel: 'approval',
    },
    {
      icon: PackageOpen,
      title: '챗봇 적용',
      description: '승인된 Pack을 현재 적용 Pack으로 전환해 챗봇 위젯과 Runtime Simulation에 적용합니다.',
      action: '챗봇 적용',
      panel: 'active',
    },
    {
      icon: RotateCcw,
      title: 'Rollback 준비',
      description: '직전 정상 Pack으로 되돌릴 수 있도록 이전 적용 Pack 이력을 유지합니다.',
      action: 'Rollback',
      panel: 'rollback',
    },
  ];

  const quickPanels = {
    import: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: 'Runtime Store 반입',
      description: 'Export된 Service-Pack ZIP을 Runtime Pack Store에 반입하는 단계입니다. 이 단계만으로는 챗봇 적용 Pack이 바뀌지 않습니다.',
      items: [
        { title: '압축 해제 및 필수 파일 검증', description: 'manifest, nlu, actions, knowledge 파일이 정상인지 확인합니다.' },
        { title: 'Loader 검증', description: 'Runtime이 해당 Pack을 실제로 읽을 수 있는지 검증합니다.' },
        { title: 'Import 이력 저장', description: '반입 결과와 오류 메시지를 감사 로그에 남깁니다.' },
      ],
      secondaryAction: { label: 'Release & Deploy 열기', onClick: () => navigate('/admin/packs?tab=repository') },
    },
    approval: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: '운영 승인/반려 처리',
      description: '검증된 Pack이라도 운영자가 승인해야 챗봇 적용 대상이 됩니다.',
      items: [
        { title: '운영 승인', description: '검증 결과와 구성 내용을 확인한 Pack을 챗봇 적용 후보로 승인합니다.' },
        { title: '반려', description: '오류나 보완 필요가 있는 Pack은 반려하고 다음 Draft 보강으로 돌립니다.' },
        { title: '승인 이력', description: '승인자, 시각, 상태 변경 이력을 감사 로그로 남깁니다.' },
      ],
      secondaryAction: { label: '승인 관리 열기', onClick: () => navigate('/admin/packs?tab=repository') },
    },
    active: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: '챗봇 적용',
      description: '승인된 Pack을 현재 프로젝트의 실제 Runtime 응답 기준 Pack으로 지정합니다.',
      items: [
        { title: '운영 승인 상태 확인', description: '승인되지 않은 Pack은 챗봇에 적용할 수 없습니다.' },
        { title: '직전 Pack 보관', description: '기존 적용 Pack은 Rollback 후보로 보관합니다.' },
        { title: 'Runtime Resolver 적용', description: '오른쪽 하단 챗봇 위젯과 Runtime 시뮬레이션이 현재 적용 Pack 기준으로 동작합니다.' },
      ],
      secondaryAction: { label: '챗봇 적용 관리 열기', onClick: () => navigate('/admin/packs?tab=repository') },
    },
    rollback: {
      eyebrow: '6단계 배포 및 운영 개선',
      title: 'Rollback 준비',
      description: '신규 적용 Pack에 문제가 생겼을 때 직전 정상 Pack으로 되돌릴 수 있어야 합니다.',
      items: [
        { title: '이전 Pack 후보 확인', description: '직전 적용 Pack 정보가 보관되어 있는지 확인합니다.' },
        { title: 'Rollback 실행', description: '필요 시 이전 Pack을 다시 Active 상태로 전환합니다.' },
        { title: '운영 이력 추적', description: 'Rollback 사유와 결과를 감사 로그에 남깁니다.' },
      ],
      secondaryAction: { label: 'Rollback 관리 열기', onClick: () => navigate('/admin/packs?tab=repository') },
    },
  };

  const readiness = [
    { label: 'Export ZIP', done: exports.length > 0, meta: `${exports.length || summary.metrics.export_count || 0}건` },
    { label: 'Runtime Store 반입', done: runtimePacks.length > 0, meta: `${runtimePacks.length || summary.metrics.runtime_pack_count || 0}건` },
    { label: '운영 승인 Pack', done: approvedPacks.length > 0, meta: `${approvedPacks.length}건` },
    { label: '챗봇 적용 Pack', done: Boolean(activePack), meta: activePack ? `${activePack.pack_id} v${activePack.pack_version}` : '없음' },
  ];

  const runtimeRows = useMemo(() => runtimePacks.slice(0, 6), [runtimePacks]);
  const auditRows = useMemo(() => auditLogs.slice(0, 5), [auditLogs]);

  return (
    <section className="workflow-deploy-stage">
      <div className="workflow-deploy-hero panel">
        <div>
          <span className="workflow-pill blue">6단계 배포 및 운영 개선</span>
          <h3>Runtime Store 반입 및 챗봇 적용</h3>
          <p>
            Pack은 Runtime Store 반입, 운영 승인, 챗봇 적용 순서로 운영됩니다.
            챗봇 적용을 실행해야 오른쪽 하단 챗봇 위젯과 Runtime 시뮬레이션의 기준 Pack이 바뀝니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => navigate('/admin/packs?tab=repository')}>
          <PackageOpen size={16} /> Release & Deploy 열기
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>Export ZIP</span><strong>{exports.length || summary.metrics.export_count || 0}건</strong><small>반입 가능 패키지</small></div>
        <div className="panel workflow-status-card"><span>Runtime Store</span><strong>{runtimePacks.length || summary.metrics.runtime_pack_count || 0}건</strong><small>반입된 Pack</small></div>
        <div className="panel workflow-status-card"><span>챗봇 적용 Pack</span><strong>{activePack ? '있음' : '없음'}</strong><small>{activePack ? `${activePack.pack_id} v${activePack.pack_version}` : '적용 대기'}</small></div>
        <div className="panel workflow-status-card"><span>Rollback</span><strong>{rollbackReady ? '가능' : '대기'}</strong><small>{rollbackReady ? `${activePack.previous_pack_id} v${activePack.previous_pack_version}` : '이전 Pack 없음'}</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>배포 게이트 작업</h3>
              <p>Runtime Store 반입부터 운영 승인, 챗봇 적용까지 운영자가 처리해야 하는 작업입니다.</p>
            </div>
            <span className="workflow-pill amber">Activation Gate</span>
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
            {stage?.locked_reason || '챗봇 적용 Pack이 준비되면 같은 6단계 안에서 실사용 로그와 미응답 개선 흐름을 관리합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>Runtime Pack Store</h3>
              <p>반입된 Pack의 운영 승인과 챗봇 적용 상태입니다.</p>
            </div>
            <FileArchive size={20} />
          </div>
          <table>
            <thead><tr><th>Pack</th><th>배포 상태</th><th>챗봇 적용</th><th>승인자</th><th>Source Export</th><th>Imported</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Runtime Pack 정보를 불러오는 중입니다.</td></tr>
              ) : runtimeRows.length === 0 ? (
                <tr><td colSpan="6">반입된 Runtime Pack이 없습니다.</td></tr>
              ) : runtimeRows.map((pack) => {
                const isActive = activePack?.pack_id === pack.pack_id && activePack?.pack_version === pack.pack_version;
                return (
                  <tr key={pack.import_id || `${pack.pack_id}-${pack.pack_version}`}>
                    <td><div className="name">{pack.pack_id} v{pack.pack_version} {isActive && <span className="badge active">챗봇 적용 중</span>}</div><div className="meta">{pack.import_id || '-'}</div></td>
                    <td><span className={`badge ${['validated', 'approved', 'active'].includes(pack.status) ? 'active' : 'warning'}`}>{pack.status}</span></td>
                    <td><span className={`badge ${isActive ? 'active' : 'warning'}`}>{isActive ? '적용 중' : '미적용'}</span></td>
                    <td>{pack.approved_by || pack.approval_status || '-'}</td>
                    <td>{pack.source_export_id || '-'}</td>
                    <td>{pack.imported_at || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel workflow-stage-guide">
          <div className="workflow-board-head">
            <div>
              <h3>배포 정책</h3>
              <p>폐쇄망 Runtime 운영을 위한 기본 통제 원칙입니다.</p>
            </div>
            <CheckCircle2 size={18} />
          </div>
          <div className="workflow-guide-steps">
            <div><strong>{validatedExports.length}</strong><span>반입 가능 Export ZIP</span></div>
            <div><strong>{approvedPacks.length}</strong><span>운영 승인 Pack</span></div>
            <div><strong>{rejectedPacks.length}</strong><span>반려 Pack</span></div>
            <div><strong>{rollbackReady ? 1 : 0}</strong><span>Rollback 후보</span></div>
          </div>
          <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/6?tab=12`)}>
            운영 분석/개선 탭으로 이동 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="panel workflow-table-card">
        <div className="workflow-board-head">
          <div>
            <h3>최근 배포 감사 로그</h3>
            <p>반입, 검증, 운영 승인, 챗봇 적용, Rollback 작업 이력입니다.</p>
          </div>
          <History size={20} />
        </div>
        <table>
          <thead><tr><th>Operation</th><th>Pack</th><th>Status</th><th>Message</th><th>Created</th></tr></thead>
          <tbody>
            {auditRows.length === 0 ? (
              <tr><td colSpan="5">감사 로그가 없습니다.</td></tr>
            ) : auditRows.map((log, index) => (
              <tr key={`${log.operation}-${log.created_at}-${index}`}>
                <td>{log.operation}</td>
                <td>{log.pack_id ? `${log.pack_id} v${log.pack_version}` : '-'}</td>
                <td><span className="badge active">{log.status}</span></td>
                <td>{log.message || '-'}</td>
                <td>{log.created_at || '-'}</td>
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

export default DeployActivateStage;
