import ShellPage from '../../components/common/ShellPage';

const FaqList = () => {
  return (
    <ShellPage
      title="FAQ 관리"
      eyebrow="Intent Factory"
      description="자주 묻는 질문과 승인된 답변을 관리하고 SEARCH_DOC Action과 연결합니다."
      statusItems={[
        { label: '주요 Action', value: 'SEARCH_DOC' },
        { label: '연결 지식', value: 'Source/FAQ' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 FAQ 관리 메뉴와 역할을 제공합니다. 다음 단계에서 Pack FAQ 목록 조회, Source 연결, 답변 정책 편집 기능을 추가합니다.
      </p>
    </ShellPage>
  );
};

export default FaqList;
