// Entry point: reads the URL parameters declared in asset.json, starts the figure and connects it to the book.
import { startFigure } from '@shared/figure.js';
import { createApp } from './app.js';

await startFigure({
  create: createApp,
  events: ['change', 'action', 'phase', 'cond', 'term', 'view', 'practice-start', 'practice-result', 'practice-end'],
  commands: (app) => ({ practice: () => app.startPractice().then(() => true) }),
});
