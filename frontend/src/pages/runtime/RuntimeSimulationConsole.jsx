import ConsoleTabs from '../../components/common/ConsoleTabs';
import ProjectQA from '../ProjectQA';
import IntentMatchTest from './IntentMatchTest';
import ActionTest from './ActionTest';
import WidgetPreview from './WidgetPreview';

const RuntimeSimulationConsole = () => (
  <div className="inner">
    <div className="breadcrumb">
      <span>운영/분석</span> {'>'} <span>Runtime 시뮬레이션</span>
    </div>
    <div className="page-header" style={{ padding: '12px 0 20px', margin: 0 }}>
      <h2 style={{ fontWeight: 700 }}>Runtime 시뮬레이션</h2>
      <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
        챗봇 대화 테스트, Intent 매칭 테스트, Action 실행 테스트, 위젯 미리보기를 같은 Active Pack 기준으로 검증합니다.
      </p>
    </div>
    <ConsoleTabs
      defaultTab="chat"
      tabs={[
        { id: 'chat', label: '챗봇 대화 테스트', render: () => <ProjectQA embedded /> },
        { id: 'intent-match', label: 'Intent 매칭 테스트', render: () => <IntentMatchTest embedded /> },
        { id: 'action-route', label: 'Action 실행 테스트', render: () => <ActionTest embedded /> },
        { id: 'widget-preview', label: '위젯 미리보기', render: () => <WidgetPreview embedded /> },
      ]}
    />
  </div>
);

export default RuntimeSimulationConsole;
