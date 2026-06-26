import ShellPage from '../../components/common/ShellPage';

const EntityList = ({ mode = 'entities' }) => {
  const isSynonym = mode === 'synonyms';

  return (
    <ShellPage
      title={isSynonym ? 'Synonym 관리' : 'Entity 관리'}
      eyebrow="Intent Factory"
      description={isSynonym ? '동의어와 표현 확장 사전을 관리합니다.' : 'Intent 매칭과 Action 실행에 필요한 업무 개체를 관리합니다.'}
      statusItems={[
        { label: '관리 대상', value: isSynonym ? '동의어/표현' : '업무 Entity' },
        { label: '연결 영역', value: 'Intent Matcher' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 Entity/Synonym 관리 메뉴 진입점과 역할을 제공합니다. 다음 단계에서 Pack JSON 기반 목록 조회와 편집 기능을 연결합니다.
      </p>
    </ShellPage>
  );
};

export default EntityList;
