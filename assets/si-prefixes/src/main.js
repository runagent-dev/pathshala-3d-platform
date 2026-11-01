// Entry point: reads the URL parameters declared in asset.json, starts the animation and connects it to the book
// (get, play, pause, goto, seek, duration, reset, capture; events ready, stop, choose, play, pause).
import { startFigure } from '@shared/figure.js';
import { createPrefixApp } from './app.js';

const { app } = await startFigure({
  create: createPrefixApp,
  events: ['stop', 'choose', 'play', 'pause'],
  commands: (a) => ({
    play: () => (a.play(), a.getState()),
    pause: () => (a.pause(), a.getState()),
    goto: ({ id, animate } = {}) => a.goTo(id, { animate: animate !== false }),
  }),
});
Object.assign(window, { prefixes: app }); // the old name, handy in the console
