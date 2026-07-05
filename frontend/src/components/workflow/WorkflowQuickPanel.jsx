import { ArrowRight, X } from 'lucide-react';

const WorkflowQuickPanel = ({
  open,
  eyebrow,
  title,
  description,
  items = [],
  primaryAction,
  secondaryAction,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="workflow-drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="workflow-drawer workflow-side-drawer workflow-quick-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="workflow-drawer-head">
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h3>{title}</h3>
          </div>
          <button type="button" className="workflow-icon-button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="workflow-quick-panel-body">
          {description && <p className="workflow-quick-panel-description">{description}</p>}
          {items.length > 0 && (
            <div className="workflow-quick-panel-list">
              {items.map((item, index) => (
                <div className="workflow-quick-panel-item" key={`${item.title || item}-${index}`}>
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  <div>
                    <span>{item.title || item}</span>
                    {item.description && <small>{item.description}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="workflow-drawer-actions">
          {secondaryAction && (
            <button className="btn-secondary" type="button" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
          <button className="btn-primary" type="button" onClick={primaryAction?.onClick || onClose}>
            {primaryAction?.label || '확인'} <ArrowRight size={15} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default WorkflowQuickPanel;
