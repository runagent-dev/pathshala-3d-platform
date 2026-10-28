// Local presentation for this instrument: a navy studio, a wooden bench and readable satin scales.
// Everything is procedural and stays offline. The bench and lights are outside the exported instrument.
import * as THREE from 'three';
import { boxProjectUV } from '@shared/student/materials.js';

function texture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export function createEnamel() {
  const grain = texture(128, 128, (ctx, w, h) => {
    const pixels = ctx.createImageData(w, h);
    let seed = 73;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const value = 95 + (seed % 90);
      pixels.data.set([value, value, value, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
  });
  grain.colorSpace = THREE.NoColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(1 / 32, 1 / 32);
  return new THREE.MeshPhysicalMaterial({
    name: 'BlueEnamel',
    color: 0x126caf,
    metalness: 0.28,
    roughness: 0.38,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
    bumpMap: grain,
    bumpScale: 0.075,
  });
}

export function createPresentation(stage, materials, { theme, shadow }) {
  const { scene, renderer } = stage;
  const centerX = 100;
  const span = 300;
  const floorY = -44.8;
  const resources = [];
  const own = (item) => (resources.push(item), item);

  // The scales stay satin and neutral so black engravings remain legible in both views.
  for (const material of [materials.satin, materials.satinSlider]) {
    material.color.set(0xe6eaf0);
    material.metalness = 0.48;
    material.roughness = 0.42;
  }
  materials.steel.roughness = 0.38;
  materials.steel.metalness = 0.85;
  materials.sliderSteel.roughness = 0.38;
  materials.sliderSteel.metalness = 0.85;
  materials.chrome.roughness = 0.16;
  const knurl = own(
    texture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#dddddd';
      for (let x = -h; x < w + h; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - h, h);
        ctx.stroke();
      }
    }),
  );
  knurl.colorSpace = THREE.NoColorSpace;
  knurl.wrapS = knurl.wrapT = THREE.RepeatWrapping;
  materials.knurl.bumpMap = knurl;
  knurl.repeat.set(3, 1.5);
  materials.knurl.bumpScale = 0.24;
  materials.knurl.roughness = 0.46;
  materials.knurl.metalness = 0.75;

  const lightRig = new THREE.Group();
  const ambient = new THREE.HemisphereLight(0xe1efff, 0x866044, 0.8);
  const key = new THREE.DirectionalLight(0xffead5, 2.2);
  key.position.set(centerX - span * 0.7, span, span * 1.5);
  key.target.position.set(centerX, -12, 0);
  const fill = new THREE.DirectionalLight(0xb4d9ff, 0.8);
  fill.position.set(centerX + span, span * 0.4, span);
  const rim = new THREE.DirectionalLight(0xd4ebff, 2);
  rim.position.set(centerX + span * 0.5, span * 0.7, -span);
  for (const light of [fill, rim]) light.target.position.set(centerX, -12, 0);
  lightRig.add(ambient, key, key.target, fill, fill.target, rim, rim.target);
  scene.add(lightRig);

  let bench = null;
  if (theme === 'light') {
    scene.background = own(
      texture(1024, 1024, (ctx, w, h) => {
        const base = ctx.createLinearGradient(0, 0, w, h);
        base.addColorStop(0, '#34485b');
        base.addColorStop(0.5, '#142b40');
        base.addColorStop(1, '#071725');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
        const glow = ctx.createRadialGradient(w * 0.03, h * 0.12, 0, w * 0.03, h * 0.12, w * 0.8);
        glow.addColorStop(0, 'rgba(245,211,165,0.26)');
        glow.addColorStop(1, 'rgba(245,211,165,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }),
    );
    const woodMap = own(
      texture(1024, 512, (ctx, w, h) => {
        const pixels = ctx.createImageData(w, h);
        let seed = 11;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const wave = Math.sin((x / w) * Math.PI * 2);
            const grain = Math.sin((y / h) * Math.PI * 360 + wave * 2);
            const broad = Math.sin((y / h) * Math.PI * 16 + wave * 0.6);
            const shade = grain * 3 + broad * 5 + (seed % 5) - 2;
            const i = (y * w + x) * 4;
            pixels.data.set([127 + shade, 77 + shade * 0.7, 45 + shade * 0.5, 255], i);
          }
        }
        ctx.putImageData(pixels, 0, 0);
      }),
    );
    woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
    woodMap.repeat.set(1 / 260, 1 / 160);
    woodMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const wood = own(new THREE.MeshPhysicalMaterial({ map: woodMap, roughness: 0.72, specularIntensity: 0.22 }));
    const geometry = own(new THREE.PlaneGeometry(span * 20, span * 4.5));
    geometry.rotateX(-Math.PI / 2);
    boxProjectUV(geometry);
    bench = new THREE.Mesh(geometry, wood);
    bench.name = 'PresentationBench';
    bench.position.set(centerX, floorY, span * 1.75);
    bench.receiveShadow = true;
    scene.add(bench);

    // A subtle contact shadow anchors the instrument even on low-power devices with shadow=0.
    const contactMap = own(
      texture(256, 128, (ctx, w, h) => {
        ctx.scale(1, h / w);
        const gradient = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        gradient.addColorStop(0, 'rgba(15,12,9,0.5)');
        gradient.addColorStop(1, 'rgba(15,12,9,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, w);
      }),
    );
    const contact = new THREE.Mesh(
      own(new THREE.PlaneGeometry(span * 0.7, span * 0.26)),
      own(new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false, toneMapped: false })),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(-90, 0.04, -span * 1.75);
    bench.add(contact);
    // Children inherit the bench's translation; the contact plane is horizontal in the scene.
    if (shadow) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.VSMShadowMap;
      renderer.shadowMap.autoUpdate = false;
      stage.onBeforeRender(() => (renderer.shadowMap.needsUpdate = true));
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: span * 6 });
      key.shadow.radius = 5;
      key.shadow.blurSamples = 8;
      key.shadow.bias = -0.0003;
    }
  }

  return {
    capture({ background, ...options } = {}) {
      const previous = scene.background;
      const override = background !== undefined;
      if (override) {
        scene.background = null;
        if (bench) bench.visible = false;
      }
      try {
        return stage.capture({ ...options, background: override ? background : '#ffffff' });
      } finally {
        scene.background = previous;
        if (bench) bench.visible = true;
        stage.invalidate();
      }
    },
    dispose() {
      scene.background = null;
      scene.remove(lightRig);
      if (bench) scene.remove(bench);
      for (const resource of resources) resource.dispose();
    },
  };
}
