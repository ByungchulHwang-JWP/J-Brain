import ShellPage from '../../components/common/ShellPage';

const PackBuilder = () => (
  <ShellPage
    title="Pack Builder"
    eyebrow="Pack 제작/배포"
    description="Intent, Entity, FAQ, Action, Source 검색 정책을 배포 가능한 Pack으로 구성합니다."
    statusItems={[
      { label: '입력', value: 'Intent/Entity/Action/FAQ' },
      { label: '출력', value: 'Intent Pack' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 Pack 구성 흐름을 표시합니다. 다음 단계에서 Pack 구성요소 선택, 검증, manifest 생성 기능을 연결합니다.
    </p>
  </ShellPage>
);

export default PackBuilder;
