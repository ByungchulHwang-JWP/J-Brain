import ConsoleTabs from '../../components/common/ConsoleTabs';
import IntentList from './IntentList';
import EntityList from './EntityList';
import FaqList from './FaqList';
import ActionList from './ActionList';
import LlmAssist from './LlmAssist';

const IntentStudio = () => (
  <div className="inner">
    <div className="breadcrumb">
      <span>관리 기능</span> {'>'} <span>의도 설계 스튜디오</span>
    </div>
    <div className="page-header" style={{ padding: '12px 0 20px', margin: 0 }}>
      <h2 style={{ fontWeight: 700 }}>의도 설계 스튜디오</h2>
      <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
        Intent, Entity/Synonym, FAQ, Action, LLM 지원 도구를 하나의 설계 스튜디오에서 관리합니다.
      </p>
    </div>
    <ConsoleTabs
      defaultTab="intents"
      tabs={[
        { id: 'intents', label: 'Intent 관리', render: () => <IntentList embedded /> },
        { id: 'entities', label: 'Entity/Synonym 관리', render: () => <EntityList embedded /> },
        { id: 'faqs', label: 'FAQ 관리', render: () => <FaqList embedded /> },
        { id: 'actions', label: 'Action 관리', render: () => <ActionList embedded /> },
        { id: 'llm-assist', label: 'LLM 지원 도구', render: () => <LlmAssist embedded /> },
      ]}
    />
  </div>
);

export default IntentStudio;
