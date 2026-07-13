import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BookOpenCheck, CheckCircle2, FileSearch, MessageSquareText, PlusCircle, SearchCheck } from 'lucide-react';
import WorkflowQuickPanel from '../../../components/workflow/WorkflowQuickPanel';
import { listFaqCandidates, listFaqs } from '../../../api/intentFactory';

const sourceDone = (status) => ['completed', 'success', 'SUCCESS', 'active', '인덱싱 완료'].includes(status);

const AnswerEvidenceStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [sources, setSources] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const token = localStorage.getItem('ai_access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [faqData, candidateData, sourceRes] = await Promise.all([
          listFaqs(projectId),
          listFaqCandidates(projectId),
          axios.get(`/api/v1/projects/${encodeURIComponent(projectId)}/sources`, { headers }),
        ]);
        setFaqs(faqData.items || []);
        setCandidates(candidateData.items || []);
        setSources(sourceRes.data || []);
      } catch (err) {
        console.error(err);
        setFaqs([]);
        setCandidates([]);
        setSources([]);
        setMessage('답변 근거 정보를 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const metrics = summary.metrics || {};
  const activeFaqs = faqs.filter((faq) => faq.status !== 'archived');
  const approvedFaqs = activeFaqs.filter((faq) => faq.approved_for_pack);
  const linkedFaqs = activeFaqs.filter((faq) => faq.source_id);
  const completedSources = sources.filter((source) => sourceDone(source.status));
  const activeCandidates = candidates.filter((candidate) => candidate.status !== 'archived');

  const evidenceReady = activeFaqs.length > 0 || completedSources.length > 0;
  const sourceCoverageRate = sources.length > 0 ? Math.round((completedSources.length / sources.length) * 100) : 0;

  const evidenceGuides = [
    {
      icon: MessageSquareText,
      title: 'FAQ 직접 근거',
      description: '자주 묻는 질문은 승인된 답변과 함께 Pack의 knowledge/faqs.json에 포함됩니다.',
      action: 'FAQ 관리',
      panel: 'faq',
    },
    {
      icon: FileSearch,
      title: 'Source 문서 근거',
      description: '문서 기반 답변은 벡터화 완료 Source와 Chunk 검색 결과를 근거로 표시합니다.',
      action: 'Source 관리',
      panel: 'source',
    },
    {
      icon: SearchCheck,
      title: '검색 근거 검증',
      description: 'SEARCH_DOC Action이 FAQ와 Source를 함께 검색하는지 테스트합니다.',
      action: '검색 테스트',
      panel: 'search',
    },
  ];

  const quickPanels = {
    faq: {
      eyebrow: '2단계 답변 근거',
      title: 'FAQ 직접 근거 관리',
      description: '자주 묻는 질문은 운영자가 검토한 질문/답변 세트로 관리하고, 승인된 항목만 Pack Export에 포함합니다.',
      items: [
        { title: '질문과 답변 등록', description: '운영자가 그대로 제공해도 되는 답변만 작성합니다.' },
        { title: 'Pack 반영 승인', description: '승인된 FAQ만 Runtime 검색 대상에 포함합니다.' },
        { title: 'Source 연결', description: '가능하면 원문 Source ID를 연결해 답변 근거를 추적합니다.' },
      ],
      secondaryAction: { label: 'FAQ 관리 열기', onClick: () => navigate('/admin/intent-factory/faqs') },
    },
    source: {
      eyebrow: '2단계 답변 근거',
      title: 'Source 문서 근거 관리',
      description: '문서 근거는 벡터화가 완료된 Source를 기준으로 Runtime 검색 결과에 표시됩니다.',
      items: [
        { title: 'Source 등록', description: '고객 문서, 매뉴얼, FAQ 원천을 프로젝트에 등록합니다.' },
        { title: '벡터화 완료 확인', description: '검색 가능한 상태가 된 문서만 답변 근거로 사용합니다.' },
        { title: '검색 테스트', description: '질문을 입력해 실제 검색 근거가 나오는지 확인합니다.' },
      ],
      secondaryAction: { label: 'Source 관리 열기', onClick: () => navigate('/admin/knowledge/sources') },
    },
    search: {
      eyebrow: '2단계 답변 근거',
      title: '검색 근거 검증',
      description: 'SEARCH_DOC Action이 FAQ와 Source 문서를 함께 검색하는지 확인합니다.',
      items: [
        { title: 'FAQ 우선 매칭', description: '정형 FAQ가 있으면 직접 답변 근거로 표시합니다.' },
        { title: 'Source 보조 검색', description: 'FAQ가 부족하면 벡터화 문서 검색 결과를 함께 제공합니다.' },
        { title: '근거 노출 확인', description: 'Runtime 답변에 FAQ ID, Source ID, Score가 표시되는지 점검합니다.' },
      ],
      secondaryAction: { label: '검색 테스트 열기', onClick: () => navigate('/admin/knowledge/search-test') },
    },
  };

  const readiness = [
    { label: 'FAQ 등록', done: activeFaqs.length > 0, meta: `${activeFaqs.length || metrics.faq_count || 0}건` },
    { label: 'Pack 반영 승인', done: approvedFaqs.length > 0, meta: `${approvedFaqs.length}건` },
    { label: 'Source 근거 준비', done: completedSources.length > 0, meta: `${completedSources.length || metrics.completed_source_count || 0}건` },
    { label: 'FAQ 후보 처리', done: activeCandidates.length === 0, meta: activeCandidates.length === 0 ? '대기 없음' : `${activeCandidates.length}건` },
  ];

  const evidenceRows = useMemo(() => {
    const faqRows = activeFaqs.slice(0, 5).map((faq) => ({
      id: faq.faq_id,
      title: faq.question,
      type: 'FAQ',
      status: faq.approved_for_pack ? 'Pack 반영' : '검토',
      meta: faq.category || faq.action_id || 'SEARCH_DOC',
      path: '/admin/intent-factory/faqs',
    }));
    const sourceRows = completedSources.slice(0, Math.max(0, 5 - faqRows.length)).map((source) => ({
      id: source.id,
      title: source.filename || source.name || source.file_name || source.id,
      type: 'Source',
      status: '검색 가능',
      meta: source.source_type || source.type || projectId,
      path: '/admin/knowledge/sources',
    }));
    return [...faqRows, ...sourceRows];
  }, [activeFaqs, completedSources, projectId]);

  return (
    <section className="workflow-evidence-stage">
      <div className="workflow-evidence-hero panel">
        <div>
          <span className="workflow-pill blue">2단계 지식 준비</span>
          <h3>FAQ/Source 답변 근거 정리</h3>
          <p>
            SEARCH_DOC Action이 사용할 FAQ와 Source 근거를 정리합니다.
            답변은 임의 생성보다 검증된 FAQ, 벡터화 문서, 출처 정보 기반으로 제공되어야 합니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => navigate('/admin/intent-factory/faqs')}>
          <PlusCircle size={16} /> FAQ 등록
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>FAQ</span><strong>{activeFaqs.length || metrics.faq_count || 0}건</strong><small>답변 직접 근거</small></div>
        <div className="panel workflow-status-card"><span>Pack 승인 FAQ</span><strong>{approvedFaqs.length}건</strong><small>Export 반영 대상</small></div>
        <div className="panel workflow-status-card"><span>Source 준비율</span><strong>{sourceCoverageRate}%</strong><small>벡터화 완료 기준</small></div>
        <div className="panel workflow-status-card"><span>FAQ 후보</span><strong>{activeCandidates.length || metrics.faq_candidate_count || 0}건</strong><small>미응답 전환 대상</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>근거 정리 작업</h3>
              <p>FAQ와 Source가 Runtime 답변 근거로 사용될 수 있도록 준비합니다.</p>
            </div>
            <span className="workflow-pill amber">SEARCH_DOC</span>
          </div>
          <div className="workflow-work-card-grid three">
            {evidenceGuides.map((card) => {
              const Icon = card.icon;
              return (
                <button className="workflow-work-card" key={card.title} type="button" onClick={() => setActivePanel(card.panel)}>
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
            {stage?.locked_reason || '답변 근거가 준비되면 3단계 의도 설계와 4단계 실행 연결에서 안정적으로 활용합니다.'}
          </div>
        </aside>
      </div>

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>답변 근거 보드</h3>
              <p>Runtime 검색 결과에 노출될 수 있는 FAQ와 Source 근거입니다.</p>
            </div>
            <BookOpenCheck size={20} />
          </div>
          <table>
            <thead><tr><th>근거 ID</th><th>제목/질문</th><th>유형</th><th>상태</th><th>분류</th><th>관리</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">답변 근거를 불러오는 중입니다.</td></tr>
              ) : evidenceRows.length === 0 ? (
                <tr><td colSpan="6">준비된 답변 근거가 없습니다. FAQ 등록 또는 Source 벡터화를 먼저 진행해 주세요.</td></tr>
              ) : evidenceRows.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td><div className="name mono">{item.id}</div></td>
                  <td><div className="name">{item.title}</div></td>
                  <td>{item.type}</td>
                  <td><span className={`badge ${item.status === '검토' ? 'warning' : 'active'}`}>{item.status}</span></td>
                  <td>{item.meta}</td>
                  <td><button className="btn-table" type="button" onClick={() => navigate(item.path)}>열기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {!evidenceReady && (
        <div className="workflow-message">FAQ 또는 벡터화 완료 Source가 최소 1건 이상 준비되어야 답변 근거 단계가 안정적으로 완료됩니다.</div>
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

export default AnswerEvidenceStage;
