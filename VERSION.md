# Version 11

Responsive presentation pass for desktop, tablet, and phone.

- Gives the compression viewport a larger, screen-aware canvas without creating unnecessary empty space.
- Rebalances the viewport around the available `svh` so the heading, progress rail, frame, and motion note fit together.
- Gives the Huffman tree a larger responsive area while keeping the complete SVG inside its frame.
- Keeps frequency, merge, and code grids readable at tablet and phone widths.
- Replaces the narrow-screen progress-rail overflow behavior with a seven-column layout that remains visible.
- Adds a short-height mobile mode for compact phones instead of relying on a fixed 430px frame.
- Slows stage entrance and exit so each stage has a clear readable period.
- Preserves the recipient-facing guided-focus treatment without exposing editor controls.
