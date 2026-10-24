// Standalone / iframe entry: reads URL params, mounts the animation, connects it to the book via postMessage.
import { createBridge } from '@shared/bridge.js';
import { createPrefixApp, loadFonts, VERSION, DEFAULTS } from './app.js';

const q = new URLSearchParams(location.search);
const num = (k) => (q.has(k) && q.get(k) !== '' && !Number.isNaN(+q.get(k)) ? +q.get(k) : undefined);
const bool = (k) => (q.has(k) ? !['0', 'false', 'no', 'off'].includes(q.get(k).toLowerCase()) : undefined);
const str = (k) => q.get(k) || undefined;

const options = Object.fromEntries(
  Object.entries({
    lang: str('lang'),
    autoplay: bool('autoplay'),
    loop: bool('loop'),
    speed: num('speed'),
    theme: str('bg') ?? str('theme'),
    ladder: bool('ladder'),
    start: str('start'),
  }).filter(([, v]) => v !== undefined),
);

document.body.classList.add(`bg-${options.theme || DEFAULTS.theme}`);
await loadFonts();
const app = createPrefixApp(document.getElementById('app'), options);
window.prefixes = app; // handy in the console

const bridge = createBridge({
  asset: 'si-prefixes',
  version: VERSION,
  commands: {
    get: () => app.getState(),
    play: () => (app.play(), app.getState()),
    pause: () => (app.pause(), app.getState()),
    goto: ({ id, animate } = {}) => app.goTo(id, { animate: animate !== false }),
    capture: ({ width, height, background } = {}) => app.capture({ width, height, background }),
  },
});
for (const type of ['stop', 'choose', 'play', 'pause']) app.on(type, (payload) => bridge.emit(type, payload));
bridge.emit('ready', { asset: 'si-prefixes', version: VERSION, stops: app.stops, state: app.getState() });
