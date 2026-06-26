import ShellPage from '../../components/common/ShellPage';

const PackValidation = () => (
  <ShellPage
    title="Pack 검증"
    eyebrow="Pack 제작/배포"
    description="검증 질문, 기대 Intent, 기대 Action 기준으로 Pack 품질을 확인합니다."
    statusItems={[
      { label: '검증 기준', value: 'Validation Questions' },
      { label: '결과', value: 'Pass/Fail' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      현재 Intent Matcher 테스트 결과를 Pack 검증 결과로 확장하는 화면입니다.
    </p>
  </ShellPage>
);

export default PackValidation;
