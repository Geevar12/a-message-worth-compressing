import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { compressText } from './compression/huffman';
import type { HuffmanNode } from './compression/huffman';
import { calculateMetrics } from './compression/metrics';
import { buildFrequencyTable } from './compression/frequency';
import { ExperienceController } from './experience/controller';
import { BIRTHDAY_MESSAGE, GIFT_MESSAGE } from './experience/content';
import type { ExperienceState } from './experience/state-machine';
import { treeToSvg } from './visualization/huffman-tree';
import { COMPRESSION_FOCUS_REGIONS, COMPRESSION_MARKERS } from './experience/motion';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) throw new Error('Application root was not found.');

app.innerHTML = '<main class="experience" aria-live="polite"></main>';
const experienceElement = app.querySelector<HTMLElement>('.experience');
if (!experienceElement) throw new Error('Experience root was not created.');

const experience = experienceElement;
const controller = new ExperienceController({
  render: renderState,
});

controller.start();

function renderState(state: ExperienceState): HTMLElement | null {
  experience.dataset.state = state.toLowerCase();

  if (state === 'INTRO') {
    return renderIntro();
  }

  if (state === 'GIFT_COMPRESSION') {
    return renderCompression();
  }

  if (state === 'SSR_MEMORY') {
    return renderSsrMemory();
  }

  if (state === 'CONNECTION') {
    return renderConnection();
  }

  if (state === 'REVEAL') {
    return renderReveal();
  }

  if (state === 'BIRTHDAY') {
    return renderBirthday();
  }

  experience.innerHTML = '';
  return null;
}

function renderIntro(): HTMLElement {
  experience.innerHTML = `
    <section class="scene scene-intro">
      <p class="eyebrow">A small birthday gift</p>
      <h1>A Message<br />Worth Compressing</h1>
      <p class="intro-copy">For someone who taught me<br />and guided me.</p>
      <button class="open-button" type="button" aria-label="Open the birthday message">Open</button>
      <p class="signature-note">Made by one of your former students.</p>
    </section>
  `;

  const scene = experience.querySelector<HTMLElement>('.scene');
  const button = experience.querySelector<HTMLButtonElement>('.open-button');

  button?.addEventListener('click', () => {
    controller.advance();
  }, { once: true });

  if (!scene) throw new Error('Intro scene was not created.');
  return scene;
}

function focusStyle(id: string, startMs: number, endMs: number, scale: number): string {
  const region = COMPRESSION_FOCUS_REGIONS.find((candidate) => candidate.id === id);
  const start = region?.startMs ?? startMs;
  const end = region?.endMs ?? endMs;
  const focusScale = region?.scale ?? scale;

  return `--stage-start: ${start}ms; --stage-end: ${end}ms; --stage-duration: ${end - start}ms; --focus-scale: ${focusScale}`;
}

