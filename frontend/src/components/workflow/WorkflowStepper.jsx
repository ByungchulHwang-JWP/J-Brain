/* eslint-disable react/prop-types */
import { Check, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';

const WorkflowStepper = ({ stages = [], currentStage, onStageClick, onPrev, onNext }) => {
  const getTone = (stage) => {
    if (stage.status === 'done') return 'done';
    if (Number(stage.stage) === Number(currentStage)) return 'current';
    return 'locked';
  };

  return (
    <section className="workflow-stepper" aria-label="구축 단계">
      <button className="workflow-arrow" type="button" aria-label="이전 단계" onClick={onPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-sub)', padding: '4px', flexShrink: 0 }}>
        <ChevronLeft size={18} />
      </button>
      {stages.map((stage, idx) => {
        const tone = getTone(stage);
        return (
          <span key={stage.stage} style={{ display: 'contents' }}>
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
