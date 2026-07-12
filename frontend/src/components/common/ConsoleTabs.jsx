import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const ConsoleTabs = ({ tabs, defaultTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get('tab') || defaultTab || tabs[0]?.id;
  const activeTab = tabs.find((tab) => tab.id === selected) || tabs[0];

  useEffect(() => {
    if (!searchParams.get('tab') && activeTab?.id) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab.id);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab?.id, searchParams, setSearchParams]);

  const selectTab = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="console-tabs">
      <div className="console-tab-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab?.id}
            className={`console-tab ${tab.id === activeTab?.id ? 'active' : ''}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <section className="console-tab-panel" role="tabpanel">
        {activeTab?.render?.()}
      </section>
    </div>
  );
};

export default ConsoleTabs;
