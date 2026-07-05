/* eslint-disable react/prop-types */
import { AlertTriangle, CheckCircle2, Clock3, TrendingUp } from 'lucide-react';

const iconMap = {
  progress: TrendingUp,
  done: CheckCircle2,
  warning: AlertTriangle,
  waiting: Clock3,
};

const WorkflowKpiCard = ({ label, value, sub, tone = 'progress', icon }) => {
  const Icon = icon || iconMap[tone] || TrendingUp;

  return (
    <section className={`workflow-kpi-card ${tone}`}>
      <div className="workflow-kpi-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div>
        <div className="workflow-kpi-label">{label}</div>
        <div className="workflow-kpi-value">{value}</div>
        {sub && <div className="workflow-kpi-sub">{sub}</div>}
      </div>
    </section>
  );
};

export default WorkflowKpiCard;
