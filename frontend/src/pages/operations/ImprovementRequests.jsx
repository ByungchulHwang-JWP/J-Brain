import ShellPage from '../../components/common/ShellPage';

const ImprovementRequests = () => (
  <ShellPage
    title="개선 요청 관리"
    eyebrow="운영 및 개선"
    description="미응답 분석 결과를 Pack 개선 요청으로 등록하고 처리 상태를 관리합니다."
    statusItems={[
      { label: '입력', value: '미응답 질문' },
      { label: '출력', value: 'Pack 개선 요청' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      개선 요청은 고객 데이터 원문을 외부망으로 반출하지 않고, 승인된 비식별 정보만 Pack 개선 흐름에 전달하는 정책을 따릅니다.
    </p>
  </ShellPage>
);

export default ImprovementRequests;
