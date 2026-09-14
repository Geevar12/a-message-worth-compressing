export interface SceneAnimation {
  readonly finish: () => void;
  readonly cancel: () => void;
}

/**
 * Owns the complete lifetime of one scene. Completion is idempotent, and
 * cancellation never calls the completion callback.
 */
export function animateScene(
  element: HTMLElement,
  durationMs: number,
  onComplete: () => void,
): SceneAnimation {
  let completed = false;
  let timerId: number | undefined;
  let exitTimerId: number | undefined;
  let enterAnimation: Animation | undefined;
  let exitAnimation: Animation | undefined;

  const clearTimers = () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerId = undefined;
    }

    if (exitTimerId !== undefined) {
      window.clearTimeout(exitTimerId);
      exitTimerId = undefined;
    }
  };

  const cleanup = () => {
    clearTimers();
    enterAnimation?.cancel();
    exitAnimation?.cancel();
    enterAnimation = undefined;
    exitAnimation = undefined;
  };

  const finish = () => {
    if (completed) return;

    completed = true;
    cleanup();
    element.classList.remove('is-entering', 'is-exiting');
    element.classList.add('is-settled');
    onComplete();
  };

  const cancel = () => {
    if (completed) return;

    completed = true;
    cleanup();
    element.classList.remove('is-entering', 'is-exiting');
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (durationMs <= 0 || reducedMotion) {
    timerId = window.setTimeout(finish, 0);
    return { finish, cancel };
  }

  element.classList.add('is-entering');

  if (typeof element.animate === 'function') {
    enterAnimation = element.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 900,
        easing: 'cubic-bezier(.22,.8,.2,1)',
        fill: 'forwards',
      },
    );
  }

  const exitDuration = 900;
  const exitStart = Math.max(0, durationMs - exitDuration);

  timerId = window.setTimeout(() => {
    if (completed) return;

    element.classList.add('is-exiting');

    if (typeof element.animate === 'function') {
      exitAnimation = element.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-8px)' },
        ],
        {
          duration: exitDuration,
          easing: 'cubic-bezier(.4,0,1,1)',
          fill: 'forwards',
        },
      );
    }

    exitTimerId = window.setTimeout(finish, exitDuration + 10);
  }, exitStart);

  return { finish, cancel };
}
