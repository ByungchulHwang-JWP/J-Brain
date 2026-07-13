import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const OperationMetrics = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectContext();
  const projectId = selectedProjectId;
  const [days, setDays] = useState(30);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadMetrics = useCallback(async () => {
    if (!projectId) {
      setData([]);
      setLoading(false);
      setMessage('프로젝트를 선택하면 운영 인사이트를 확인할 수 있습니다.');
      return;
    }
    setData([]);
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`/api/v1/projects/${projectId}/operations/metrics?days=${days}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      });
      let metrics = res.data.metrics || [];
      const formattedData = metrics.map(m => ({
        ...m,
        intent_match_rate: m.total_requests > 0 ? (m.intent_match_count / m.total_requests * 100).toFixed(1) : 0,
        fallback_rate: m.total_requests > 0 ? (m.fallback_count / m.total_requests * 100).toFixed(1) : 0,
      }));
      setData(formattedData);
    } catch (error) {
      console.error(error);
      setData([]);
      setMessage('운영 지표를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [days, projectId]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const content = (
    <div style={{ padding: embedded ? '0 24px 24px' : '24px' }}>
      <div className="operations-controls" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <select value={projectId || ''} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loadingProjects} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          {projects.map((project) => (
            <option key={project.id || project.project_id} value={project.id || project.project_id}>
              {project.name || project.project_name || project.id || project.project_id}
            </option>
          ))}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value={7}>최근 7일</option>
          <option value={14}>최근 14일</option>
          <option value={30}>최근 30일</option>
        </select>
        <button className="btn-secondary" type="button" onClick={loadMetrics}>
          <RefreshCw size={15} /> 새로고침
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading metrics...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--color-text-main)' }}>일자별 요청 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} tickMargin={10} minTickGap={20} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} />
                <Tooltip cursor={{fill: 'var(--color-bg-elevated)'}} contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} />
                <Legend wrapperStyle={{ color: 'var(--color-text-main)' }} />
                <Bar dataKey="total_requests" name="총 요청 수" fill="#2196f3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fallback_count" name="Fallback 수" fill="#f44336" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--color-text-main)' }}>매칭률 및 Fallback Rate 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} tickMargin={10} minTickGap={20} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} />
                <Legend wrapperStyle={{ color: 'var(--color-text-main)' }} />
                <Line type="monotone" dataKey="intent_match_rate" name="Intent 매칭률 (%)" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="fallback_rate" name="Fallback Rate (%)" stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--color-text-main)' }}>평균 Confidence 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} tickMargin={10} minTickGap={20} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} domain={[0, 1.0]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} />
                <Legend wrapperStyle={{ color: 'var(--color-text-main)' }} />
                <Line type="monotone" dataKey="avg_confidence" name="평균 신뢰도" stroke="#9c27b0" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--color-text-main)' }}>평균 응답 시간 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} tickMargin={10} minTickGap={20} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-sub)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} />
                <Legend wrapperStyle={{ color: 'var(--color-text-main)' }} />
                <Line type="monotone" dataKey="avg_response_time_ms" name="응답 시간 (ms)" stroke="#00bcd4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="console-embedded-toolbar">
          <div>
            <h3>운영 지표</h3>
            <p>기간별 통계와 품질 추이를 확인하여 시스템의 거시적인 개선 상태를 진단합니다.</p>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="inner operations-page">
      <div className="operations-header">
        <div>
          <div className="operations-eyebrow">운영 및 개선</div>
          <h2>운영 지표</h2>
          <p>기간별 통계와 품질 추이를 확인하여 시스템의 거시적인 개선 상태를 진단합니다.</p>
        </div>
      </div>
      {content}
    </div>
  );
};

export default OperationMetrics;
