import ShellPage from '../../components/common/ShellPage';

const statusItems = [
  { label: '추적 단위', value: 'Pack 버전' },
  { label: '검증', value: '회귀 테스트' },
];

const PackImprovementHistory = ({ embedded = false }) => {
  const content = (
    <>
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        {statusItems.map((item) => (
          <div className="stat-card" key={item.label}>
            <div className="stat-card-label">{item.label}</div>
            <div className="stat-card-value">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="table-area" style={{ padding: '24px' }}>
        <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
          v0.1에서는 개선 이력 진입점을 제공합니다. 다음 단계에서 Pack version changelog와 검증 결과를 연결합니다.
        </p>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div>
        <div className="console-embedded-toolbar">
          <div>
            <h3>Pack 개선 이력</h3>
            <p>운영 피드백이 어떤 Pack 버전에 반영되었는지 추적합니다.</p>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <ShellPage
      title="Pack 개선 이력"
      eyebrow="운영 및 개선"
      description="운영 피드백이 어떤 Pack 버전에 반영되었는지 추적합니다."
      statusItems={statusItems}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 개선 이력 진입점을 제공합니다. 다음 단계에서 Pack 버전 변경 이력과 검증 결과를 연결합니다.
      </p>
    </ShellPage>
  );
};

export default PackImprovementHistory;
