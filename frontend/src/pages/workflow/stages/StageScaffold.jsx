import { useNavigate } from 'react-router-dom';

const StageScaffold = ({ title, description, primaryActions = [], focusItems = [], metrics = [] }) => {
  const navigate = useNavigate();

  return (
    <section className="panel workflow-stage-panel">
      <div className="workflow-section-title">
        <span>{title}</span>
      </div>
      <p className="workflow-stage-description">{description}</p>

      {metrics.length > 0 && (
        <div className="workflow-mini-metrics">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="workflow-focus-list">
        {focusItems.map((item) => (
          <div key={item.title} className="workflow-focus-item">
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
        ))}
      </div>

      <div className="workflow-stage-actions">
        {primaryActions.map((action) => (
          <button
            key={action.path}
            className={action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
            type="button"
            onClick={() => navigate(action.path)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default StageScaffold;

