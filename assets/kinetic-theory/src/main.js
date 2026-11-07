// Entry point: reads the URL parameters declared in asset.json, starts the animation and connects it to the book.
import { startFigure } from '@shared/figure.js';
import { createApp } from './app.js';

await startFigure({
  create: createApp,
  events: ['step', 'play', 'pause'],
  commands: (app) => ({ play: () => (app.play(), app.getState()), pause: () => (app.pause(), app.getState()) }),
});
