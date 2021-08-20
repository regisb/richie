import React from 'react';
import { act, getAllByRole, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useStepManager } from 'hooks/useStepManager';
import { StepBreadcrumb } from '.';

describe('StepBreadcrumb', () => {
  it('renders visually a minimal manifest', () => {
    // If manifest's steps does not have `label` and `icon` property,
    // only a breadcrumb with the step index is displayed.
    const manifest = {
      start: 'step0',
      steps: {
        step0: {
          next: 'step1',
        },
        step1: {
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container, rerender } = render(
      <StepBreadcrumb manifest={manifest} step={result.current.step} />,
    );

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const labels = container.querySelectorAll('h6.StepBreadcrumb__step__label');
    const stepsIcons = container.querySelectorAll('div.StepBreadcrumb__step__icon > *');
    let activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    let currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(labels).toHaveLength(0);
    expect(stepsIcons).toHaveLength(2);
    stepsIcons.forEach((icon, index) => {
      expect(icon).toBeInstanceOf(HTMLSpanElement);
      expect(icon).toHaveTextContent((index + 1).toString());
    });
    expect(activeSteps).toHaveLength(1);
    expect(currentStep).toHaveTextContent('1');

    act(() => result.current.next());
    rerender(<StepBreadcrumb manifest={manifest} step={result.current.step} />);

    activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    currentStep = container.querySelector('li.StepBreadcrumb__step.StepBreadcrumb__step--current');
    expect(activeSteps).toHaveLength(2);
    expect(currentStep).toHaveTextContent('2');
  });

  it('renders visually a complete manifest', () => {
    // If manifest's steps has `label` and `icon` property,
    // these information are shown.
    const manifest = {
      start: 'step0',
      steps: {
        step0: {
          label: '0. Step',
          icon: '#icon-0',
          next: 'step1',
        },
        step1: {
          label: '1. Step',
          icon: '#icon-1',
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container, rerender } = render(
      <StepBreadcrumb manifest={manifest} step={result.current.step} />,
    );

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const labels = container.querySelectorAll('h6.StepBreadcrumb__step__label');
    const stepsIcons = container.querySelectorAll('div.StepBreadcrumb__step__icon > *');
    let activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    let currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(labels).toHaveLength(2);
    labels.forEach((label, index) => {
      expect(label).toHaveTextContent(`${index}. Step`);
    });

    expect(stepsIcons).toHaveLength(2);
    stepsIcons.forEach((icon, index) => {
      expect(icon.firstChild).toBeInstanceOf(SVGElement);
      expect(icon.firstChild).toHaveAttribute('href', `#icon-${index}`);
    });
    expect(activeSteps).toHaveLength(1);
    expect(currentStep).toHaveTextContent('0. Step');

    act(() => result.current.next());
    rerender(<StepBreadcrumb manifest={manifest} step={result.current.step} />);

    activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    currentStep = container.querySelector('li.StepBreadcrumb__step.StepBreadcrumb__step--current');
    expect(activeSteps).toHaveLength(2);
    expect(currentStep).toHaveTextContent('1. Step');
  });

  it('sorts manifest steps to guarantee the display order of steps', () => {
    const manifest = {
      start: 'step1',
      steps: {
        step0: {
          next: null,
        },
        step1: {
          next: 'step0',
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container } = render(<StepBreadcrumb manifest={manifest} step={result.current.step} />);

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    const currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(activeSteps).toHaveLength(1);
    expect(currentStep).toHaveTextContent('1');
  });

  it('displays all active steps on mount if manifest does not start to the first step', () => {
    const manifest = {
      start: 'step1',
      steps: {
        step0: {
          next: 'step1',
        },
        step1: {
          next: null,
        },
      },
    };

    const { result } = renderHook(() => useStepManager(manifest));
    const { container } = render(<StepBreadcrumb manifest={manifest} step={result.current.step} />);

    expect(getAllByRole(container, 'listitem')).toHaveLength(2);

    const activeSteps = container.querySelectorAll(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--active',
    );
    const currentStep = container.querySelector(
      'li.StepBreadcrumb__step.StepBreadcrumb__step--current',
    );
    expect(activeSteps).toHaveLength(2);
    expect(currentStep).toHaveTextContent('2');
  });
});
