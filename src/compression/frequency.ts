/** Counts the frequency of every byte in a UTF-8 payload. */
export function buildFrequencyTable(bytes: Uint8Array): Map<number, number> {
  const frequencies = new Map<number, number>();

  for (const byte of bytes) {
    frequencies.set(byte, (frequencies.get(byte) ?? 0) + 1);
  }

  return frequencies;
}
