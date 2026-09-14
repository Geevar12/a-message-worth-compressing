import { ExperienceStateMachine, type ExperienceState } from './state-machine';
import { sceneFor } from './scenes';
import { animateScene, type SceneAnimation } from '../visualization/animations';

export interface ExperienceRenderer {
  render: (state: ExperienceState) => HTMLElement | null;
}

export interface SceneAnimationFactory {
  create: (
    element: HTMLElement,
    durationMs: number,
    onComplete: () => void,
  ) => SceneAnimation;
}

const defaultAnimationFactory: SceneAnimationFactory = {
  create: animateScene,
};

/**
 * Coordinates the linear story, scene rendering, and the lifetime of the
 * active animation. The machine remains the source of truth for state.
 */
export class ExperienceController {
  readonly machine: ExperienceStateMachine;

  private readonly renderer: ExperienceRenderer;
  private readonly animationFactory: SceneAnimationFactory;
  private activeAnimation: SceneAnimation | undefined;
  private started = false;
  private destroyed = false;

  constructor(
    renderer: ExperienceRenderer,
    machine = new ExperienceStateMachine(),
    animationFactory = defaultAnimationFactory,
  ) {
    this.renderer = renderer;
    this.machine = machine;
    this.animationFactory = animationFactory;
  }

  start(): void {
    if (this.started || this.destroyed) return;

    this.started = true;
    this.machine.subscribe((state) => this.renderState(state));
  }

  advance(): boolean {
    if (!this.started || this.destroyed) return false;
    return this.machine.advance();
  }

  reset(): void {
    if (this.destroyed) return;

    this.activeAnimation?.cancel();
    this.activeAnimation = undefined;
    this.machine.reset();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.activeAnimation?.cancel();
    this.activeAnimation = undefined;
  }

  private renderState(state: ExperienceState): void {
    this.activeAnimation?.cancel();
    this.activeAnimation = undefined;

    const element = this.renderer.render(state);
    if (!element) return;

    const durationMs = sceneFor(state).durationMs;
    if (durationMs <= 0 || state === 'COMPLETE') return;

    let animation: SceneAnimation | undefined;
    animation = this.animationFactory.create(element, durationMs, () => {
      // A stale animation can finish after reset/cancellation in a browser
      // implementation. Only the currently-owned animation may advance.
      if (this.activeAnimation !== animation || this.destroyed) return;
      this.activeAnimation = undefined;
      this.machine.advance();
    });

    this.activeAnimation = animation;
  }
}
