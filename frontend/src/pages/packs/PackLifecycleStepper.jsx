import { PACK_LIFECYCLE_STEPS } from './packLifecycleModel';

const PackLifecycleStepper = ({ currentStepId, completedStepIds = [], onStepSelect }) => (
  <section className="pack-lifecycle-stepper-card" aria-label="Pack Lifecycle Workflow">
    <div className="pack-lifecycle-stepper">
      {PACK_LIFECYCLE_STEPS.map((step, index) => {
        const isCurrent = step.id === currentStepId;
        const isDone = completedStepIds.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            className={`pack-lifecycle-step ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
            onClick={() => onStepSelect?.(step)}
          >
            <span className="pack-lifecycle-step-number">{index + 1}</span>
            <strong>{step.label}</strong>
            <small>{step.description}</small>
          </button>
        );
      })}
    </div>
  </section>
);

export default PackLifecycleStepper;
