import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const ImprovementRequests = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectContext();
  const projectId = selectedProjectId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const loadRequests = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      setLoading(false);
      setMessage('프로젝트를 선택하면 운영 인사이트를 확인할 수 있습니다.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`/api/v1/projects/${projectId}/operations/improvement-requests`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      });
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMessage('개선 요청 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const counts = useMemo(() => ({
    total: items.length,
    new: items.filter((item) => item.status === 'new').length,
    reviewing: items.filter((item) => item.status === 'reviewing').length,
    done: items.filter((item) => item.status === 'done' || item.status === 'deployed').length,
  }), [items]);

  const handleStatusChange = async (item, status) => {
    try {
      await axios.patch(`/api/v1/projects/${projectId}/operations/improvement-requests/${item.request_id}`, {
        status,
      }, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      setMessage('개선 요청 상태가 변경되었습니다.');
      await loadRequests();
    } catch (err) {
      console.error(err);
      setMessage('개선 요청 상태 변경에 실패했습니다.');
    }
  };

  return (
    <div className={embedded ? 'operations-page' : 'inner operations-page'}>
      <div className="operations-header">
        <div>
          <div className="operations-eyebrow">운영 및 개선</div>
          {embedded ? <h3>개선 요청</h3> : <h2>개선 요청 관리</h2>}
          <p>미응답 분석에서 발견된 다양한 개선 사항(FAQ/Intent/Action/Entity 보완)의 처리 상태를 관리합니다.</p>
        </div>
        <div className="operations-controls">
          <select value={projectId || ''} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loadingProjects}>
            {projects.map((project) => (
              <option key={project.id || project.project_id} value={project.id || project.project_id}>
                {project.name || project.project_name || project.id || project.project_id}
              </option>
            ))}
          </select>
          <button className="btn-secondary" type="button" onClick={loadRequests}>
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="operations-kpi-grid">
        <div className="panel operations-kpi"><span>전체 요청</span><strong>{counts.total}</strong><small>전체 접수 건</small></div>
        <div className="panel operations-kpi"><span>신규</span><strong>{counts.new}</strong><small>검토 대기</small></div>
        <div className="panel operations-kpi"><span>검토/보완 중</span><strong>{counts.reviewing}</strong><small>작업 중</small></div>
        <div className="panel operations-kpi"><span>완료 (Pack 반영 대기)</span><strong>{counts.done}</strong><small>Pack 배포 대상</small></div>
      </div>

      <div className="panel operations-table-card">
        <div className="operations-panel-head">
          <div>
            <h3>통합 개선 요청 목록</h3>
            <p>개선 요청을 보완하여 다음 Pack 버전에 포함시킵니다.</p>
          </div>
          <ClipboardList size={20} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>요청 ID</th>
                <th style={{ padding: '12px' }}>유형</th>
                <th style={{ padding: '12px' }}>제목 / 이슈 내용</th>
                <th style={{ padding: '12px' }}>심각도</th>
                <th style={{ padding: '12px' }}>담당자</th>
                <th style={{ padding: '12px' }}>상태</th>
                <th style={{ padding: '12px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>개선 요청을 불러오는 중입니다.</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>등록된 개선 요청이 없습니다. 미응답 분석 화면에서 개선 요청을 생성해 주세요.</td></tr>
              ) : items.map((item) => (
                <tr key={item.request_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}><strong>{item.request_id}</strong></td>
                  <td style={{ padding: '12px' }}>{item.request_type}</td>
                  <td style={{ padding: '12px', maxWidth: '300px' }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.description}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`severity ${item.severity === 'high' ? 'high' : 'medium'}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{item.assignee_name || '미지정'}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`operations-state ${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      value={item.status}
                      onChange={(event) => handleStatusChange(item, event.target.value)}
                      aria-label={`${item.request_id} 상태 변경`}
                    >
                      <option value="new">new</option>
                      <option value="reviewing">reviewing</option>
                      <option value="done">done</option>
                      <option value="deployed">deployed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="panel operations-next-guide">
        <CheckCircle2 size={18} />
        <div>
          <strong>Pack Lifecycle 연동</strong>
          <p>개선 요청이 '보완 완료' 상태가 되면, 다음 번 <strong>Pack Build</strong> 시에 이력이 자동으로 기록되며 변경된 리소스에 대한 Validation이 요구됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default ImprovementRequests;
