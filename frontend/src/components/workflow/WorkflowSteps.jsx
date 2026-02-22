import React from 'react';
import { ProgressIndicator, ProgressStep } from '@carbon/react';
import { useDocument } from '../../contexts';
import { WORKFLOW_STEP_CONFIG } from '../../constants/editorConstants';

function WorkflowSteps() {
  const { currentStep, completedSteps, setStep } = useDocument();

  const steps = Object.entries(WORKFLOW_STEP_CONFIG);
  const currentIndex = steps.findIndex(([key]) => key === currentStep);

  return (
    <div className="workflow-steps">
      <ProgressIndicator currentIndex={currentIndex} spaceEqually>
        {steps.map(([key, config], index) => {
          const isComplete = completedSteps.includes(key) || index < currentIndex;
          const isCurrent = key === currentStep;

          return (
            <ProgressStep
              key={key}
              label={config.label}
              description={config.description}
              complete={isComplete}
              current={isCurrent}
              onClick={() => isComplete && setStep(key)}
              disabled={!isComplete && !isCurrent}
            />
          );
        })}
      </ProgressIndicator>
    </div>
  );
}

export default WorkflowSteps;
