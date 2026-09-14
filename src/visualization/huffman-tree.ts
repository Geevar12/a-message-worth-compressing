import type { HuffmanNode } from '../compression/huffman';

export interface TreeLayoutNode {
  readonly node: HuffmanNode;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

export interface TreeLayoutEdge {
  readonly from: TreeLayoutNode;
  readonly to: TreeLayoutNode;
  readonly branch: '0' | '1';
}

export interface HuffmanTreeLayout {
  readonly nodes: readonly TreeLayoutNode[];
  readonly edges: readonly TreeLayoutEdge[];
  readonly width: number;
  readonly height: number;
}

const NODE_RADIUS = 14;
const HORIZONTAL_GAP = 42;
const VERTICAL_GAP = 56;
const PADDING = 24;

/** Creates a compact, deterministic SVG layout that keeps the complete tree visible. */
export function layoutHuffmanTree(root: HuffmanNode | null): HuffmanTreeLayout {
  if (!root) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];
  let leafIndex = 0;
  let maxDepth = 0;

  const assign = (node: HuffmanNode, depth: number): TreeLayoutNode => {
    maxDepth = Math.max(maxDepth, depth);

    if (node.kind === 'leaf') {
      const positioned = { node, x: leafIndex++, y: depth, depth };
      nodes.push(positioned);
      return positioned;
    }

    const left = assign(node.left, depth + 1);
    const right = assign(node.right, depth + 1);
    const positioned = {
      node,
      x: (left.x + right.x) / 2,
      y: depth,
      depth,
    };

    nodes.push(positioned);
    edges.push({ from: positioned, to: left, branch: '0' });
    edges.push({ from: positioned, to: right, branch: '1' });
    return positioned;
  };

  assign(root, 0);

  const maxLeafX = Math.max(0, leafIndex - 1);
  const width = Math.max(
    150,
    PADDING * 2 + maxLeafX * HORIZONTAL_GAP + NODE_RADIUS * 2,
  );
  const height = PADDING * 2 + maxDepth * VERTICAL_GAP + NODE_RADIUS * 2 + 18;

  return { nodes, edges, width, height };
}

export function treeToSvg(root: HuffmanNode | null, baseDelayMs = 0): string {
  const layout = layoutHuffmanTree(root);

  if (layout.nodes.length === 0) return '';

  const maxX = Math.max(...layout.nodes.map((node) => node.x));
  const xScale = maxX === 0
    ? 0
    : (layout.width - PADDING * 2 - NODE_RADIUS * 2) / maxX;

  const point = (node: TreeLayoutNode) => ({
    x: PADDING + NODE_RADIUS + node.x * xScale,
    y: PADDING + NODE_RADIUS + node.y * VERTICAL_GAP,
  });

  const edgeMarkup = layout.edges.map((edge) => {
    const from = point(edge.from);
    const to = point(edge.to);
    const labelX = from.x + (to.x - from.x) * 0.5;
    const labelY = from.y + (to.y - from.y) * 0.5 - 4;
    const revealDelay = baseDelayMs + 350 + edge.to.depth * 300;

    return `
      <line class="tree-edge" style="--tree-delay: ${revealDelay}ms" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />
      <text class="tree-branch" style="--branch-delay: ${revealDelay + 120}ms" x="${labelX}" y="${labelY}" text-anchor="middle">${edge.branch}</text>
    `;
  }).join('');

  const nodeMarkup = layout.nodes.map((entry) => {
    const { x, y } = point(entry);
    const label = entry.node.kind === 'leaf'
      ? printableByte(entry.node.byte)
      : String(entry.node.frequency);
    const meta = entry.node.kind === 'leaf' ? String(entry.node.frequency) : '';
    const revealDelay = baseDelayMs + 280 + entry.depth * 300;

    return `
      <g class="tree-node" style="--tree-delay: ${revealDelay}ms">
        <circle cx="${x}" cy="${y}" r="${NODE_RADIUS}" />
        <text class="tree-node-label" x="${x}" y="${y + 3.5}" text-anchor="middle">${escapeHtml(label)}</text>
        ${meta ? `<text class="tree-node-meta" x="${x}" y="${y + 27}" text-anchor="middle">${meta}</text>` : ''}
      </g>
    `;
  }).join('');

  return `
    <svg class="huffman-svg" viewBox="0 0 ${layout.width} ${layout.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Huffman tree">
      ${edgeMarkup}
      ${nodeMarkup}
    </svg>
  `;
}

function printableByte(byte: number): string {
  if (byte === 32) return '·';
  if (byte >= 33 && byte <= 126) return String.fromCharCode(byte);
  return '·';
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
