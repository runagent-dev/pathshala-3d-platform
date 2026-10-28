// A reference reader for testing labs: runs in a page of headless Chromium (bundled by verify-lab.mjs) and mounts a lab the way
// a Chalk reader does, with the real host code from @chalk-format/core: the lab's HTML goes through prepareLabDocument (the
// lab CSP, the guard, the libraries' import map), into an `<iframe sandbox="allow-scripts">` (opaque origin), and createLabHost
// serves the Host API to it. It is the same code a reader uses, not a copy of the protocol.
import { LAB_SANDBOX, createLabHost, labNonce, prepareLabDocument } from '@chalk-format/core';

const bytesOf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

window.__labTest = { events: [], errors: [], host: null, frame: null };

window.__mountLab = async ({ html, libraries = [], lab, locale = 'bn', visible = true, width = 800, height = 500 }) => {
  const t = window.__labTest;
  const nonce = labNonce();
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', LAB_SANDBOX);
  frame.style.cssText = `width:${width}px;height:${height}px;border:0;display:block`;
  frame.srcdoc = prepareLabDocument(
    html,
    nonce,
    libraries.map((l) => ({ specifier: l.specifier, bytes: bytesOf(l.base64) })),
  );
  const host = createLabHost({
    lab,
    frame,
    nonce,
    locale,
    theme: 'light',
    visible,
    onReady: () => t.events.push('ready'),
    onProgress: (p) => t.events.push(`progress ${JSON.stringify(p)}`),
    onError: (m) => t.errors.push(m),
  });
  t.host = host;
  t.frame = frame;
  document.body.append(frame);
  await host.started;
  return { granted: [...host.granted] };
};

window.__setVisible = (v) => window.__labTest.host.setVisible(v);
window.__resetLab = () => window.__labTest.host.reset();
