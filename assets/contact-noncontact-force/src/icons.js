// Line icons (24 × 24, stroke = currentColor) for the five examples, on the chips and in the sorting trays.
import { svg } from '@shared/student/icons.js';

export const EXAMPLE_ICONS = {
  crane: svg('<path d="M3 21h9M5 21v-3h5v3M7 18L18 5M18 5v7"/><rect x="14.5" y="12" width="7" height="5.5" rx="0.6"/>'),
  push: svg(
    '<circle cx="5.5" cy="5" r="2"/><path d="M6.5 8l2 6M7.5 10.5l4.5 1M8.5 14l-3 6M8.5 14l3 6"/><rect x="12.5" y="8" width="9" height="12" rx="0.6"/>',
  ),
  friction: svg(
    '<path d="M2 18h20M2.5 10h4M3.5 13.5h3"/><rect x="9" y="7.5" width="10" height="10.5" rx="0.6"/><path d="M15.5 21.5H9M10.9 20.1L9 21.5l1.9 1.4" stroke-width="1.5"/>',
  ),
  fall: svg('<circle cx="12" cy="6.5" r="3.6"/><path d="M12 12.5v6.5M9.2 16.8l2.8 2.9 2.8-2.9M4 22h16"/>'),
  magnet: svg(
    '<rect x="12" y="8.5" width="10" height="7" rx="0.6"/><path d="M17 8.5v7"/><path d="M2 12h6.5M8.5 10.5v3" stroke-width="1.9"/><path d="M9.5 9.5l1 1M9.5 14.5l1-1" stroke-width="1.3"/>',
  ),
};
