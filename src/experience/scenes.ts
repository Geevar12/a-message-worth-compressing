import type { ExperienceState } from './state-machine';

export interface SceneDefinition {
  readonly state: ExperienceState;
  readonly durationMs: number;
  readonly title: string;
  readonly eyebrow?: string;
}

/**
 * Deliberately unhurried timings. The technical scenes are given enough time
 * for a teacher familiar with the subject to actually watch the process.
 */
export const SCENES: readonly SceneDefinition[] = [
  {
    state: 'INTRO',
    durationMs: 0,
    title: 'A Message Worth Compressing',
    eyebrow: 'For someone who taught me and guided me.',
  },
  {
    state: 'GIFT_COMPRESSION',
    durationMs: 49_000,
    title: 'Data Compression',
    eyebrow: 'A message → frequencies → Huffman → bits → reconstruction',
  },
  {
    state: 'SSR_MEMORY',
    durationMs: 18_000,
    title: 'Silent Speech Recognition',
    eyebrow: 'A project I still remember.',
  },
  {
    state: 'CONNECTION',
    durationMs: 7_000,
    title: 'Two things from college that I still remember.',
  },
  {
    state: 'REVEAL',
    durationMs: 6_500,
    title: 'Nothing was lost.',
  },
  {
    state: 'BIRTHDAY',
    durationMs: 0,
    title: 'Happy Birthday, Ma’am!',
  },
  {
    state: 'COMPLETE',
    durationMs: 0,
    title: 'Complete',
  },
];

export const sceneFor = (state: ExperienceState): SceneDefinition =>
  SCENES.find((scene) => scene.state === state) ?? SCENES[0];
