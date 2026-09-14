import { buildFrequencyTable } from './frequency';

export interface HuffmanLeaf {
  readonly kind: 'leaf';
  readonly byte: number;
  readonly frequency: number;
  readonly order: number;
}

export interface HuffmanBranch {
  readonly kind: 'branch';
  readonly frequency: number;
  readonly order: number;
  readonly left: HuffmanNode;
  readonly right: HuffmanNode;
}

export type HuffmanNode = HuffmanLeaf | HuffmanBranch;

export interface HuffmanMergeStep {
  readonly leftFrequency: number;
  readonly rightFrequency: number;
  readonly combinedFrequency: number;
}

export interface HuffmanTree {
  readonly root: HuffmanNode | null;
  readonly codes: ReadonlyMap<number, string>;
  readonly merges: readonly HuffmanMergeStep[];
}

/**
 * Builds a deterministic binary Huffman tree.
 *
 * Ties are resolved by the smallest creation order. This makes the same
 * input produce the same tree and code table across runs.
 */
export function buildHuffmanTree(bytes: Uint8Array): HuffmanTree {
  const frequencies = buildFrequencyTable(bytes);

  if (frequencies.size === 0) {
    return { root: null, codes: new Map(), merges: [] };
  }

  const leaves = [...frequencies.entries()]
    .sort(([byteA], [byteB]) => byteA - byteB)
    .map(([byte, frequency], order) => ({
      kind: 'leaf' as const,
      byte,
      frequency,
      order,
    }));

  const queue: HuffmanNode[] = [...leaves];
  const merges: HuffmanMergeStep[] = [];
  let nextOrder = leaves.length;

  while (queue.length > 1) {
    queue.sort(compareNodes);

    const left = queue.shift();
    const right = queue.shift();

    if (!left || !right) {
      throw new Error('Huffman tree construction failed.');
    }

    const combinedFrequency = left.frequency + right.frequency;
    merges.push({
      leftFrequency: left.frequency,
      rightFrequency: right.frequency,
      combinedFrequency,
    });

    queue.push({
      kind: 'branch',
      frequency: combinedFrequency,
      order: nextOrder++,
      left,
      right,
    });
  }

  const root = queue[0] ?? null;
  const codes = new Map<number, string>();

  if (root?.kind === 'leaf') {
    // A one-symbol alphabet still needs a representable code.
    codes.set(root.byte, '0');
  } else if (root) {
    assignCodes(root, '', codes);
  }

  return { root, codes, merges };
}

export function encode(bytes: Uint8Array, tree: HuffmanTree): string {
  if (bytes.length === 0) {
    return '';
  }

  let encoded = '';

  for (const byte of bytes) {
    const code = tree.codes.get(byte);

    if (code === undefined) {
      throw new Error(`No Huffman code exists for byte ${byte}.`);
    }

    encoded += code;
  }

  return encoded;
}

export function decode(bits: string, tree: HuffmanTree, expectedByteLength?: number): Uint8Array {
  if (!/^[01]*$/.test(bits)) {
    throw new Error('Huffman bitstream may contain only 0 and 1.');
  }

  if (tree.root === null) {
    if (bits.length !== 0) {
      throw new Error('A bitstream cannot be decoded with an empty Huffman tree.');
    }
    return new Uint8Array();
  }

  if (tree.root.kind === 'leaf') {
    if (bits.length > 0 && /[^0]/.test(bits)) {
      throw new Error('Invalid bitstream for a single-symbol Huffman tree.');
    }

    const length = expectedByteLength ?? bits.length;
    const byte = tree.root.byte;
    return Uint8Array.from({ length }, () => byte);
  }

  const output: number[] = [];
  let node: HuffmanNode = tree.root;

  for (const bit of bits) {
    if (node.kind === 'leaf') {
      output.push(node.byte);
      node = tree.root;
    }

    node = bit === '0' ? node.left : node.right;
  }

  if (node.kind === 'leaf') {
    output.push(node.byte);
  } else if (bits.length > 0) {
    throw new Error('Incomplete Huffman bitstream.');
  }

  const decoded = Uint8Array.from(output);

  if (expectedByteLength !== undefined && decoded.length !== expectedByteLength) {
    throw new Error(
      `Decoded ${decoded.length} bytes, expected ${expectedByteLength}.`,
    );
  }

  return decoded;
}

export function compressText(text: string): CompressedMessage {
  const bytes = new TextEncoder().encode(text);
  const tree = buildHuffmanTree(bytes);
  const bits = encode(bytes, tree);
  const decoded = decode(bits, tree, bytes.length);

  if (!bytesEqual(bytes, decoded)) {
    throw new Error('Huffman round-trip verification failed.');
  }

  return {
    originalBytes: bytes,
    bitstream: bits,
    tree,
    decodedBytes: decoded,
    verified: true,
  };
}

export interface CompressedMessage {
  readonly originalBytes: Uint8Array;
  readonly bitstream: string;
  readonly tree: HuffmanTree;
  readonly decodedBytes: Uint8Array;
  readonly verified: boolean;
}

export function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function compareNodes(left: HuffmanNode, right: HuffmanNode): number {
  return left.frequency - right.frequency || left.order - right.order;
}

function assignCodes(
  node: HuffmanNode,
  prefix: string,
  codes: Map<number, string>,
): void {
  if (node.kind === 'leaf') {
    codes.set(node.byte, prefix || '0');
    return;
  }

  assignCodes(node.left, `${prefix}0`, codes);
  assignCodes(node.right, `${prefix}1`, codes);
}
