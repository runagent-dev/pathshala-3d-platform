// Standalone / iframe entry: reads URL params, mounts the screw gauge, connects it to the book via postMessage.
import { createBridge } from '@shared/bridge.js';
import { createScrewGaugeApp, loadFonts, VERSION, DEFAULTS } from './app.js';

const q = new URLSearchParams(location.search);
const num = (k) => (q.has(k) && q.get(k) !== '' && !Number.isNaN(+q.get(k)) ? +q.get(k) : undefined);
const bool = (k) => (q.has(k) ? !['0', 'false', 'no', 'off'].includes(q.get(k).toLowerCase()) : undefined);
const str = (k) => q.get(k) || undefined;

const options = Object.fromEntries(
  Object.entries({
    value: num('value'),
    view: str('view'),
    object: str('object'),
    size: num('size'),
    magnifier: bool('magnifier'),
    guides: bool('guides'),
    sound: bool('sound'),
    theme: str('bg'),
    lang: str('lang'),
    numerals: str('numerals'),
    coach: bool('coach'),
    mode: str('mode'),
    shadow: bool('shadow'),
  }).filter(([, v]) => v !== undefined),
);

document.body.classList.add(`bg-${options.theme || DEFAULTS.theme}`);
await loadFonts();
const app = createScrewGaugeApp(document.getElementById('app'), options);
window.gauge = app; // handy in the console

const bridge = createBridge({
  asset: 'screw-gauge',
  version: VERSION,
  commands: {
    get: () => app.getState(),
    set: (payload) => app.set(payload),
    reset: () => app.reset().then(() => app.getState()),
    practice: () => app.startPractice().then(() => true),
    capture: ({ width, height } = {}) => app.capture({ width, height }),
  },
});
for (const type of ['change', 'object', 'view', 'dragstart', 'dragend', 'practice-start', 'practice-result', 'practice-end']) {
  app.on(type, (payload) => bridge.emit(type, payload));
}
app.ready.then(() => bridge.emit('ready', { asset: 'screw-gauge', version: VERSION, state: app.getState() }));
