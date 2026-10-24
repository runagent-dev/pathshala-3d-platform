// `node --import ./test/register.mjs`: resolve `three`, `three/addons/…` and `@shared/…` the way the figures'
// import map does, so pure figure logic (readings, tweens, quiz maths) can be tested in Node with the same code.
import { register } from 'node:module';

register('./loader.mjs', import.meta.url);
