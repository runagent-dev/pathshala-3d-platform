# {{title}}

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="{{id}}/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './{{id}}/shared/lib/host.js';
  const figure = connectAsset(document.querySelector('iframe'));
  await figure.ready;
  figure.on('change', (state) => console.log(state));
</script>
```

## URL parameters

<!-- generated:params (npm run docs) -->
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
<!-- /generated:bridge -->
