import { describe, expect, it, vi } from 'vitest';
import { ExperienceController, type SceneAnimationFactory } from '../src/experience/controller';
import type { ExperienceState } from '../src/experience/state-machine';
import type { SceneAnimation } from '../src/visualization/animations';

interface FakeAnimation extends SceneAnimation {
  complete: () => void;
  cancelled: boolean;
}

function createHarness() {
  const renderedStates: ExperienceState[] = [];
  const animations: FakeAnimation[] = [];
  const renderer = {
    render: vi.fn((state: ExperienceState) => {
      renderedStates.push(state);
      return {} as HTMLElement;
    }),
  };

  const animationFactory: SceneAnimationFactory = {
    create: vi.fn((_element, _durationMs, onComplete) => {
      const animation: FakeAnimation = {
        cancelled: false,
        complete: onComplete,
        finish: vi.fn(),
        cancel: vi.fn(() => {
          animation.cancelled = true;
        }),
      };
      animations.push(animation);
      return animation;
    }),
  };

  const controller = new ExperienceController(renderer, undefined, animationFactory);
  controller.start();

  return { controller, renderedStates, animations, renderer, animationFactory };
}

describe('ExperienceController', () => {
  it('renders and completes the entire sequence through animation completion', () => {
    const { controller, renderedStates, animations } = createHarness();

    expect(renderedStates).toEqual(['INTRO']);

    const expected: ExperienceState[] = [
      'GIFT_COMPRESSION',
      'SSR_MEMORY',
      'CONNECTION',
      'REVEAL',
      'BIRTHDAY',
    ];

    for (const state of expected) {
      expect(controller.advance()).toBe(true);
      expect(controller.machine.state).toBe(state);
      const currentAnimation = animations.at(-1);
      currentAnimation?.complete();
    }

    expect(controller.machine.state).toBe('COMPLETE');
    expect(renderedStates).toEqual([
      'INTRO',
      'GIFT_COMPRESSION',
      'SSR_MEMORY',
      'CONNECTION',
      'REVEAL',
      'BIRTHDAY',
      'COMPLETE',
    ]);
  });

  it('ignores a stale completion after an interruption', () => {
    const { controller, animations } = createHarness();

    controller.advance();
    const interrupted = animations[0];

    controller.reset();

    expect(interrupted.cancelled).toBe(true);
    expect(controller.machine.state).toBe('INTRO');

    interrupted.complete();

    expect(controller.machine.state).toBe('INTRO');
  });

  it('cancels the active scene before rendering the reset state', () => {
    const { controller, animations, renderedStates } = createHarness();

    controller.advance();
    const active = animations[0];

    controller.reset();

    expect(active.cancelled).toBe(true);
    expect(renderedStates.at(-1)).toBe('INTRO');
  });

  it('prevents duplicate completion from advancing twice', () => {
    const { controller, animations } = createHarness();

    controller.advance();
    const active = animations[0];

    active.complete();
    active.complete();

    expect(controller.machine.state).toBe('SSR_MEMORY');
    expect(animations).toHaveLength(2);
  });

  it('does not start another animation for the birthday or complete states', () => {
    const { controller, animations } = createHarness();

    controller.advance();
    animations[0].complete();
    animations[1].complete();
    animations[2].complete();
    animations[3].complete();

    expect(controller.machine.state).toBe('BIRTHDAY');
    expect(animations).toHaveLength(4);

    controller.advance();
    expect(controller.machine.state).toBe('COMPLETE');
    expect(animations).toHaveLength(4);
  });

  it('ignores controller actions after destroy', () => {
    const { controller, animations } = createHarness();

    controller.advance();
    controller.destroy();

    expect(animations[0].cancelled).toBe(true);
    expect(controller.advance()).toBe(false);
    expect(controller.machine.state).toBe('GIFT_COMPRESSION');
  });
});
