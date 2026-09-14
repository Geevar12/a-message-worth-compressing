export interface CompressionMetrics {
  readonly originalBytes: number;
  readonly compressedBytes: number;
  readonly bitLength: number;
  readonly compressionRatio: number | null;
}

export function calculateMetrics(
  originalByteLength: number,
  bitLength: number,
): CompressionMetrics {
  const compressedBytes = Math.ceil(bitLength / 8);

  return {
    originalBytes: originalByteLength,
    compressedBytes,
    bitLength,
    compressionRatio:
      compressedBytes === 0 ? null : originalByteLength / compressedBytes,
  };
}
