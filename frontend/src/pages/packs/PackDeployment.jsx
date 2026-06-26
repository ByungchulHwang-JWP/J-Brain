import ShellPage from '../../components/common/ShellPage';

const PackDeployment = () => (
  <ShellPage
    title="배포 패키지 생성"
    eyebrow="Pack 제작/배포"
    description="고객 내부망 반입을 위한 Service-Pack ZIP을 생성하고 배포 이력을 관리합니다."
    statusItems={[
      { label: '배포 단위', value: 'Service-Pack ZIP' },
      { label: '전송 방식', value: '보안 승인 반입' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 배포 패키지 생성 흐름을 표시합니다. 다음 단계에서 ZIP 생성과 checksum 검증 기능을 연결합니다.
    </p>
  </ShellPage>
);

export default PackDeployment;
