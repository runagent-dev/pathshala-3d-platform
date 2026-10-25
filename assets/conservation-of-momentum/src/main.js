// Entry point: reads the URL parameters declared in asset.json, starts the figure and connects it to the book.
import { startFigure } from '@shared/figure.js';
import { createApp } from './app.js';

await startFigure({
  create: createApp,
  events: ['change', 'setup', 'play', 'pause', 'collide', 'end', 'view', 'dragstart', 'dragend', 'practice-start', 'practice-result', 'practice-end'],
  commands: (app) => ({ practice: () => app.startPractice().then(() => true) }),
});
