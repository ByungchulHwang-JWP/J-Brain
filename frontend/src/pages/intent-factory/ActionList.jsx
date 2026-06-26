import ShellPage from '../../components/common/ShellPage';

const ActionList = () => {
  return (
    <ShellPage
      title="Action 관리"
      eyebrow="Intent Factory"
      description="Intent가 실행할 화면 이동, 문서 검색, 정형 조회, 안내 Action을 관리합니다."
      statusItems={[
        { label: 'Action 유형', value: 'NAVIGATE / SEARCH_DOC / QUERY / GUIDE' },
        { label: '실행 제어', value: 'Whitelist 기반' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 Action 관리 메뉴와 실행 유형을 표시합니다. 다음 단계에서 action_registry, screen_routes, api_mappings, sql_templates 조회를 연결합니다.
      </p>
    </ShellPage>
  );
};

export default ActionList;
