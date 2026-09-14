import { describe, expect, it } from 'vitest';
import { SCENES, sceneFor } from '../src/experience/scenes';
import { COMPRESSION_FOCUS_REGIONS } from '../src/experience/motion';
import { EXPERIENCE_STATES } from '../src/experience/state-machine';

describe('scene pacing', () => {
  it('keeps the recipient-facing sequence in the locked order', () => {
    expect(SCENES.map((scene) => scene.state)).toEqual(EXPERIENCE_STATES);
  });

  it('gives the compression scene enough time for the tree to build and settle', () => {
    expect(sceneFor('GIFT_COMPRESSION').durationMs).toBe(49_000);
  });

  it('keeps the pre-birthday sequence long enough for the intended unhurried experience', () => {
    const timedScenes = SCENES.filter((scene) => scene.durationMs > 0);
    const totalMilliseconds = timedScenes.reduce(
      (total, scene) => total + scene.durationMs,
      0,
    );

    expect(totalMilliseconds).toBe(80_500);
    expect(totalMilliseconds).toBeGreaterThan(75_000);
  });

  it('keeps guided-focus regions sequential with breathing room between stages', () => {
    for (let index = 1; index < COMPRESSION_FOCUS_REGIONS.length; index += 1) {
      const previous = COMPRESSION_FOCUS_REGIONS[index - 1];
      const current = COMPRESSION_FOCUS_REGIONS[index];

      expect(current.startMs).toBeGreaterThan(previous.endMs);
    }
  });

  it('keeps the birthday scene open for the recipient to read', () => {
    expect(sceneFor('BIRTHDAY').durationMs).toBe(0);
  });
});
