import { describe, expect, it } from 'vitest';
import {
  buildHuffmanTree,
  bytesEqual,
  compressText,
  decode,
  encode,
} from '../src/compression/huffman';

const cases = [
  'Hello',
  'AAAAAA',
  'Hello World',
  'Happy Birthday!',
  'Data Compression: 101010',
  'Symbols: !@#$%^&*()[]{}',
  'Unicode: café — नमस्ते',
  'Emoji: 🎂🎉💛',
  'A'.repeat(5000),
];

describe('Huffman coding', () => {
  it.each(cases)('round-trips %j exactly', (text) => {
    const result = compressText(text);
    const reconstructed = new TextDecoder().decode(result.decodedBytes);

    expect(result.verified).toBe(true);
    expect(reconstructed).toBe(text);
    expect(bytesEqual(result.originalBytes, result.decodedBytes)).toBe(true);
  });

  it('handles empty input', () => {
    const result = compressText('');

    expect(result.bitstream).toBe('');
    expect(result.tree.root).toBeNull();
    expect(result.decodedBytes).toHaveLength(0);
    expect(result.verified).toBe(true);
  });

  it('handles a single-symbol alphabet', () => {
    const bytes = new TextEncoder().encode('AAAAAA');
    const tree = buildHuffmanTree(bytes);
    const bits = encode(bytes, tree);
    const decoded = decode(bits, tree, bytes.length);

    expect(tree.codes.get('A'.charCodeAt(0))).toBe('0');
    expect(bits).toBe('000000');
    expect(bytesEqual(bytes, decoded)).toBe(true);
  });

  it('records every Huffman merge in construction order', () => {
    const bytes = new TextEncoder().encode('abracadabra');
    const tree = buildHuffmanTree(bytes);

    expect(tree.merges).toHaveLength(tree.codes.size - 1);
    expect(tree.merges.at(-1)?.combinedFrequency).toBe(bytes.length);
  });

  it('produces deterministic codes for identical input', () => {
    const bytes = new TextEncoder().encode('abracadabra');
    const first = buildHuffmanTree(bytes);
    const second = buildHuffmanTree(bytes);

    expect([...first.codes.entries()]).toEqual([...second.codes.entries()]);
  });

  it('resolves duplicate frequencies deterministically', () => {
    const bytes = new Uint8Array([0, 1, 2, 3]);
    const first = buildHuffmanTree(bytes);
    const second = buildHuffmanTree(bytes);

    expect([...first.codes.entries()]).toEqual([...second.codes.entries()]);
  });

  it('rejects invalid bits', () => {
    const bytes = new TextEncoder().encode('hello');
    const tree = buildHuffmanTree(bytes);

    expect(() => decode('0102', tree, bytes.length)).toThrow();
  });
});
