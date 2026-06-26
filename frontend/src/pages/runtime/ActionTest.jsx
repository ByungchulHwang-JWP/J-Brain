import ShellPage from '../../components/common/ShellPage';

const ActionTest = () => (
  <ShellPage
    title="Action 실행 테스트"
    eyebrow="Runtime 테스트"
    description="Intent 매칭 후 Action Router가 어떤 실행 카드를 반환하는지 확인합니다."
    statusItems={[
      { label: '지원 Action', value: 'NAVIGATE / SEARCH_DOC / QUERY / GUIDE' },
      { label: '실행 방식', value: 'Whitelist' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 Action 테스트 진입점을 제공합니다. 현재는 챗봇 대화 테스트와 Intent 매칭 테스트에서 Action 결과를 확인합니다.
    </p>
  </ShellPage>
);

export default ActionTest;
