export interface FocusRegion {
  readonly id: string;
  readonly label: string;
  readonly startMs: number;
  readonly endMs: number;
  readonly scale: number;
}

/**
 * Recipient-facing motion plan inspired by motion editors. The page decides
 * when to focus and how strongly to zoom; the recipient never sees controls.
 * Each stage has enough time to enter, breathe, and leave before the next one
 * begins.
 */
export const COMPRESSION_FOCUS_REGIONS: readonly FocusRegion[] = [
  { id: 'message', label: 'original message', startMs: 1_100, endMs: 6_000, scale: 1.018 },
  { id: 'frequency', label: 'frequency counts', startMs: 6_250, endMs: 11_500, scale: 1.014 },
  { id: 'merge', label: 'Huffman merges', startMs: 11_750, endMs: 19_750, scale: 1.012 },
  { id: 'tree', label: 'Huffman tree', startMs: 20_000, endMs: 28_000, scale: 1.018 },
  { id: 'codes', label: 'prefix-free codes', startMs: 28_250, endMs: 34_250, scale: 1.014 },
  { id: 'encode', label: 'encoded bitstream', startMs: 34_500, endMs: 39_750, scale: 1.018 },
  { id: 'reconstruct', label: 'exact reconstruction', startMs: 40_000, endMs: 47_500, scale: 1.022 },
];

export const COMPRESSION_MARKERS = COMPRESSION_FOCUS_REGIONS.map((region) => ({
  label: region.id === 'reconstruct' ? 'VERIFY' : region.id.toUpperCase(),
  atMs: region.startMs,
})) as readonly { label: string; atMs: number }[];