function renderCompression(): HTMLElement {
  const compressed = compressText(GIFT_MESSAGE);
  const metrics = calculateMetrics(
    compressed.originalBytes.length,
    compressed.bitstream.length,
  );

  const frequencies = [...buildFrequencyTable(compressed.originalBytes).entries()]
    .map(([byte, frequency]) => ({ byte, frequency }))
    .sort((left, right) => right.frequency - left.frequency || left.byte - right.byte);

  const mergeSteps = compressed.tree.merges ?? deriveMergeStepsFromTree(compressed.tree.root);

  const mergeRows = mergeSteps.map((merge, index) => `
    <div class="merge-step compression-detail" style="--step-delay: ${12200 + index * 430}ms">
      <span class="merge-index">${String(index + 1).padStart(2, '0')}</span>
      <span>${merge.leftFrequency} + ${merge.rightFrequency}</span>
      <span class="merge-equals">=</span>
      <strong>${merge.combinedFrequency}</strong>
    </div>
  `).join('');

  const frequencyRows = frequencies.map(({ byte, frequency }, index) => `
    <div class="frequency-cell compression-detail" style="--step-delay: ${6500 + index * 90}ms">
      <span>${formatByte(byte)}</span>
      <strong>${frequency}</strong>
    </div>
  `).join('');

  const codeRows = [...compressed.tree.codes.entries()]
    .sort(([byteA], [byteB]) => byteA - byteB)
    .map(([byte, code], index) => `
      <div class="code-cell compression-detail" style="--step-delay: ${28600 + index * 90}ms">
        <span>${formatByte(byte)}</span>
        <code>${code}</code>
      </div>
    `).join('');

  const markerMarkup = COMPRESSION_MARKERS.map((marker, index) => `
    <span class="motion-marker" style="--marker-delay: ${marker.atMs}ms">
      <span>${String(index + 1).padStart(2, '0')}</span>${marker.label}
    </span>
  `).join('');

  experience.innerHTML = `
    <section class="scene scene-compression">
      <p class="eyebrow compression-detail" style="--step-delay: 450ms">Data Compression</p>
      <h2 class="compression-heading compression-detail" style="--step-delay: 650ms">Let's keep a message,<br />without losing anything.</h2>

      <div class="motion-header" aria-hidden="true">
        <div class="motion-track">${markerMarkup}</div>
        <span class="motion-focus-label">guided focus</span>
      </div>

      <div class="compression-viewport">
        <div class="compression-stage stage-message" style="${focusStyle('message', 1100, 6000, 1.018)}">
          <div class="message-card compression-detail" style="--step-delay: 1450ms">
            <span class="stage-label">Original message</span>
            <p>“${escapeHtml(GIFT_MESSAGE)}”</p>
            <span class="stage-meta">${metrics.originalBytes} UTF-8 bytes</span>
          </div>
        </div>

        <div class="compression-stage stage-frequency" style="${focusStyle('frequency', 6250, 11500, 1.014)}">
          <div class="stage-heading compression-detail" style="--step-delay: 6500ms">
            <span class="stage-number">01</span>
            <div><strong>Count what occurs.</strong><span>Frequency of each byte</span></div>
          </div>
          <div class="frequency-grid">${frequencyRows}</div>
        </div>

        <div class="compression-stage stage-merge" style="${focusStyle('merge', 11750, 19750, 1.012)}">
          <div class="stage-heading compression-detail" style="--step-delay: 12050ms">
            <span class="stage-number">02</span>
            <div><strong>Combine the two least frequent.</strong><span>Repeat until one tree remains</span></div>
          </div>
          <div class="merge-list">${mergeRows}</div>
        </div>

        <div class="compression-stage stage-tree" style="${focusStyle('tree', 20000, 28000, 1.018)}">
          <div class="stage-heading compression-detail" style="--step-delay: 20300ms">
            <span class="stage-number">03</span>
            <div><strong>The Huffman tree emerges.</strong><span>0 to the left · 1 to the right</span></div>
          </div>
          <div class="tree-frame compression-detail" style="--step-delay: 20450ms">${treeToSvg(compressed.tree.root, 20500)}</div>
        </div>

        <div class="compression-stage stage-codes" style="${focusStyle('codes', 28250, 34250, 1.014)}">
          <div class="stage-heading compression-detail" style="--step-delay: 28500ms">
            <span class="stage-number">04</span>
            <div><strong>Each byte gets a prefix-free code.</strong><span>No code is the prefix of another</span></div>
          </div>
          <div class="code-grid">${codeRows}</div>
        </div>

        <div class="compression-stage stage-encode" style="${focusStyle('encode', 34500, 39750, 1.018)}">
          <div class="stage-heading compression-detail" style="--step-delay: 34700ms">
            <span class="stage-number">05</span>
            <div><strong>Now the message becomes bits.</strong><span>Encoded using the codes above</span></div>
          </div>
          <div class="bitstream-card compression-detail" style="--step-delay: 35300ms">
            <code>${escapeHtml(compressed.bitstream)}</code>
            <span>${metrics.bitLength} bits</span>
          </div>
        </div>

        <div class="compression-stage stage-reconstruct" style="${focusStyle('reconstruct', 40000, 47500, 1.022)}">
          <div class="reconstruction-track compression-detail" style="--step-delay: 40700ms">
            <span>bits</span><b>→</b><span>Huffman tree</span><b>→</b><span>original message</span>
          </div>
          <div class="verification compression-detail" style="--step-delay: 43500ms">${compressed.verified ? '✓ EXACT MATCH' : 'VERIFICATION FAILED'}</div>
          <p class="scene-caption compression-detail" style="--step-delay: 44200ms">Every original byte was reconstructed.</p>
        </div>
      </div>

      <p class="motion-note compression-detail" style="--step-delay: 45200ms">The motion slows where the idea matters, then moves on.</p>
    </section>
  `;

  const scene = experience.querySelector<HTMLElement>('.scene');
  if (!scene) throw new Error('Compression scene was not created.');
  return scene;
}

