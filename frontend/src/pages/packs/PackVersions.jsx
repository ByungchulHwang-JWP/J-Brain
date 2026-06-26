import ShellPage from '../../components/common/ShellPage';

const PackVersions = () => (
  <ShellPage
    title="버전 관리"
    eyebrow="Pack 제작/배포"
    description="Pack 버전, 변경 이력, 배포 상태를 관리합니다."
    statusItems={[
      { label: '버전 정책', value: 'Semantic Version' },
      { label: '변경 이력', value: 'Pack 단위 관리' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 버전 관리 진입점을 제공합니다. 다음 단계에서 version_info와 changelog를 연결합니다.
    </p>
  </ShellPage>
);

export default PackVersions;
