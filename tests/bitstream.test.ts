import { describe, expect, it } from 'vitest';
import { packBits, unpackBits } from '../src/compression/bitstream';

describe('bitstream packing', () => {
  it.each(['', '0', '1', '01010101', '101010101', '111000101011'])(
    'round-trips %j',
    (bits) => {
      expect(unpackBits(packBits(bits))).toBe(bits);
    },
  );

  it('packs bits into the expected byte representation', () => {
    const packed = packBits('101000011');

    expect([...packed.bytes]).toEqual([0b10100001, 0b10000000]);
    expect(packed.bitLength).toBe(9);
  });

  it('rejects invalid input bits', () => {
    expect(() => packBits('010201')).toThrow();
  });

  it('rejects invalid packed lengths', () => {
    expect(() => unpackBits({ bytes: new Uint8Array(1), bitLength: 9 })).toThrow();
    expect(() => unpackBits({ bytes: new Uint8Array(1), bitLength: -1 })).toThrow();
  });

  it('ignores padding bits after the meaningful bit length', () => {
    expect(
      unpackBits({ bytes: new Uint8Array([0b10101111]), bitLength: 5 }),
    ).toBe('10101');
  });
});
