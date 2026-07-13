import React, { useState, useEffect } from 'react';
import ShellPage from '../../components/common/ShellPage';
import OperationKpiStrip from '../../components/operations/OperationKpiStrip';
import OperationHealthPanel from '../../components/operations/OperationHealthPanel';
import RuntimeEventTable from '../../components/operations/RuntimeEventTable';
import { useSearchParams } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';

const getAccessToken = () => localStorage.getItem('ai_access_token');

const RealtimeMonitoring = ({ embedded = false }) => {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectContext();
  const projectId = selectedProjectId;
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 이 프로젝트에 적용된 상태값 fetch
  useEffect(() => {
    const fetchRealtimeData = async () => {
      if (!projectId) {
        setData(null);
        setMessage('프로젝트를 선택하면 실시간 운영 상태를 확인할 수 있습니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage('');
      try {
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await fetch(`/api/v1/projects/${projectId}/operations/realtime`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch realtime operations data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching realtime data:', error);
        // 오류 발생 시 기본값으로 세팅 (또는 에러 UI 처리)
        setData({
          kpi: {
            active_pack: '-',
            requests_last_hour: 0,
            intent_match_rate: 0,
            fallback_rate: 0,
            avg_response_time: 0,
            error_count: 0
          },
          recent_logs: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealtimeData();
    
    // 선택적: 주기적으로 실시간 데이터를 폴링(polling)하려면 setInterval을 사용할 수 있습니다.
    const intervalId = setInterval(fetchRealtimeData, 60000); // 1분 단위 갱신
    return () => clearInterval(intervalId);
  }, [projectId]);

  const handleNavigateToUnanswered = () => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'unanswered');
    setSearchParams(next);
  };

  const handleScrollToLogs = () => {
    const el = document.getElementById('runtime-logs-table');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const content = loading ? (
    <div style={{ padding: '20px' }}>Loading...</div>
  ) : data ? (
    <>
      <OperationKpiStrip data={data.kpi} trend={data.trend} />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <OperationHealthPanel 
          type="health"
          title="Runtime 건강도" 
          statusBadge={data.kpi.error_count === 0 ? "정상" : "확인 필요"}
          description={data.kpi.error_count === 0 ? "전반적으로 안정적인 상태입니다." : "최근 Runtime 오류가 발생했습니다."}
          metrics={[
            { label: "현재 상태", value: data.kpi.error_count === 0 ? "정상" : "장애", valueColor: data.kpi.error_count === 0 ? "#4caf50" : "#f44336" },
            { label: "연속 정상 시간", value: "7시간 28분" },
            { label: "최근 장애", value: `${data.kpi.error_count}건 (24시간)` }
          ]}
          trend={data.trend}
          onAction={handleScrollToLogs}
        />
        <OperationHealthPanel 
          type="warning"
          title="미응답 / Fallback 상태" 
          statusBadge={data.kpi.fallback_rate >= 10 ? "주의" : "정상"}
          description={data.kpi.fallback_rate >= 10 ? "Fallback 비율이 평소보다 높습니다." : "미응답 비율이 안정적입니다."}
          metrics={[
            { label: "현재 Fallback 비율", value: `${data.kpi.fallback_rate.toFixed(1)}%` },
            { label: "임계 기준", value: "20% 미만" },
            { label: "권장 조치", value: data.kpi.fallback_rate >= 10 ? "미응답 분석" : "해당 없음", valueColor: data.kpi.fallback_rate >= 10 ? "#f44336" : "var(--color-text-main)" }
          ]}
          trend={data.trend}
          onAction={handleNavigateToUnanswered}
        />
      </div>

      <div style={{ marginTop: '24px' }} id="runtime-logs-table">
        <h3 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--color-text-main)' }}>최근 Runtime 요청 목록</h3>
        <RuntimeEventTable logs={data.recent_logs} />
      </div>
    </>
  ) : (
    <div className="workflow-message">{message}</div>
  );

  const projectSelector = (
    <select value={projectId || ''} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loadingProjects}>
      {projects.map((project) => (
        <option key={project.id || project.project_id} value={project.id || project.project_id}>
          {project.name || project.project_name || project.id || project.project_id}
        </option>
      ))}
    </select>
  );

  if (embedded) {
    return (
      <div>
        <div className="console-embedded-toolbar">
          <div>
            <h3>실시간 모니터링</h3>
            <p>Runtime 요청, Intent 매칭, fallback 발생 현황을 운영자가 실시간으로 확인하는 화면입니다.</p>
          </div>
          {projectSelector}
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <ShellPage
      title="실시간 모니터링"
      eyebrow="운영 및 개선"
      description="Runtime 요청, Intent 매칭, fallback 발생 현황을 운영자가 실시간으로 확인하는 화면입니다."
    >
      <div style={{ padding: '24px' }}>
        <div className="operations-controls" style={{ marginBottom: '20px' }}>
          {projectSelector}
        </div>
        {content}
      </div>
    </ShellPage>
  );
};

export default RealtimeMonitoring;
