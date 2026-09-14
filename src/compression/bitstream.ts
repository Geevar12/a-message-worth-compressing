/** Packs a binary string into bytes and records how many bits are meaningful. */
export interface PackedBitstream {
  readonly bytes: Uint8Array;
  readonly bitLength: number;
}

export function packBits(bits: string): PackedBitstream {
  if (!/^[01]*$/.test(bits)) {
    throw new Error('Bitstream may contain only 0 and 1.');
  }

  const bytes = new Uint8Array(Math.ceil(bits.length / 8));

  for (let index = 0; index < bits.length; index += 1) {
    if (bits[index] === '1') {
      bytes[Math.floor(index / 8)] |= 1 << (7 - (index % 8));
    }
  }

  return {
    bytes,
    bitLength: bits.length,
  };
}

export function unpackBits(packed: PackedBitstream): string {
  if (packed.bitLength < 0 || packed.bitLength > packed.bytes.length * 8) {
    throw new Error('Invalid packed bitstream length.');
  }

  let bits = '';

  for (let index = 0; index < packed.bitLength; index += 1) {
    const byte = packed.bytes[Math.floor(index / 8)];
    const bit = (byte >> (7 - (index % 8))) & 1;
    bits += bit === 1 ? '1' : '0';
  }

  return bits;
}
