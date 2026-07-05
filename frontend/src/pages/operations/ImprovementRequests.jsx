import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react';
import { listFaqCandidates } from '../../api/intentFactory';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const ImprovementRequests = () => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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

  const loadCandidates = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await listFaqCandidates(projectId);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('개선 요청 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const counts = useMemo(() => ({
    total: items.length,
    new: items.filter((item) => item.status === 'new').length,
    reviewing: items.filter((item) => item.status === 'reviewing').length,
    done: items.filter((item) => ['done', 'approved', 'converted'].includes(item.status)).length,
  }), [items]);

  return (
    <div className="inner operations-page">
      <div className="operations-header">
        <div>
          <div className="operations-eyebrow">운영 및 개선</div>
          <h2>개선 요청 관리</h2>
          <p>미응답 분석에서 전환된 FAQ 후보와 Pack 개선 요청을 관리합니다.</p>
        </div>
        <div className="operations-controls">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.length === 0 ? <option value="J-Brain">J-Brain</option> : projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name} ({project.id})</option>
            ))}
          </select>
          <button className="btn-secondary" type="button" onClick={loadCandidates}>
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="operations-kpi-grid">
        <div className="panel operations-kpi"><span>전체 요청</span><strong>{counts.total}</strong><small>FAQ 후보 기준</small></div>
        <div className="panel operations-kpi"><span>신규</span><strong>{counts.new}</strong><small>검토 대기</small></div>
        <div className="panel operations-kpi"><span>검토 중</span><strong>{counts.reviewing}</strong><small>답변 보완 필요</small></div>
        <div className="panel operations-kpi"><span>완료</span><strong>{counts.done}</strong><small>Pack 반영 후보</small></div>
      </div>

      <div className="panel operations-table-card">
        <div className="operations-panel-head">
          <div>
            <h3>개선 요청 목록</h3>
            <p>FAQ 후보를 보완한 뒤 FAQ 관리에서 승인 답변으로 등록합니다.</p>
          </div>
          <ClipboardList size={20} />
        </div>
        <table>
          <thead>
            <tr>
              <th>후보 ID</th>
              <th>질문</th>
              <th>답변 초안</th>
              <th>태그</th>
              <th>Source Log</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">개선 요청을 불러오는 중입니다.</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6">등록된 개선 요청이 없습니다. 미응답 분석 화면에서 FAQ 후보로 전환해 주세요.</td></tr>
            ) : items.map((item) => (
              <tr key={item.candidate_id}>
                <td><strong>{item.candidate_id}</strong></td>
                <td>{item.question}</td>
                <td>{item.suggested_answer || '-'}</td>
                <td>
                  <div className="operations-tags">
                    {(item.tags || []).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </td>
                <td>{item.source_log_id || '-'}</td>
                <td><span className={`operations-state ${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel operations-next-guide">
        <CheckCircle2 size={18} />
        <div>
          <strong>다음 연결 작업</strong>
          <p>v0.1에서는 FAQ 후보 목록까지 연결했습니다. 다음 단계에서는 선택한 후보를 FAQ 등록 화면으로 넘겨 질문/답변/근거 Source를 보완하고 Pack Build에 반영하는 흐름을 구현합니다.</p>
        </div>
      </div>
    </div>
  );
};

export default ImprovementRequests;
