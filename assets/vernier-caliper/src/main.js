// Standalone / iframe entry: reads URL params, mounts the app, connects it to the book via postMessage.
import { createBridge } from '@shared/bridge.js';
import { createVernierApp, loadFonts, VERSION, DEFAULTS } from './app.js';

const q = new URLSearchParams(location.search);
const num = (k) => (q.has(k) && q.get(k) !== '' && !Number.isNaN(+q.get(k)) ? +q.get(k) : undefined);
const bool = (k) => (q.has(k) ? !['0', 'false', 'no', 'off'].includes(q.get(k).toLowerCase()) : undefined);
const str = (k) => q.get(k) || undefined;

const options = Object.fromEntries(
  Object.entries({
    lc: num('lc'),
    zeroError: num('ze') ?? num('zeroError'),
    value: num('value'),
    unit: str('unit'),
    view: str('view'),
    specimen: str('specimen'),
    size: num('size'),
    magnifier: bool('magnifier'),
    guides: bool('guides'),
    labels: bool('labels'),
    locked: bool('locked'),
    sound: bool('sound'),
    hideReading: bool('hide'),
    theme: str('bg') ?? str('theme'),
    ui: str('ui'),
    lang: str('lang'),
    numerals: str('numerals'),
    shadow: bool('shadow'),
    mode: str('mode'),
    practiceZeroError: bool('practiceZe'),
    coach: bool('coach'),
  }).filter(([, v]) => v !== undefined),
);

document.body.classList.add(`bg-${options.theme || DEFAULTS.theme}`);
await loadFonts();
const app = createVernierApp(document.getElementById('app'), options);
window.vernier = app; // handy in the console

const bridge = createBridge({
  asset: 'vernier-caliper',
  version: VERSION,
  commands: {
    get: () => app.getState(),
    set: (payload) => app.set(payload),
    reset: () => app.reset().then(() => app.getState()),
    tour: () => app.startTour(),
    practice: (payload) => app.startPractice(payload).then(() => true),
    capture: ({ width, height } = {}) => app.capture({ width, height }),
    'export-glb': () => app.exportGLB(),
  },
});

for (const type of [
  'change',
  'specimen',
  'view',
  'settings',
  'dragstart',
  'dragend',
  'tour-step',
  'tour-end',
  'practice-start',
  'practice-result',
  'practice-end',
]) {
  app.on(type, (payload) => bridge.emit(type, payload));
}
app.ready.then(() => bridge.emit('ready', { asset: 'vernier-caliper', version: VERSION, state: app.getState() }));
