import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRight, FileQuestion, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { convertUnansweredToFaqCandidate, listUnansweredLogs } from '../../api/intentFactory';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const typeLabel = {
  INTENT_OR_EXAMPLE: 'Intent/예문 보강',
  ACTION_LINK: 'Action 연결',
  EXAMPLE_COVERAGE: '예문/용어 보강',
  FAQ_CANDIDATE: 'FAQ 후보',
};

const severityLabel = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const UnansweredAnalysis = () => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, converted: 0 });
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    axios.get('/api/v1/projects', {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then((res) => {
      setProjects(res.data || []);
      setProjectId((prev) => prev || res.data?.[0]?.id || 'J-Brain');
    }).catch(() => {
      setProjects([]);
      setProjectId('J-Brain');
    });
  }, []);

  const loadLogs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await listUnansweredLogs(projectId);
      setItems(data.items || []);
      setCounts(data.counts || { total: 0, open: 0, converted: 0 });
      setSelectedLogId((prev) => prev || data.items?.[0]?.log_id || null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setCounts({ total: 0, open: 0, converted: 0 });
      setMessage('미응답 로그를 불러오지 못했습니다. Runtime QA에서 fallback 질문을 먼저 실행해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projectId]);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const selectedItem = useMemo(
    () => items.find((item) => item.log_id === selectedLogId) || items[0],
    [items, selectedLogId],
  );

  const groupedCounts = useMemo(() => (
    items.reduce((acc, item) => {
      const key = item.improvement_type || 'FAQ_CANDIDATE';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ), [items]);

  const handleConvert = async () => {
    if (!selectedItem || converting) return;
    setConverting(true);
    setMessage('');
    try {
      const tags = [
        selectedItem.improvement_type,
        selectedItem.severity,
      ].filter(Boolean);
      await convertUnansweredToFaqCandidate(projectId, selectedItem.log_id, {
        suggested_answer: suggestedAnswer || null,
        tags,
      });
      setSuggestedAnswer('');
      const successMsg = 'FAQ 후보로 전환했습니다. 개선 요청 관리 화면에서 후속 보완을 진행할 수 있습니다.';
      setMessage(successMsg);
      alert(successMsg);
      await loadLogs();
    } catch (err) {
      console.error(err);
      const errorMsg = 'FAQ 후보 전환에 실패했습니다. 이미 전환되었거나 서버 상태를 확인해 주세요.';
      setMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="inner operations-page">
      <div className="operations-header">
        <div>
          <div className="operations-eyebrow">운영 및 개선</div>
          <h2>미응답 분석</h2>
          <p>Runtime에서 fallback 또는 낮은 신뢰도로 기록된 질문을 분석하고 개선 후보로 전환합니다.</p>
        </div>
        <div className="operations-controls">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.length === 0 ? <option value="J-Brain">J-Brain</option> : projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name} ({project.id})</option>
            ))}
          </select>
          <button className="btn-secondary" type="button" onClick={loadLogs}>
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="operations-kpi-grid">
        <div className="panel operations-kpi"><span>전체 미응답</span><strong>{counts.total}</strong><small>로그 기준</small></div>
        <div className="panel operations-kpi"><span>처리 대기</span><strong>{counts.open}</strong><small>개선 필요</small></div>
        <div className="panel operations-kpi"><span>전환 완료</span><strong>{counts.converted}</strong><small>FAQ 후보 연결</small></div>
        <div className="panel operations-kpi"><span>고위험</span><strong>{items.filter((item) => item.severity === 'high').length}</strong><small>Intent 보강 우선</small></div>
      </div>

      <div className="operations-grid">
        <section className="panel operations-list">
          <div className="operations-panel-head">
            <div>
              <h3>미응답 질문 목록</h3>
              <p>질문을 선택하면 원인과 개선 전환 작업을 확인할 수 있습니다.</p>
            </div>
            <FileQuestion size={20} />
          </div>

          {loading ? (
            <div className="operations-empty">미응답 로그를 불러오는 중입니다.</div>
          ) : paginatedItems.length === 0 ? (
            <div className="operations-empty">미응답 로그가 없습니다. Runtime QA에서 낮은 신뢰도 질문을 실행하면 이곳에 표시됩니다.</div>
          ) : (
            <>
              <div className="operations-log-list">
                {paginatedItems.map((item) => (
                  <button
                    className={`operations-log-row ${selectedItem?.log_id === item.log_id ? 'active' : ''}`}
                    key={item.log_id}
                    type="button"
                    onClick={() => setSelectedLogId(item.log_id)}
                  >
                    <span className={`severity ${item.severity}`}>{severityLabel[item.severity] || item.severity}</span>
                    <div>
                      <strong>{item.question}</strong>
                      <small>{item.log_id} · {typeLabel[item.improvement_type] || item.improvement_type} · {item.confidence_label}</small>
                    </div>
                    <span className={`status ${item.status === 'open' ? 'open' : 'done'}`}>{item.status}</span>
                  </button>
                ))}
              </div>
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
            </>
          )}
        </section>

        <aside className="panel operations-detail">
          <div className="operations-panel-head">
            <div>
              <h3>개선 판단</h3>
              <p>선택한 질문을 어떤 개선 작업으로 넘길지 확인합니다.</p>
            </div>
            <ShieldAlert size={20} />
          </div>

          {selectedItem ? (
            <>
              <div className="operations-question-card">
                <span>{selectedItem.log_id}</span>
                <strong>{selectedItem.question}</strong>
                <p>{selectedItem.reason}</p>
              </div>
              <div className="operations-meta-grid">
                <div><span>개선 유형</span><strong>{typeLabel[selectedItem.improvement_type] || selectedItem.improvement_type}</strong></div>
                <div><span>신뢰도</span><strong>{selectedItem.confidence_label}</strong></div>
                <div><span>Intent</span><strong>{selectedItem.intent_id || '-'}</strong></div>
                <div><span>Action</span><strong>{selectedItem.action_id || '-'}</strong></div>
              </div>
              <label className="operations-field">
                <span>FAQ 후보 답변 초안</span>
                <textarea
                  rows={5}
                  value={suggestedAnswer}
                  onChange={(e) => setSuggestedAnswer(e.target.value)}
                  placeholder="운영자가 확인한 답변 초안을 입력합니다. 비워두면 질문만 FAQ 후보로 등록됩니다."
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleConvert}
                  disabled={converting || selectedItem.status !== 'open'}
                >
                  <Send size={15} /> FAQ 후보로 전환
                </button>
                {selectedItem.intent_id && (
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const url = `/admin/intent-factory/intents/${encodeURIComponent(selectedItem.intent_id)}?project=${encodeURIComponent(projectId)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Intent 수정 화면으로 이동
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="operations-empty">선택된 미응답 질문이 없습니다.</div>
          )}
        </aside>
      </div>

      <div className="panel operations-type-summary">
        <h3>개선 유형별 분포</h3>
        <div>
          {Object.entries(typeLabel).map(([key, label]) => (
            <span key={key}>{label} <strong>{groupedCounts[key] || 0}</strong></span>
          ))}
        </div>
        <button className="btn-secondary" type="button" onClick={() => window.location.assign('/admin/operations/improvement-requests')}>
          개선 요청 관리로 이동 <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default UnansweredAnalysis;
