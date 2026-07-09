/* eslint-disable react/prop-types */
import { Check, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';

const WorkflowStepper = ({
  stages = [],
  currentStage,
  onStageClick,
  onPrev,
  onNext,
  subtasks = [],
  activeSubtaskStage,
  onSubtaskClick,
}) => {
  const getTone = (stage) => {
    if (stage.status === 'done') return 'done';
    if (Number(stage.stage) === Number(currentStage)) return 'current';
    return 'locked';
  };

  const hasSubtasks = subtasks.length > 1;

  return (
    <section className="workflow-stepper topology-mode" aria-label="구축 단계">
      <button className="workflow-arrow" type="button" aria-label="이전 단계" onClick={onPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-sub)', padding: '4px', flexShrink: 0 }}>
        <ChevronLeft size={18} />
      </button>
      {stages.map((stage, idx) => {
        const tone = getTone(stage);
        const isActivePhase = Number(stage.stage) === Number(currentStage);
        const showBranch = isActivePhase && hasSubtasks;

        return (
          <span
            key={stage.stage}
            className={`topology-node-wrapper ${showBranch ? 'has-branch' : ''}`}
          >
            <div
              className={`workflow-stepper-step ${tone}`}
              onClick={() => stage.can_enter && onStageClick?.(stage)}
              style={{ opacity: stage.can_enter ? 1 : 0.55 }}
              title={stage.locked_reason || stage.name}
            >
              <span className="step-number">
                {tone === 'done' ? <Check size={14} /> : tone === 'locked' ? <LockKeyhole size={12} /> : stage.stage}
              </span>
              <span className="step-label">{stage.name}</span>

              {/* Topology Branch: step 내부에 배치하여 position:relative 기준으로 동작 */}
              {showBranch && (
                <div className="topology-branch-group" aria-label="하위 작업 분기">
                  <div className="topology-trunk" />
                  <div className="topology-sub-nodes">
                    {subtasks.map((child) => {
                      const sub = child.subtask || {};
                      const isActive = Number(child.stage) === Number(activeSubtaskStage);
                      const statusLabel = child.status === 'done'
                        ? '✓ 완료'
                        : isActive
                          ? '● 진행중'
                          : '○ 대기';
                      return (
                        <button
                          key={child.stage}
                          type="button"
                          className={`topology-sub-node ${isActive ? 'active' : ''} ${child.status || 'waiting'}`}
                          onClick={(e) => { e.stopPropagation(); onSubtaskClick?.(child); }}
                          title={sub.description}
                        >
                          <span className="topology-sub-level">{sub.level}</span>
                          <span className="topology-sub-title">{sub.title}</span>
                          <span className={`topology-sub-status ${child.status === 'done' ? 'done' : isActive ? 'active' : ''}`}>
                            {statusLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {idx < stages.length - 1 && (
              <span className={`workflow-stepper-connector ${stage.status === 'done' ? 'done' : ''}`} />
            )}
          </span>
        );
      })}
      <button className="workflow-arrow" type="button" aria-label="다음 단계" onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-sub)', padding: '4px', flexShrink: 0 }}>
        <ChevronRight size={18} />
      </button>
    </section>
  );
};

export default WorkflowStepper;
