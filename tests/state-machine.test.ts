import { describe, expect, it, vi } from 'vitest';
import { ExperienceStateMachine } from '../src/experience/state-machine';

describe('ExperienceStateMachine', () => {
  it('starts at INTRO', () => {
    const machine = new ExperienceStateMachine();

    expect(machine.state).toBe('INTRO');
  });

  it('advances through the exact locked linear sequence', () => {
    const machine = new ExperienceStateMachine();
    const states: string[] = [];

    machine.subscribe((state) => states.push(state));

    while (machine.advance()) {
      // Advance until COMPLETE.
    }

    expect(states).toEqual([
      'INTRO',
      'GIFT_COMPRESSION',
      'SSR_MEMORY',
      'CONNECTION',
      'REVEAL',
      'BIRTHDAY',
      'COMPLETE',
    ]);
    expect(machine.state).toBe('COMPLETE');
  });

  it('cannot skip ahead or move backwards', () => {
    const machine = new ExperienceStateMachine();

    expect(machine.transitionTo('SSR_MEMORY')).toBe(false);
    expect(machine.state).toBe('INTRO');

    expect(machine.advance()).toBe(true);
    expect(machine.transitionTo('INTRO')).toBe(false);
    expect(machine.state).toBe('GIFT_COMPRESSION');
  });

  it('is safe against repeated calls after completion', () => {
    const machine = new ExperienceStateMachine();

    for (let index = 0; index < 10; index += 1) {
      machine.advance();
    }

    expect(machine.state).toBe('COMPLETE');
    expect(machine.advance()).toBe(false);
  });

  it('notifies listeners with previous and next states', () => {
    const machine = new ExperienceStateMachine();
    const listener = vi.fn();

    machine.subscribe(listener);
    listener.mockClear();

    machine.advance();

    expect(listener).toHaveBeenCalledWith('GIFT_COMPRESSION', 'INTRO');
  });

  it('allows listeners to unsubscribe', () => {
    const machine = new ExperienceStateMachine();
    const listener = vi.fn();
    const unsubscribe = machine.subscribe(listener);

    listener.mockClear();
    unsubscribe();
    machine.advance();

    expect(listener).not.toHaveBeenCalled();
  });

  it('resets cleanly to the opening state', () => {
    const machine = new ExperienceStateMachine();

    machine.advance();
    machine.advance();
    machine.reset();

    expect(machine.state).toBe('INTRO');
  });
});
