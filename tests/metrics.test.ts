import { describe, expect, it } from 'vitest';
import { calculateMetrics } from '../src/compression/metrics';

describe('compression metrics', () => {
  it('calculates packed byte size and ratio', () => {
    expect(calculateMetrics(16, 32)).toEqual({
      originalBytes: 16,
      compressedBytes: 4,
      bitLength: 32,
      compressionRatio: 4,
    });
  });

  it('rounds partial bytes upward', () => {
    expect(calculateMetrics(10, 9).compressedBytes).toBe(2);
  });

  it('returns null ratio when there are no compressed bytes', () => {
    expect(calculateMetrics(0, 0).compressionRatio).toBeNull();
  });
});
