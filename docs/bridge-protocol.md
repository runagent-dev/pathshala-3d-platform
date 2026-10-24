# The bridge: how the book talks to a figure

A figure runs in an `<iframe>` of the book page. The two sides talk with `window.postMessage`, one envelope for
everything (`shared/lib/bridge.js` on the figure side, `shared/lib/host.js` on the book side):

```js
{ pathshala: 1, asset: "<figure-id>", type: "<name>", payload: { … }, id?: <number>, error?: "<message>" }
```

| Kind | Direction | Example |
|---|---|---|
| Command | book → figure | `{ type: "set", payload: { value: 5.2 }, id: 7 }` |
| Reply | figure → book | `{ type: "set:result", payload: <return value>, id: 7 }` (or `error`) |
| Event | figure → book | `{ type: "change", payload: { value: 5.2, … } }` |

A figure answers only its parent window. Binary answers (`export-glb`) are sent as a transferable `ArrayBuffer`.

## Standard commands

Every figure answers `ping` → `{ asset, version }` and emits `ready` → `{ asset, version, state }` once it takes
commands. Through `connectFigure` (shared/lib/figure.js) a figure also answers, when it can:

| Command | Payload | Answer |
|---|---|---|
| `get` | | the figure's state (plain JSON) |
| `set` | figure-specific, plus `animate: false` to jump | the new state |
| `reset` | | the state after resetting |
| `capture` | `{ width, height, background }` (`background: null` keeps it transparent) | PNG data URL |
| `export-glb` | | `ArrayBuffer` (binary glTF, metres) |
| `seek` | `{ t }` seconds (animations) | the state |
| `duration` | (animations) | seconds |

Figures add their own (`practice`, `goto`, `play`, …) and list every command and event in `asset.json`; the README
tables come from there (`npm run docs`).

## For the book developer

Each zip ships `shared/lib/host.js`:

```html
<iframe id="caliper" src="vernier-caliper/index.html?lang=bn" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen"></iframe>
<script type="module">
  import { connectAsset } from './vernier-caliper/shared/lib/host.js';
  const caliper = connectAsset(document.getElementById('caliper'));
  const { version } = await caliper.ready;       // resolves on "ready" (or a ping answer)
  caliper.on('change', (state) => console.log(state.value));
  await caliper.call('set', { value: 24.6 });     // rejects with the figure's error message, or after 10 s
</script>
```

`PACKAGE.json` in the zip says where the figure goes (`book`, `page`, `topic`, `placement`), its version, the kit
and three.js versions, and the commit it was built from.

## Compatibility

Changing what a command takes or returns, or removing a command, event or URL parameter, is a major version of the
figure. Adding is a minor version.
