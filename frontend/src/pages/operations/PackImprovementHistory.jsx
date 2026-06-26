import ShellPage from '../../components/common/ShellPage';

const PackImprovementHistory = () => (
  <ShellPage
    title="Pack 개선 이력"
    eyebrow="운영 및 개선"
    description="운영 피드백이 어떤 Pack 버전에 반영되었는지 추적합니다."
    statusItems={[
      { label: '추적 단위', value: 'Pack Version' },
      { label: '검증', value: '회귀 테스트' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 개선 이력 진입점을 제공합니다. 다음 단계에서 Pack version changelog와 검증 결과를 연결합니다.
    </p>
  </ShellPage>
);

export default PackImprovementHistory;
