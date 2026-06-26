import ShellPage from '../../components/common/ShellPage';

const LlmAssist = () => {
  return (
    <ShellPage
      title="LLM 지원 도구"
      eyebrow="Intent Factory"
      description="외부망에서 Intent/Entity/FAQ 후보를 생성하고 전문가 검수로 확정하는 지원 도구입니다."
      statusItems={[
        { label: '운영 위치', value: '자사 외부망' },
        { label: '고객망 반입', value: '검증된 Pack만 반입' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        고객 내부망 Runtime은 LLM/API 없이 동작합니다. 이 화면은 외부망 Intent Factory에서 후보 생성과 검수 흐름을 관리하기 위한 진입점입니다.
      </p>
    </ShellPage>
  );
};

export default LlmAssist;
