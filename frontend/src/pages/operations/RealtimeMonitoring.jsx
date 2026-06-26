import ShellPage from '../../components/common/ShellPage';

const RealtimeMonitoring = () => (
  <ShellPage
    title="실시간 모니터링"
    eyebrow="운영 및 개선"
    description="Runtime 요청, Intent 매칭, fallback 발생 현황을 운영자가 확인하는 화면입니다."
    statusItems={[
      { label: 'Runtime', value: '동작 확인 필요' },
      { label: 'Fallback', value: '미응답 분석 연계' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 모니터링 진입점을 제공합니다. 다음 단계에서 runtime log와 unanswered log 집계를 연결합니다.
    </p>
  </ShellPage>
);

export default RealtimeMonitoring;
