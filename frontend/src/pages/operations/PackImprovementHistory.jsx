import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Package, RefreshCw } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const PackImprovementHistory = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectContext();
  const projectId = selectedProjectId;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadHistory = useCallback(async () => {
    if (!projectId) {
      setHistory([]);
      setLoading(false);
      setMessage('프로젝트를 선택하면 운영 인사이트를 확인할 수 있습니다.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`/api/v1/projects/${projectId}/operations/pack-improvements`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      });
      setHistory(res.data.pack_history || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
      setMessage('Pack 개선 이력을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const content = (
    <div style={{ padding: embedded ? '0 24px 24px' : '24px' }}>
      <div className="operations-controls" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <select value={projectId || ''} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loadingProjects} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          {projects.map((project) => (
            <option key={project.id || project.project_id} value={project.id || project.project_id}>
              {project.name || project.project_name || project.id || project.project_id}
            </option>
          ))}
        </select>
        <button className="btn-secondary" type="button" onClick={loadHistory}>
          <RefreshCw size={15} /> 새로고침
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Pack 이력을 불러오는 중입니다...</div>
      ) : history.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          등록된 Pack 개선 이력이 없습니다. 개선 요청을 Pack에 반영하고 배포하면 이곳에 표시됩니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {history.map((pack) => (
            <div key={pack.pack_version} className="panel" style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={24} color="#1976d2" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Pack Version: {pack.pack_version}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#666', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
                  {pack.improvements.length}건 반영됨
                </span>
              </div>
              <div style={{ padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '12px 8px', color: '#444' }}>요청 ID</th>
                      <th style={{ padding: '12px 8px', color: '#444' }}>유형</th>
                      <th style={{ padding: '12px 8px', color: '#444' }}>제목</th>
                      <th style={{ padding: '12px 8px', color: '#444' }}>검증 상태</th>
                      <th style={{ padding: '12px 8px', color: '#444' }}>배포 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pack.improvements.map(imp => (
                      <tr key={imp.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 500 }}>{imp.request_id}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontSize: '12px', background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px' }}>
                            {imp.request_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{imp.title}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className={`operations-state ${imp.validation_status}`}>{imp.validation_status}</span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className={`operations-state ${imp.deployment_status}`}>{imp.deployment_status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="console-embedded-toolbar">
          <div>
            <h3>Pack 개선 이력</h3>
            <p>개선 요청들이 어떤 Pack 버전에 포함되어 검증되고 배포되었는지 생애주기를 추적합니다.</p>
          </div>
        </div>
        {message && <div className="workflow-message" style={{ margin: '0 24px 16px' }}>{message}</div>}
        {content}
      </div>
    );
  }

  return (
    <div className="inner operations-page">
      <div className="operations-header">
        <div>
          <div className="operations-eyebrow">운영 및 개선</div>
          <h2>Pack 개선 이력</h2>
          <p>개선 요청들이 어떤 Pack 버전에 포함되어 검증되고 배포되었는지 생애주기를 추적합니다.</p>
        </div>
      </div>
      {message && <div className="workflow-message" style={{ margin: '0 24px 16px' }}>{message}</div>}
      {content}
    </div>
  );
};

export default PackImprovementHistory;
