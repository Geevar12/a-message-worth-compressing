export const EXPERIENCE_STATES = [
  'INTRO',
  'GIFT_COMPRESSION',
  'SSR_MEMORY',
  'CONNECTION',
  'REVEAL',
  'BIRTHDAY',
  'COMPLETE',
] as const;

export type ExperienceState = (typeof EXPERIENCE_STATES)[number];

type Listener = (state: ExperienceState, previousState: ExperienceState | null) => void;

const NEXT_STATE: Readonly<Record<Exclude<ExperienceState, 'COMPLETE'>, ExperienceState>> = {
  INTRO: 'GIFT_COMPRESSION',
  GIFT_COMPRESSION: 'SSR_MEMORY',
  SSR_MEMORY: 'CONNECTION',
  CONNECTION: 'REVEAL',
  REVEAL: 'BIRTHDAY',
  BIRTHDAY: 'COMPLETE',
};

/**
 * Small, deliberately linear state machine for the recipient-facing experience.
 * Invalid transitions are rejected rather than silently changing the story.
 */
export class ExperienceStateMachine {
  private currentState: ExperienceState = 'INTRO';
  private readonly listeners = new Set<Listener>();

  get state(): ExperienceState {
    return this.currentState;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentState, null);

    return () => {
      this.listeners.delete(listener);
    };
  }

  advance(): boolean {
    if (this.currentState === 'COMPLETE') {
      return false;
    }

    return this.transitionTo(NEXT_STATE[this.currentState]);
  }

  transitionTo(nextState: ExperienceState): boolean {
    if (nextState === this.currentState) {
      return false;
    }

    if (nextState !== NEXT_STATE[this.currentState as Exclude<ExperienceState, 'COMPLETE'>]) {
      return false;
    }

    const previousState = this.currentState;
    this.currentState = nextState;

    for (const listener of this.listeners) {
      listener(nextState, previousState);
    }

    return true;
  }

  reset(): void {
    if (this.currentState === 'INTRO') {
      return;
    }

    const previousState = this.currentState;
    this.currentState = 'INTRO';

    for (const listener of this.listeners) {
      listener('INTRO', previousState);
    }
  }
}
