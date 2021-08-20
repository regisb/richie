import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Manifest, useStepManager } from '.';

describe('useStepManager', () => {
  it('reads the manifest', () => {
    const manifest: Manifest = {
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

    // - step 0
    expect(result.current.step).toEqual('step0');

    // - step 1
    act(() => result.current.next());
    expect(result.current.step).toEqual('step1');

    // - terminated state
    act(() => result.current.next());
    expect(result.current.step).toEqual(null);

    // As state is terminated, trigger once again next should do nothing
    act(() => result.current.next());
    expect(result.current.step).toEqual(null);
  });

  it('is able to reset the step process', () => {
    const manifest: Manifest = {
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

    // - step 0
    expect(result.current.step).toEqual('step0');

    // - step 1
    act(() => result.current.next());
    expect(result.current.step).toEqual('step1');

    // - Reset: should go back to step0
    act(() => result.current.reset());
    expect(result.current.step).toEqual('step0');
  });

  it('triggers onEnter and onExit hooks on step transition', () => {
    const manifest: Manifest = {
      start: 'step0',
      steps: {
        step0: {
          next: 'step1',
          onEnter: jest.fn(),
          onExit: jest.fn(),
        },
        step1: {
          next: null,
          onEnter: jest.fn(),
          onExit: jest.fn(),
        },
      },
    };
    const { result } = renderHook(() => useStepManager(manifest));

    // - step 0
    expect(result.current.step).toEqual('step0');
    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step0.onExit).not.toHaveBeenCalled();
    expect(manifest.steps.step1.onEnter).not.toHaveBeenCalled();
    expect(manifest.steps.step1.onExit).not.toHaveBeenCalled();

    // - step 1
    act(() => result.current.next());

    expect(result.current.step).toEqual('step1');
    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onExit).not.toHaveBeenCalled();

    // - terminated state
    act(() => result.current.next());

    expect(result.current.step).toEqual(null);
    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(1);

    // - Reset: go back to step0
    act(() => result.current.reset());

    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(1);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(1);

    // - step 1
    act(() => result.current.next());

    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(1);

    // - Reset: go back to step0
    act(() => result.current.reset());

    expect(manifest.steps.step0.onEnter).toHaveBeenCalledTimes(3);
    expect(manifest.steps.step0.onExit).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onEnter).toHaveBeenCalledTimes(2);
    expect(manifest.steps.step1.onExit).toHaveBeenCalledTimes(2);
  });
});
