/**
 * Asset side of the Pathshala messaging protocol.
 *
 * Every asset runs in an <iframe> inside the book. The book talks to it with window.postMessage
 * using one envelope for everything:
 *
 *   { pathshala: 1, asset: "<asset-id>", type: "<name>", payload: {...}, id?: <number>, error?: "<msg>" }
 *
 *   • Commands  book → asset   { type: "set", payload: {...}, id: 7 }
 *   • Replies   asset → book   { type: "set:result", payload: <return value>, id: 7 }
 *   • Events    asset → book   { type: "change", payload: {...} }
 *
 * Every asset answers "ping" and emits "ready" once it can take commands.
 * See shared/lib/host.js for the book side.
 */
export const PROTOCOL = 1;

export function createBridge({ asset, version = '0.0.0', commands = {}, allowedOrigins = ['*'] }) {
  const parent = window.parent !== window ? window.parent : null;
  const all = { ping: () => ({ asset, version }), ...commands };

  function post(message, transfer) {
    if (!parent) return;
    parent.postMessage({ pathshala: PROTOCOL, asset, ...message }, '*', transfer);
  }

  async function onMessage(event) {
    const msg = event.data;
    if (!msg || msg.pathshala !== PROTOCOL || typeof msg.type !== 'string') return;
    if (event.source !== parent) return;
    if (!allowedOrigins.includes('*') && !allowedOrigins.includes(event.origin)) return;
    if (msg.asset && msg.asset !== asset && msg.asset !== '*') return;
    if (msg.type.endsWith(':result')) return;

    const handler = all[msg.type];
    const reply = `${msg.type}:result`;
    if (!handler) return post({ type: reply, id: msg.id, error: `Unknown command "${msg.type}"` });
    try {
      const result = await handler(msg.payload ?? {});
      const transfer = result instanceof ArrayBuffer ? [result] : undefined;
      post({ type: reply, id: msg.id, payload: result }, transfer);
    } catch (err) {
      post({ type: reply, id: msg.id, error: String(err?.message || err) });
    }
  }
  window.addEventListener('message', onMessage);

  return {
    embedded: !!parent,
    /** Send an event to the book (and to same-page listeners as a `pathshala:<type>` DOM event). */
    emit(type, payload) {
      post({ type, payload });
      window.dispatchEvent(new CustomEvent(`pathshala:${type}`, { detail: payload }));
    },
    dispose() {
      window.removeEventListener('message', onMessage);
    },
  };
}