function renderSsrMemory(): HTMLElement {
  experience.innerHTML = `
    <section class="scene scene-memory">
      <p class="eyebrow ssr-detail" style="--step-delay: 500ms">Another project I remember</p>
      <h2 class="ssr-detail" style="--step-delay: 800ms">Silent Speech<br />Recognition</h2>
      <p class="memory-note ssr-detail" style="--step-delay: 1150ms">the SSR project we worked on</p>

      <div class="ssr-project-card">
        <div class="ssr-stage ssr-detail" style="--step-delay: 2000ms">
          <span class="ssr-number">01</span>
          <div><strong>Video input</strong><span>A sequence of silent mouth movements</span></div>
        </div>
        <div class="ssr-connector ssr-detail" style="--step-delay: 3000ms">↓</div>
        <div class="ssr-stage ssr-detail" style="--step-delay: 3700ms">
          <span class="ssr-number">02</span>
          <div><strong>Lip-region preprocessing</strong><span>Focus on the visual speech signal</span></div>
        </div>
        <div class="ssr-connector ssr-detail" style="--step-delay: 4700ms">↓</div>
        <div class="ssr-stage ssr-detail" style="--step-delay: 5400ms">
          <span class="ssr-number">03</span>
          <div><strong>ResNet-18</strong><span>Extract visual features from each frame</span></div>
        </div>
        <div class="ssr-connector ssr-detail" style="--step-delay: 6400ms">↓</div>
        <div class="ssr-stage ssr-detail" style="--step-delay: 7100ms">
          <span class="ssr-number">04</span>
          <div><strong>BiLSTM</strong><span>Model how those features change over time</span></div>
        </div>
        <div class="ssr-connector ssr-detail" style="--step-delay: 8100ms">↓</div>
        <div class="ssr-stage ssr-detail" style="--step-delay: 8800ms">
          <span class="ssr-number">05</span>
          <div><strong>Decoder → text</strong><span>Turn the learned temporal pattern into words</span></div>
        </div>
      </div>

      <p class="ssr-footnote ssr-detail" style="--step-delay: 11000ms">A memory of the system we built together.</p>
    </section>
  `;

  const scene = experience.querySelector<HTMLElement>('.scene');
  if (!scene) throw new Error('SSR scene was not created.');
  return scene;
}

function renderConnection(): HTMLElement {
  experience.innerHTML = `
    <section class="scene scene-connection">
      <div class="connection-card">
        <p class="eyebrow">What you taught me</p>
        <p class="connection-title">Data Compression</p>
      </div>
      <div class="connection-card">
        <p class="eyebrow">What you guided me through</p>
        <p class="connection-title">Silent Speech Recognition</p>
      </div>
      <p class="connection-line">Two things from college that I still remember.</p>
      <p class="connection-mark" aria-hidden="true">·</p>
    </section>
  `;

  const scene = experience.querySelector<HTMLElement>('.scene');
  if (!scene) throw new Error('Connection scene was not created.');
  return scene;
}

function renderReveal(): HTMLElement {
  experience.innerHTML = `
    <section class="scene scene-reveal">
      <p class="reveal-title">NOTHING WAS LOST.</p>
      <p class="reveal-copy">Not what you taught me.<br />Not the memories.</p>
      <div class="reveal-rule" aria-hidden="true"></div>
      <p class="reveal-birthday">Happy Birthday Ma'am.</p>
    </section>
  `;

  const scene = experience.querySelector<HTMLElement>('.scene');
  if (!scene) throw new Error('Reveal scene was not created.');
  return scene;
}

function renderBirthday(): HTMLElement {
  experience.innerHTML = `
    <section class="scene scene-birthday">
      <p class="eyebrow">For you, Ma'am</p>
      <h2>Happy Birthday<br />Jisha Ma'am! <span aria-hidden="true">🎂</span></h2>
      <div class="birthday-message">${formatMessage(BIRTHDAY_MESSAGE)}</div>
    </section>
  `;

  const scene = experience.querySelector<HTMLElement>('.scene');
  if (!scene) throw new Error('Birthday scene was not created.');
  return scene;
}

function formatMessage(message: string): string {
  return message
    .split('\n\n')
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function deriveMergeStepsFromTree(root: HuffmanNode | null): readonly {
  leftFrequency: number;
  rightFrequency: number;
  combinedFrequency: number;
}[] {
  if (!root || root.kind === 'leaf') return [];

  const steps: {
    leftFrequency: number;
    rightFrequency: number;
    combinedFrequency: number;
  }[] = [];

  const visit = (node: HuffmanNode): void => {
    if (node.kind === 'leaf') return;

    visit(node.left);
    visit(node.right);
    steps.push({
      leftFrequency: node.left.frequency,
      rightFrequency: node.right.frequency,
      combinedFrequency: node.frequency,
    });
  };

  visit(root);
  return steps;
}

function formatByte(byte: number): string {
  if (byte === 32) return 'space';
  if (byte >= 33 && byte <= 126) return String.fromCharCode(byte);
  return `0x${byte.toString(16).padStart(2, '0')}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);
}
