import React, { useState, useEffect } from 'react';
import ShellPage from '../../components/common/ShellPage';
import OperationKpiStrip from '../../components/operations/OperationKpiStrip';
import OperationHealthPanel from '../../components/operations/OperationHealthPanel';
import RuntimeEventTable from '../../components/operations/RuntimeEventTable';
import { useParams, useSearchParams } from 'react-router-dom';

const RealtimeMonitoring = ({ embedded = false }) => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 이 프로젝트에 적용된 상태값 fetch
  useEffect(() => {
    // 임시 모킹 데이터 - 백엔드 API 연동 시 fetch 호출로 교체
    // 백엔드 엔드포인트: `/api/v1/projects/${projectId}/operations/realtime`
    const mockData = {
      kpi: {
        active_pack: 'v1.2.4',
        requests_last_hour: 450,
        intent_match_rate: 82.5,
        fallback_rate: 17.5,
        avg_response_time: 420,
        error_count: 0
      },
      recent_logs: [
        {
          id: 1,
          session_id: 'sess-1',
          question: '휴가 신청은 어떻게 하나요?',
          matched_intent_id: 'INTENT_HR_VACATION',
          action_id: 'ACT_VACATION_INFO',
          action_type: 'SEARCH_DOC',
          confidence: 0.92,
          confidence_label: 'high',
          fallback_yn: false,
          response_status: 'success',
          response_time_ms: 350,
          active_pack_version: 'v1.2.4',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          session_id: 'sess-2',
          question: '노트북 신청 서류는?',
          matched_intent_id: null,
          action_id: null,
          action_type: null,
          confidence: null,
          confidence_label: null,
          fallback_yn: true,
          response_status: 'fallback',
          response_time_ms: 200,
          active_pack_version: 'v1.2.4',
          created_at: new Date(Date.now() - 5000).toISOString()
        }
      ]
    };
    
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, [projectId]);

  if (loading || !data) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

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

  const content = (
    <>
      <OperationKpiStrip data={data.kpi} />
      
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
          onAction={handleNavigateToUnanswered}
        />
      </div>

      <div style={{ marginTop: '24px' }} id="runtime-logs-table">
        <h3 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--color-text-main)' }}>최근 Runtime 요청 목록</h3>
        <RuntimeEventTable logs={data.recent_logs} />
      </div>
    </>
  );

  if (embedded) {
    return (
      <div>
        <div className="console-embedded-toolbar">
          <div>
            <h3>실시간 모니터링</h3>
            <p>Runtime 요청, Intent 매칭, fallback 발생 현황을 운영자가 실시간으로 확인하는 화면입니다.</p>
          </div>
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
        {content}
      </div>
    </ShellPage>
  );
};

export default RealtimeMonitoring;
