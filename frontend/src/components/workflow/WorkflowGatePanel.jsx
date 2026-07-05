/* eslint-disable react/prop-types */
import { AlertCircle, CheckCircle2, CircleDashed } from 'lucide-react';

const checkTone = {
  done: { label: '완료', className: 'active', icon: CheckCircle2 },
  pass: { label: 'PASS', className: 'active', icon: CheckCircle2 },
  warning: { label: '확인 필요', className: 'warning', icon: AlertCircle },
  failed: { label: '실패', className: 'error', icon: AlertCircle },
  blocked: { label: '차단', className: 'error', icon: AlertCircle },
  pending: { label: '대기', className: 'inactive', icon: CircleDashed },
};

const isCompletedCheck = (status) => ['done', 'pass', 'completed', 'success', 'active'].includes(status);

const WorkflowGatePanel = ({ stage, checks = [], emptyText = '아직 확인 조건이 없습니다.' }) => {
  const completedCount = checks.filter((check) => isCompletedCheck(check.status)).length;

  return (
    <section className="workflow-gate-panel workflow-gate-rail" aria-label="완료 조건 요약">
      <div className="workflow-section-title">
        <span>완료 조건</span>
        {stage?.locked_reason && <small>{stage.locked_reason}</small>}
      </div>

      <div className="workflow-gate-summary-count">
        <strong>{completedCount}/{checks.length}</strong>
        <small>완료</small>
      </div>

      {checks.length === 0 ? (
        <div className="workflow-empty-state compact">{emptyText}</div>
      ) : (
        <div className="workflow-gate-list">
          {checks.map((check) => {
            const tone = checkTone[check.status] || checkTone.pending;
            const Icon = tone.icon;

            return (
              <div className="workflow-gate-item" key={check.key || check.label}>
                <div className="workflow-gate-copy">
                  <Icon size={16} aria-hidden="true" />
                  <span>{check.label || check.key}</span>
                </div>
                <div className="workflow-gate-meta">
                  {Number.isFinite(Number(check.count)) && <strong>{check.count}</strong>}
                  <span className={`badge ${tone.className}`}>{tone.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default WorkflowGatePanel;
