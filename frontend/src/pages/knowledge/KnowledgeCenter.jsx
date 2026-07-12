import ConsoleTabs from '../../components/common/ConsoleTabs';
import SourceList from '../SourceList';
import IndexJobList from '../IndexJobList';
import RetrievalTest from '../RetrievalTest';

const KnowledgeCenter = () => (
  <div className="inner">
    <div className="breadcrumb">
      <span>관리 기능</span> {'>'} <span>지식 센터</span>
    </div>
    <div className="page-header" style={{ padding: '12px 0 20px', margin: 0 }}>
      <h2 style={{ fontWeight: 700 }}>지식 센터</h2>
      <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
        Source 등록 현황, 벡터화 작업, 검색 테스트를 하나의 지식 운영 흐름으로 관리합니다.
      </p>
    </div>
    <ConsoleTabs
      defaultTab="sources"
      tabs={[
        { id: 'sources', label: 'Source 관리', render: () => <SourceList embedded /> },
        { id: 'jobs', label: '벡터화 작업', render: () => <IndexJobList embedded /> },
        { id: 'search-test', label: '검색 테스트', render: () => <RetrievalTest embedded /> },
      ]}
    />
  </div>
);

export default KnowledgeCenter;
