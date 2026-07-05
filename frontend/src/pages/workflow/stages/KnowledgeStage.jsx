import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  Database,
  FilePlus2,
  FileText,
  MessageSquareText,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { createDiscoveryRun, createFaq, getDiscoverySummary, listFaqs } from '../../../api/intentFactory';

const statusLabel = (status) => {
  if (['completed', 'success', 'SUCCESS', 'active', '인덱싱 완료'].includes(status)) return '완료';
  if (['failed', 'error', '오류'].includes(status)) return '오류';
  if (!status || status === 'pending') return '대기';
  return status;
};

const statusClass = (status) => {
  if (['completed', 'success', 'SUCCESS', 'active', '인덱싱 완료'].includes(status)) return 'active';
  if (['failed', 'error', '오류'].includes(status)) return 'error';
  return 'warning';
};

const emptyFaqForm = {
  faq_id: '',
  question: '',
  answer: '',
  category: '',
  tags_text: '',
};

const KnowledgeStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceUploading, setSourceUploading] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqForm, setFaqForm] = useState(emptyFaqForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [discoverySummary, setDiscoverySummary] = useState(null);
  const [discoveryRunning, setDiscoveryRunning] = useState(false);

  const loadSources = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('ai_access_token');
      const res = await axios.get(`/api/v1/projects/${encodeURIComponent(projectId)}/sources`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSources(res.data || []);
    } catch (err) {
      console.error(err);
      setSources([]);
      setMessage('Source 목록을 불러오지 못했습니다. 등록 현황은 워크플로우 집계 기준으로 표시합니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadFaqs = async () => {
    try {
      const data = await listFaqs(projectId);
      setFaqs(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error(err);
      setFaqs([]);
    }
  };

  const loadDiscoverySummary = async () => {
    try {
      const data = await getDiscoverySummary(projectId);
      setDiscoverySummary(data.summary || {});
    } catch (err) {
      console.error(err);
      setDiscoverySummary(null);
    }
  };

  useEffect(() => {
    loadSources();
    loadFaqs();
    loadDiscoverySummary();
  }, [projectId]);

  const metrics = summary.metrics || {};
  const latestDiscoveryRun = discoverySummary?.latest_run || null;
  const latestDiscoverySourceNames = latestDiscoveryRun?.source_names || [];
  const sourceCount = Number(metrics.source_count || sources.length || 0);
  const completedSourceCount = Number(metrics.completed_source_count || 0);
  const faqCount = Number(metrics.faq_count || faqs.length || 0);
  const completionRate = sourceCount > 0 ? Math.round((completedSourceCount / sourceCount) * 100) : 0;
  const recentSources = sources.slice(0, 6);

  const readiness = useMemo(() => [
    { label: 'Source 등록', done: sourceCount > 0, meta: `${sourceCount}건` },
    { label: '벡터화 완료', done: completedSourceCount > 0, meta: `${completedSourceCount}건` },
    { label: 'FAQ 원천 준비', done: faqCount > 0, meta: `${faqCount}건` },
    { label: '검색 테스트 준비', done: sourceCount > 0 || faqCount > 0, meta: sourceCount > 0 || faqCount > 0 ? '가능' : '대기' },
  ], [completedSourceCount, faqCount, sourceCount]);

  const generateFaqId = () => {
    const normalizedProjectId = projectId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PROJECT';
    return `FAQ-${normalizedProjectId}-${Date.now().toString().slice(-6)}`;
  };

  const openFaqModal = () => {
    setFaqForm({ ...emptyFaqForm, faq_id: generateFaqId() });
    setFaqModalOpen(true);
  };

  const workCards = [
    {
      icon: FilePlus2,
      title: '문서 업로드',
      description: '고객에게 받은 매뉴얼, 정책서, 운영 문서를 프로젝트 Source로 등록합니다.',
      button: '현재 화면에서 업로드',
      action: () => setActiveDrawer('source'),
      primary: true,
    },
    {
      icon: MessageSquareText,
      title: 'FAQ 원천 등록',
      description: '자주 묻는 질문과 표준 답변을 Pack에 포함될 FAQ 지식으로 정리합니다.',
      button: 'FAQ 등록 팝업 열기',
      action: openFaqModal,
    },
    {
      icon: Database,
      title: '벡터화 작업 확인',
      description: '등록 문서의 인덱싱/벡터화 상태를 확인하고 실패 항목을 재처리합니다.',
      button: '상태 패널 열기',
      action: () => setActiveDrawer('jobs'),
    },
    {
      icon: Search,
      title: '검색 테스트',
      description: 'Source와 FAQ가 Runtime 검색 근거로 잘 잡히는지 검색 품질을 확인합니다.',
      button: '간이 테스트 열기',
      action: () => setSearchOpen((value) => !value),
    },
    {
      icon: Sparkles,
      title: '신규 자료 분석',
      description: '새로 추가된 Source를 기준으로 Intent, Entity, FAQ, Action 후보를 규칙 기반으로 생성합니다.',
      button: '신규 후보 생성',
      action: () => handleDiscoveryRun('new'),
    },
  ];

  const updateFaqForm = (patch) => setFaqForm((prev) => ({ ...prev, ...patch }));

  const parseTags = (text) => text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const closeOverlays = () => {
    setActiveDrawer(null);
    setFaqModalOpen(false);
  };

  const handleSourceUpload = async (event) => {
    event.preventDefault();
    if (!sourceFile) {
      setMessage('업로드할 파일을 선택해 주세요.');
      return;
    }

    setSourceUploading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('ai_access_token');
      const formData = new FormData();
      formData.append('file', sourceFile);
      await axios.post(`/api/v1/projects/${encodeURIComponent(projectId)}/sources`, formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });
      setSourceFile(null);
      setMessage('Source가 등록되었습니다. 백그라운드에서 벡터화 작업이 시작됩니다.');
      await loadSources();
      setActiveDrawer('jobs');
    } catch (err) {
      console.error(err);
      setMessage(`Source 등록에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSourceUploading(false);
    }
  };

  const handleFaqSave = async (event) => {
    event.preventDefault();
    const payload = {
      faq_id: (faqForm.faq_id || generateFaqId()).trim(),
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      category: faqForm.category.trim() || null,
      tags: parseTags(faqForm.tags_text),
      source_id: null,
      action_id: 'SEARCH_DOC',
      approved_for_pack: true,
      status: 'active',
    };

    if (!payload.question || !payload.answer) {
      setMessage('FAQ 질문과 답변을 입력해 주세요.');
      return;
    }

    setFaqSaving(true);
    try {
      await createFaq(projectId, payload);
      setFaqForm(emptyFaqForm);
      setFaqModalOpen(false);
      setMessage('FAQ 원천이 등록되었습니다. Pack Build 시 knowledge/faqs.json에 포함됩니다.');
      await loadFaqs();
    } catch (err) {
      console.error(err);
      setMessage(`FAQ 등록에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setFaqSaving(false);
    }
  };

  const handleDiscoveryRun = async (scope = 'all') => {
    setDiscoveryRunning(true);
    setMessage('');
    try {
      const result = await createDiscoveryRun(projectId, scope);
      setDiscoverySummary(result.summary || {});
      const analyzedSources = result.summary?.latest_run?.source_names || [];
      const sourceText = analyzedSources.length > 0 ? ` 분석 대상 Source: ${analyzedSources.join(', ')}` : '';
      setMessage(
        scope === 'new'
          ? `신규 자료 분석이 완료되었습니다.${sourceText} 새 Source 기준 후보가 기존 검토 후보에 병합되며, 후보 검토 화면에서 승인 또는 제외 처리해 주세요.`
          : `전체 재분석이 완료되었습니다.${sourceText} 기존 검토 후보는 최신 결과로 교체되며, 후보 검토 화면에서 승인 또는 제외 처리해 주세요.`,
      );
    } catch (err) {
      console.error(err);
      setMessage(`자동 후보 생성에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    } finally {
      setDiscoveryRunning(false);
    }
  };

  const runInlineSearch = (event) => {
    event.preventDefault();
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      setSearchResult({ type: 'error', message: '검색할 질문을 입력해 주세요.' });
      return;
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    const faqMatches = faqs
      .map((faq) => {
        const haystack = `${faq.question || ''} ${faq.answer || ''} ${faq.category || ''} ${(faq.tags || []).join(' ')}`.toLowerCase();
        const tokenHitRatio = tokens.length ? tokens.filter((token) => haystack.includes(token)).length / tokens.length : 0;
        const directHit = haystack.includes(normalized) ? 1 : 0;
        return { ...faq, score: Math.min(1, directHit * 0.7 + tokenHitRatio * 0.3) };
      })
      .filter((faq) => faq.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const sourceMatches = sources
      .filter((source) => `${source.filename || ''} ${source.description || ''}`.toLowerCase().includes(normalized))
      .slice(0, 3);

    setSearchResult({
      type: faqMatches.length || sourceMatches.length ? 'success' : 'empty',
      faqMatches,
      sourceMatches,
      message: faqMatches.length || sourceMatches.length
        ? '현재 등록된 FAQ/Source 메타데이터 기준으로 검색 근거 후보를 찾았습니다.'
        : '현재 등록된 FAQ/Source 메타데이터에서는 일치 후보가 없습니다. 전체 검색 테스트에서 벡터 검색 품질을 확인해 주세요.',
    });
  };

  return (
    <section className="workflow-knowledge">
      <div className="workflow-knowledge-hero panel">
        <div>
          <span className="workflow-pill blue">2단계 지식 준비</span>
          <h3>Source 수집 및 벡터화 준비</h3>
          <p>
            고객 문서와 FAQ 원천을 등록하고, 폐쇄망 Runtime에서 사용할 수 있는 검색 지식으로 준비합니다.
            이 단계의 목표는 Intent 설계 전에 답변 근거가 될 자료를 먼저 안정화하는 것입니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setActiveDrawer('source')}>
          <UploadCloud size={16} /> Source 등록 화면 열기
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-inline-note">
        Source 등록, FAQ 원천 등록, 벡터화 확인, 검색 테스트를 현재 워크플로우 화면에서 바로 진행합니다.
        상세 관리가 필요한 경우 각 패널의 전체 관리 화면 이동 버튼을 사용해 주세요.
      </div>

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>등록 Source</span><strong>{sourceCount}건</strong><small>프로젝트 기준 전체 문서</small></div>
        <div className="panel workflow-status-card"><span>벡터화 완료</span><strong>{completedSourceCount}건</strong><small>검색 가능 상태 문서</small></div>
        <div className="panel workflow-status-card"><span>FAQ 원천</span><strong>{faqCount}건</strong><small>Pack 반영 대상 FAQ</small></div>
        <div className="panel workflow-status-card"><span>준비율</span><strong>{completionRate}%</strong><small>Source 대비 완료율</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>주요 작업</h3>
              <p>운영자가 2단계에서 수행해야 하는 작업을 순서대로 배치했습니다.</p>
            </div>
            <span className="workflow-pill amber">현재 단계</span>
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
            {stage?.locked_reason || 'Source와 FAQ가 준비되면 3단계 의도 설계에서 질문 의도와 연결할 수 있습니다.'}
          </div>
        </aside>
      </div>

      <div className="panel workflow-discovery-summary">
        <div className="workflow-board-head">
          <div>
            <h3>자동 생성 후보 Summary</h3>
            <p>승인된 후보만 다음 단계 진행률에 반영됩니다.</p>
          </div>
          <div className="workflow-header-actions">
            <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/discovery/candidates`)}>
              후보 검토
            </button>
            <button className="btn-secondary" type="button" onClick={() => handleDiscoveryRun('new')} disabled={discoveryRunning}>
              {discoveryRunning ? '분석 중...' : '신규 자료 분석'}
            </button>
            <button className="btn-primary" type="button" onClick={() => handleDiscoveryRun('all')} disabled={discoveryRunning}>
              {discoveryRunning ? '생성 중...' : '전체 재분석'}
            </button>
          </div>
        </div>
        <div className="workflow-knowledge-metrics">
          <div className="panel workflow-status-card"><span>전체 후보</span><strong>{discoverySummary?.total || 0}건</strong><small>최근 생성/저장 후보</small></div>
          <div className="panel workflow-status-card"><span>승인</span><strong>{discoverySummary?.approved || 0}건</strong><small>다음 단계 반영 대상</small></div>
          <div className="panel workflow-status-card"><span>검토 대기</span><strong>{discoverySummary?.pending || 0}건</strong><small>승인 또는 제외 필요</small></div>
          <div className="panel workflow-status-card"><span>제외</span><strong>{discoverySummary?.rejected || 0}건</strong><small>진행률 미반영</small></div>
        </div>
        {latestDiscoveryRun && (
          <div className="workflow-inline-note">
            최근 분석 결과: {latestDiscoveryRun.scope === 'new' ? '신규 자료 분석' : '전체 재분석'}
            {' · '}분석 대상 Source {latestDiscoveryRun.source_count || latestDiscoverySourceNames.length || 0}건
            {latestDiscoverySourceNames.length > 0 && ` · ${latestDiscoverySourceNames.join(', ')}`}
          </div>
        )}
      </div>

      {searchOpen && (
        <div className="panel workflow-inline-search">
          <div className="workflow-board-head">
            <div>
              <h3>검색 테스트 실행</h3>
              <p>등록된 FAQ와 Source 메타데이터 기준으로 근거 후보를 빠르게 확인합니다.</p>
            </div>
            <button className="btn-secondary" type="button" onClick={() => navigate('/admin/knowledge/search-test')}>전체 검색 테스트</button>
          </div>
          <form className="workflow-inline-search-form" onSubmit={runInlineSearch}>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="예: J-Brain의 주요 기능은 무엇인가요?"
            />
            <button className="btn-primary" type="submit">테스트 실행</button>
          </form>
          {searchResult && (
            <div className={`workflow-search-result ${searchResult.type}`}>
              <strong>{searchResult.message}</strong>
              {searchResult.faqMatches?.length > 0 && (
                <div className="workflow-search-list">
                  <span>FAQ 후보</span>
                  {searchResult.faqMatches.map((faq) => (
                    <div key={faq.faq_id} className="workflow-search-item">
                      <div><strong>{faq.question}</strong><small>{faq.category || 'SEARCH_DOC'} · score {Math.round(faq.score * 100)}%</small></div>
                      <p>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResult.sourceMatches?.length > 0 && (
                <div className="workflow-search-list">
                  <span>Source 후보</span>
                  {searchResult.sourceMatches.map((source) => (
                    <div key={source.id} className="workflow-search-item">
                      <div><strong>{source.filename}</strong><small>{statusLabel(source.status)} · chunk {source.chunk_count || 0}</small></div>
                      <p>{source.description || '-'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="workflow-knowledge-bottom">
        <div className="panel workflow-table-card">
          <div className="workflow-board-head">
            <div>
              <h3>최근 Source</h3>
              <p>최근 등록된 지식 문서와 벡터화 상태입니다.</p>
            </div>
            <button className="btn-secondary" type="button" onClick={() => navigate('/admin/knowledge/sources')}>
              전체 Source
            </button>
          </div>
          <table>
            <thead><tr><th>문서명</th><th>유형</th><th>상태</th><th>등록일</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4">Source 목록을 불러오는 중입니다.</td></tr>
              ) : recentSources.length === 0 ? (
                <tr><td colSpan="4">등록된 Source가 없습니다. 문서 업로드부터 진행해 주세요.</td></tr>
              ) : recentSources.map((source) => (
                <tr key={source.id}>
                  <td><div className="name">{source.filename || source.name || source.file_name || source.id}</div><div className="meta">{projectId}</div></td>
                  <td>{source.source_type || source.type || '-'}</td>
                  <td><span className={`badge ${statusClass(source.status)}`}>{statusLabel(source.status)}</span></td>
                  <td>{source.created_at || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel workflow-stage-guide">
          <div className="workflow-board-head">
            <div>
              <h3>다음 단계 연결</h3>
              <p>지식 준비가 끝나면 Intent 설계에서 질문 의도를 정의합니다.</p>
            </div>
            <FileText size={18} />
          </div>
          <div className="workflow-guide-steps">
            <div><strong>1</strong><span>문서/FAQ 원천 등록</span></div>
            <div><strong>2</strong><span>벡터화 상태 확인</span></div>
            <div><strong>3</strong><span>검색 테스트 실행</span></div>
            <div><strong>4</strong><span>의도 설계로 이동</span></div>
          </div>
          <button className="btn-primary" type="button" onClick={() => navigate(`/admin/workflow/projects/${encodeURIComponent(projectId)}/stages/3`)}>
            3단계 의도 설계로 이동 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {activeDrawer && (
        <div className="workflow-overlay" onClick={closeOverlays}>
          <section className="workflow-modal workflow-modal-wide" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-drawer-head">
              <div>
                <span>{activeDrawer === 'source' ? 'Source 등록' : '벡터화 작업 확인'}</span>
                <h3>{activeDrawer === 'source' ? '문서 업로드' : '프로젝트 인덱싱 상태'}</h3>
              </div>
              <button type="button" className="workflow-icon-button" onClick={closeOverlays} aria-label="닫기"><X size={18} /></button>
            </div>

            {activeDrawer === 'source' ? (
              <form className="workflow-panel-form" onSubmit={handleSourceUpload}>
                <label>
                  <span>대상 프로젝트</span>
                  <input value={projectId} disabled />
                </label>
                <label>
                  <span>Source 유형</span>
                  <select value="file" disabled>
                    <option>파일 업로드 (PDF, DOCX, TXT, MD)</option>
                  </select>
                </label>
                <label className="workflow-file-box">
                  <UploadCloud size={24} />
                  <strong>{sourceFile ? sourceFile.name : '파일을 선택해 주세요'}</strong>
                  <small>지원 형식: PDF, DOCX, TXT, MD</small>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={(event) => setSourceFile(event.target.files?.[0] || null)}
                  />
                </label>
                <div className="workflow-option-list">
                  <label><input type="checkbox" checked readOnly /> 텍스트 청킹 및 Vector DB 임베딩 생성</label>
                  <label><input type="checkbox" checked readOnly /> Entity/Relation 추출 준비</label>
                  <label><input type="checkbox" checked readOnly /> 검색 테스트 대상으로 포함</label>
                </div>
                <div className="workflow-drawer-actions">
                  <button className="btn-secondary" type="button" onClick={() => navigate('/admin/knowledge/sources')}>전체 Source 관리</button>
                  <button className="btn-primary" type="submit" disabled={sourceUploading}>{sourceUploading ? '업로드 중...' : '업로드 및 벡터화 시작'}</button>
                </div>
              </form>
            ) : (
              <div className="workflow-job-panel">
                <div className="workflow-job-summary">
                  <div><span>등록 Source</span><strong>{sourceCount}건</strong></div>
                  <div><span>벡터화 완료</span><strong>{completedSourceCount}건</strong></div>
                  <div><span>준비율</span><strong>{completionRate}%</strong></div>
                </div>
                <button className="btn-secondary" type="button" onClick={loadSources}>상태 새로고침</button>
                <div className="workflow-job-list">
                  {sources.length === 0 ? (
                    <div className="workflow-empty-box">등록된 Source가 없습니다. 문서 업로드부터 진행해 주세요.</div>
                  ) : sources.map((source) => (
                    <div key={source.id} className="workflow-job-row">
                      <div><strong>{source.filename}</strong><small>chunk {source.chunk_count || 0} · {source.created_at || '-'}</small></div>
                      <span className={`badge ${statusClass(source.status)}`}>{statusLabel(source.status)}</span>
                    </div>
                  ))}
                </div>
                <div className="workflow-drawer-actions">
                  <button className="btn-secondary" type="button" onClick={() => navigate('/admin/knowledge/jobs')}>전체 작업 현황</button>
                  <button className="btn-primary" type="button" onClick={() => setActiveDrawer('source')}>문서 추가 업로드</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {faqModalOpen && (
        <div className="workflow-overlay" onClick={closeOverlays}>
          <div className="workflow-modal" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-drawer-head">
              <div>
                <span>FAQ 원천 등록</span>
                <h3>SEARCH_DOC 답변 근거 추가</h3>
              </div>
              <button type="button" className="workflow-icon-button" onClick={closeOverlays} aria-label="닫기"><X size={18} /></button>
            </div>
            <form className="workflow-panel-form" onSubmit={handleFaqSave}>
              <label>
                <span>FAQ ID</span>
                <input
                  value={faqForm.faq_id}
                  disabled
                  onChange={(event) => updateFaqForm({ faq_id: event.target.value })}
                  placeholder="자동 생성됩니다."
                />
              </label>
              <label>
                <span>질문</span>
                <input
                  value={faqForm.question}
                  onChange={(event) => updateFaqForm({ question: event.target.value })}
                  placeholder="운영자가 답변할 대표 질문"
                />
              </label>
              <label>
                <span>답변</span>
                <textarea
                  rows={5}
                  value={faqForm.answer}
                  onChange={(event) => updateFaqForm({ answer: event.target.value })}
                  placeholder="Runtime에서 그대로 제공할 표준 답변"
                />
              </label>
              <div className="workflow-form-split">
                <label>
                  <span>카테고리</span>
                  <input value={faqForm.category} onChange={(event) => updateFaqForm({ category: event.target.value })} placeholder="예: 기능 설명" />
                </label>
                <label>
                  <span>태그</span>
                  <input value={faqForm.tags_text} onChange={(event) => updateFaqForm({ tags_text: event.target.value })} placeholder="쉼표로 구분" />
                </label>
              </div>
              <div className="workflow-inline-note">등록된 FAQ는 승인 대상 상태로 저장되며 Pack Build/Export 시 FAQ 지식 파일에 포함됩니다.</div>
              <div className="workflow-drawer-actions">
                <button className="btn-secondary" type="button" onClick={() => navigate('/admin/intent-factory/faqs')}>FAQ 전체 관리</button>
                <button className="btn-primary" type="submit" disabled={faqSaving}>{faqSaving ? '저장 중...' : 'FAQ 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default KnowledgeStage;
