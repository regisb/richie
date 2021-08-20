import { useEffect, useMemo, useState } from 'react';
import { Nullable } from 'types/utils';

export interface Step {
  icon?: string;
  label?: string;
  next: Nullable<string>;
  onEnter?: Function;
  onExit?: Function;
}

export interface Manifest {
  start: string;
  steps: {
    [key: string]: Step;
  };
}

/**
 * A hook to manage step process.
 * It takes a manifest which describes each steps and how each of them
 * are related.
 * Callbacks `onEnter` and `onExit` can be define to trigger function
 * when a step starts or terminates.
 *
 * Process terminates when step is null
 */
export const useStepManager = (manifest: Manifest) => {
  const [step, setStep] = useState<Nullable<string>>(manifest.start);
  const state = useMemo(() => (step ? manifest.steps[step] : null), [step]);

  const next = () => {
    if (step !== null) {
      const nextStep = manifest.steps[step]?.next;
      setStep(nextStep);
    }
  };

  useEffect(() => {
    if (state?.onEnter) state.onEnter();

    return () => {
      if (state?.onExit) state.onExit();
    };
  }, [state]);

  const reset = () => {
    setStep(manifest.start);
  };

  return { step, next, reset };
};
