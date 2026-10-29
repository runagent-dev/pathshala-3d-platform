// Stands in for shared/lib/bridge.js in a lab build (the bundler redirects the import): the figure's commands are kept
// where the lab adapter (lab-prelude.js) can reach them, and the events a figure emits are handed to it. There is no
// postMessage to a book here: in a Chalk reader the host talks to the lab over the Host API instead.
export const PROTOCOL = 1;

export function createBridge({ asset, version = '0.0.0', commands = {} }) {
  const all = { ping: () => ({ asset, version }), ...commands };
  const lab = globalThis.__pathshalaLab;
  lab.asset = asset;
  lab.commands = all;
  return {
    embedded: true,
    emit(type, payload) {
      lab.onEvent?.(type, payload);
      window.dispatchEvent(new CustomEvent(`pathshala:${type}`, { detail: payload }));
    },
    dispose() {},
  };
}
