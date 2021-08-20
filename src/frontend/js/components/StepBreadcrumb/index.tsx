// StepBreadcrumb has been created to work in pair with useStepManager hook.
// Within a step process, it aims to guide the user to know where he/she is in
// the current process by translating visually the steps manifest.

import React from 'react';
import { Nullable } from 'types/utils';
import { Manifest, Step } from 'hooks/useStepManager';

interface Props {
  manifest: Manifest;
  step: Nullable<string>;
}

type FlattenStep = [string, Step];

/**
 * Retrieve the index of the active step.
 * When step is null, we know that process is terminated so we have to return
 * the last step index.
 * @param manifest
 * @param step
 * @returns {number} active step index
 */
function getActiveStepIndex(steps: FlattenStep[], step: Props['step']) {
  if (step === null) {
    return steps.length;
  }
  return steps.findIndex((s) => s[0] === step);
}

/**
 * The first step of the manifest could be defined as the only step which is
 * never present in `next` property of another step.
 * So this method searches which step is not used by another step.
 * @param {Manifest} manifest
 * @returns {Manifest.step} step
 */
function findFirstStep(manifest: Manifest) {
  const steps = Object.keys(manifest.steps);
  const nexts = Object.values(manifest.steps).map(({ next }) => next);

  const firstStep = steps.find((step) => !nexts.includes(step));
  return firstStep!;
}

/**
 * As object properties order is not guaranted, we have to sort steps to ensure
 * that they are displayed in the right order.
 *
 * // MARK When IE 11 supports will be dropped, we can use a `Map`
 * to define `manifest.steps` then remove this sort function
 */
function sortSteps(manifest: Manifest) {
  const steps: FlattenStep[] = [];
  let step: Props['step'] = findFirstStep(manifest);

  while (step !== null) {
    steps.push([step, manifest.steps[step]]);
    step = manifest.steps[step].next;
  }

  return steps;
}

export const StepBreadcrumb = ({ step, manifest }: Props) => {
  const orderedSteps = sortSteps(manifest);
  const activeIndex = getActiveStepIndex(orderedSteps, step);

  return (
    <ol className="StepBreadcrumb">
      {orderedSteps.map(([key, entry], index) => (
        <React.Fragment key={`step-breadcrumb-key-${key}`}>
          <li
            aria-current={index === activeIndex ? 'step' : 'false'}
            className={`StepBreadcrumb__step
              ${index <= activeIndex ? 'StepBreadcrumb__step--active' : ''}
              ${index === activeIndex ? 'StepBreadcrumb__step--current' : ''}
            `}
          >
            <div className="StepBreadcrumb__step__icon">
              {entry.icon ? (
                <svg role="img">
                  <use href={entry.icon} />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {entry.label ? <h6 className="StepBreadcrumb__step__label">{entry.label}</h6> : null}
          </li>
          {entry.next !== null ? (
            <li
              aria-hidden={true}
              className={`StepBreadcrumb__separator ${
                index < activeIndex ? 'StepBreadcrumb__separator--active' : ''
              }`}
            />
          ) : null}
        </React.Fragment>
      ))}
    </ol>
  );
};
