/**
 * Book side of the Pathshala messaging protocol (see bridge.js).
 *
 *   import { connectAsset } from './shared/lib/host.js';
 *   const caliper = connectAsset(document.querySelector('iframe'));
 *   await caliper.ready;
 *   caliper.on('change', (reading) => console.log(reading));
 *   await caliper.call('set', { value: 24.6 });
 */
export function connectAsset(iframe, { timeout = 10000 } = {}) {
  let seq = 0;
  const pending = new Map();
  const handlers = new Map();
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));

  function onMessage(event) {
    if (event.source !== iframe.contentWindow) return;
    const msg = event.data;
    if (msg?.pathshala !== 1 || typeof msg.type !== 'string') return;
    if (msg.type.endsWith(':result') && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(msg.payload);
      if (msg.type === 'ping:result' && !msg.error) resolveReady(msg.payload);
      return;
    }
    if (msg.type === 'ready') resolveReady(msg.payload);
    for (const key of [msg.type, '*']) for (const fn of handlers.get(key) || []) fn(msg.payload, msg);
  }
  window.addEventListener('message', onMessage);

  function call(type, payload = {}) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.delete(id)) reject(new Error(`"${type}" timed out`));
      }, timeout);
      pending.set(id, { resolve, reject, timer });
      iframe.contentWindow?.postMessage({ pathshala: 1, type, payload, id }, '*');
    });
  }

  // If the asset loaded before we started listening we'd miss "ready", so ask.
  const probe = () => call('ping').catch(() => {});
  if (iframe.contentDocument?.readyState === 'complete') probe();
  iframe.addEventListener('load', probe);

  return {
    ready,
    call,
    /** Listen to an event type, or "*" for everything. Returns an unsubscribe function. */
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
      return () => handlers.get(type).delete(fn);
    },
    dispose() {
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', probe);
      for (const p of pending.values()) clearTimeout(p.timer);
      pending.clear();
    },
  };
}
