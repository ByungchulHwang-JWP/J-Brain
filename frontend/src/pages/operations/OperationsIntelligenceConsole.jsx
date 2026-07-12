import ConsoleTabs from '../../components/common/ConsoleTabs';
import Stats from '../Stats';
import RealtimeMonitoring from './RealtimeMonitoring';
import UnansweredAnalysis from './UnansweredAnalysis';
import ImprovementRequests from './ImprovementRequests';
import PackImprovementHistory from './PackImprovementHistory';

const OperationsIntelligenceConsole = () => (
  <div className="inner">
    <div className="breadcrumb">
      <span>운영/분석</span> {'>'} <span>운영 인사이트</span>
    </div>
    <div className="page-header" style={{ padding: '12px 0 20px', margin: 0 }}>
      <h2 style={{ fontWeight: 700 }}>운영 인사이트</h2>
      <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
        실시간 운영 상태, 사용 통계, 미응답, 개선 요청, Pack 개선 이력을 하나의 개선 루프로 관리합니다.
      </p>
    </div>
    <ConsoleTabs
      defaultTab="realtime"
      tabs={[
        { id: 'realtime', label: '실시간 모니터링', render: () => <RealtimeMonitoring embedded /> },
        { id: 'metrics', label: '운영 지표', render: () => <Stats embedded mode="operations" /> },
        { id: 'unanswered', label: '미응답 분석', render: () => <UnansweredAnalysis embedded /> },
        { id: 'improvements', label: '개선 요청', render: () => <ImprovementRequests embedded /> },
        { id: 'pack-history', label: 'Pack 개선 이력', render: () => <PackImprovementHistory embedded /> },
      ]}
    />
  </div>
);

export default OperationsIntelligenceConsole;
