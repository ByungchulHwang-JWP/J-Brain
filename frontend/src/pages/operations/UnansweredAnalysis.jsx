import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRight, FileQuestion, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import ImprovementRequestDrawer from '../../components/operations/ImprovementRequestDrawer';
import { useProjectContext } from '../../context/ProjectContext';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const UnansweredAnalysis = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectContext();
  const projectId = selectedProjectId;
  const [items, setItems] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);

  const loadLogs = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      setSelectedLogId(null);
      setLoading(false);
      setMessage('프로젝트를 선택하면 운영 인사이트를 확인할 수 있습니다.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`/api/v1/projects/${projectId}/operations/unanswered`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const data = res.data.unanswered_logs || [];
      setItems(data);
      setSelectedLogId((prev) => prev || data[0]?.id || null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('미응답 로그를 불러오지 못했습니다. 백엔드 연결을 확인해주세요.');
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
    () => items.find((item) => item.id === selectedLogId) || items[0],
    [items, selectedLogId],
  );

  const counts = useMemo(() => {
    return {
      total: items.length,
      intentMissing: items.filter(i => i.suggested_cause === 'Intent 부재').length,
      lowConfidence: items.filter(i => i.suggested_cause === 'Confidence 부족').length,
      actionMissing: items.filter(i => i.suggested_cause === 'Action 미연결').length,
    }
  }, [items]);

  const handleOpenDrawer = () => {
    setDrawerData(selectedItem);
    setDrawerOpen(true);
  };

  const handleSaveImprovement = async (formData) => {
    try {
      await axios.post(`/api/v1/projects/${projectId}/operations/improvement-requests`, {
        ...formData,
        source_type: 'RUNTIME_LOG',
        source_log_id: selectedItem?.id,
        linked_intent_id: selectedItem?.matched_intent_id,
        linked_action_id: selectedItem?.action_id
      }, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      setMessage('개선 요청이 생성되었습니다.');
      setDrawerOpen(false);
      await loadLogs();
    } catch (err) {
      console.error(err);
      setMessage('개선 요청 생성에 실패했습니다.');
    }
  };

  return (
    <div className={embedded ? 'operations-page' : 'inner operations-page'}>
      <div className="operations-header">
        <div>
          <div className="operations-eyebrow">운영 및 개선</div>
          {embedded ? <h3>미응답 분석</h3> : <h2>미응답 분석</h2>}
          <p>Runtime에서 fallback 또는 낮은 신뢰도로 기록된 질문을 분석하고 개선 요청으로 전환합니다.</p>
        </div>
        <div className="operations-controls">
          <select value={projectId || ''} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loadingProjects}>
            {projects.map((project) => (
              <option key={project.id || project.project_id} value={project.id || project.project_id}>
                {project.name || project.project_name || project.id || project.project_id}
              </option>
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
        <div className="panel operations-kpi"><span>Intent 부재</span><strong>{counts.intentMissing}</strong><small>새 Intent/FAQ 필요</small></div>
        <div className="panel operations-kpi"><span>Confidence 부족</span><strong>{counts.lowConfidence}</strong><small>예문 보강 필요</small></div>
        <div className="panel operations-kpi"><span>Action 미연결</span><strong>{counts.actionMissing}</strong><small>Action 매핑 필요</small></div>
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
                    className={`operations-log-row ${selectedItem?.id === item.id ? 'active' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLogId(item.id)}
                  >
                    <span className={`severity medium`}>{item.fallback_yn ? 'Fallback' : '저신뢰'}</span>
                    <div>
                      <strong>{item.question}</strong>
                      <small>{item.suggested_cause} · Confidence: {item.confidence?.toFixed(2) || '-'}</small>
                    </div>
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
                <strong>{selectedItem.question}</strong>
                <p>{selectedItem.suggested_cause}</p>
              </div>
              <div className="operations-meta-grid">
                <div><span>추천 개선방향</span><strong>{selectedItem.suggested_cause}</strong></div>
                <div><span>신뢰도</span><strong>{selectedItem.confidence?.toFixed(2) || '-'}</strong></div>
                <div><span>Intent</span><strong>{selectedItem.matched_intent_id || '-'}</strong></div>
                <div><span>Action</span><strong>{selectedItem.action_id || '-'}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleOpenDrawer}
                >
                  <Send size={15} /> 개선 요청 생성
                </button>
                {selectedItem.matched_intent_id && (
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      const url = `/admin/intent-factory/intents/${encodeURIComponent(selectedItem.matched_intent_id)}?project=${encodeURIComponent(projectId)}`;
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

      <ImprovementRequestDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        logData={drawerData}
        onSave={handleSaveImprovement}
      />
    </div>
  );
};

export default UnansweredAnalysis;
