/* eslint-disable react/prop-types */
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, LockKeyhole } from 'lucide-react';

const statusLabel = {
  done: '완료',
  in_progress: '진행 중',
  locked: '대기',
  waiting: '대기',
  warning: '확인 필요',
};

const statusIcon = {
  done: CheckCircle2,
  in_progress: CircleDashed,
  warning: CircleDashed,
  waiting: CircleDashed,
  locked: LockKeyhole,
};

const WorkflowStepper = ({ stages = [], currentStage, onStageClick, onPrev, onNext }) => (
  <section className="workflow-stepper workflow-progress-rail" aria-label="구축 단계">
    <button className="workflow-arrow" type="button" aria-label="이전 단계" onClick={onPrev}>
      <ChevronLeft size={18} />
    </button>
    <div className="workflow-track">
      {stages.map((stage) => {
        const Icon = statusIcon[stage.status] || CircleDashed;
        const isCurrent = Number(stage.stage) === Number(currentStage);

        return (
          <button
            key={stage.stage}
            type="button"
            className={`workflow-stage-card ${stage.status || 'locked'} ${isCurrent ? 'current' : ''}`}
            onClick={() => stage.can_enter && onStageClick?.(stage)}
            disabled={!stage.can_enter}
            title={stage.locked_reason || stage.name}
          >
            <span className="workflow-stage-icon" aria-hidden="true"><Icon size={15} /></span>
            <span className="workflow-stage-copy">
              <span className="workflow-stage-no">{String(stage.stage).padStart(2, '0')}</span>
              <strong>{stage.name}</strong>
              <small>{statusLabel[stage.status] || stage.status || '대기'}</small>
            </span>
          </button>
        );
      })}
    </div>
    <button className="workflow-arrow" type="button" aria-label="다음 단계" onClick={onNext}>
      <ChevronRight size={18} />
    </button>
  </section>
);

export default WorkflowStepper;
