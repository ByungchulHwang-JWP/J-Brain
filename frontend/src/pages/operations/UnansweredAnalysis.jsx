import ShellPage from '../../components/common/ShellPage';

const UnansweredAnalysis = () => (
  <ShellPage
    title="미응답 분석"
    eyebrow="운영 및 개선"
    description="낮은 신뢰도 또는 fallback 질문을 분석하여 Intent 개선 후보로 전환합니다."
    statusItems={[
      { label: '분석 대상', value: 'Fallback / Very Low' },
      { label: '개선 연결', value: 'Intent 후보 생성' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 미응답 분석 진입점을 제공합니다. 다음 단계에서 unanswered_questions.jsonl 조회 API와 목록 화면을 연결합니다.
    </p>
  </ShellPage>
);

export default UnansweredAnalysis;
