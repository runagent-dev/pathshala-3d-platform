// Magnifying glass. The magnified image is a second render of the same scene through a sub-window
// of the main camera (setViewOffset), composited as a disc over the canvas. The ring + handle are
// DOM, so they stay crisp and can be dragged.
import * as THREE from 'three';

export function createLoupe({ stage, layer, clearColor = 0xffffff, onChange, onDragStart, formatZoom = (z) => `${z}×` }) {
  const { renderer, scene, camera } = stage;

  const rt = new THREE.WebGLRenderTarget(512, 512, { samples: 4, type: THREE.HalfFloatType });
  const loupeCam = new THREE.PerspectiveCamera();
  const overlayScene = new THREE.Scene();
  const overlayCam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 128),
    new THREE.MeshBasicMaterial({ map: rt.texture, depthTest: false, depthWrite: false }),
  );
  overlayScene.add(disc);

  // DOM: ring (draggable by its rim), handle, zoom badge, follow pin.
  const el = document.createElement('div');
  el.className = 'pvc-lens';
  el.innerHTML = `
    <svg class="pvc-lens-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="47.5" class="rim-hit"/>
      <circle cx="50" cy="50" r="47.5" class="rim"/>
      <circle cx="50" cy="50" r="45.2" class="rim-inner"/>
    </svg>
    <div class="pvc-lens-handle" aria-hidden="true"></div>
    <button class="pvc-lens-zoom" type="button" title="Scroll on the lens to zoom">3×</button>
    <button class="pvc-lens-pin" type="button" title="Follow the reading"></button>`;
  layer.appendChild(el);
  const zoomBadge = el.querySelector('.pvc-lens-zoom');
  const handle = el.querySelector('.pvc-lens-handle');
  const pin = el.querySelector('.pvc-lens-pin');

  const state = {
    visible: false,
    follow: true,
    frozen: false, // don't chase the target (e.g. while dragging through the lens)
    zoom: 3.2,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    d: 180,
    target: null, // () => THREE.Vector3 world point
  };

  const v = new THREE.Vector3();
  function project(world) {
    v.copy(world).project(camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, behind: v.z > 1 };
  }

  function clampPos(x, y) {
    const r = state.d / 2;
    return {
      x: Math.min(Math.max(x, r + 4), stage.width - r - 4),
      y: Math.min(Math.max(y, r + 4), stage.height - r - 4),
    };
  }

  function layout() {
    state.d = Math.round(Math.min(230, Math.max(120, Math.min(stage.width, stage.height) * 0.38)));
    el.style.width = el.style.height = `${state.d}px`;
    const p = clampPos(state.x, state.y);
    state.x = p.x;
    state.y = p.y;
  }

  function place() {
    el.style.transform = `translate(${state.x - state.d / 2}px, ${state.y - state.d / 2}px)`;
    zoomBadge.textContent = formatZoom(state.zoom.toFixed(state.zoom < 10 ? 1 : 0).replace(/\.0$/, ''));
    pin.classList.toggle('on', state.follow);
  }

  function updateCamera() {
    const w = state.d / state.zoom;
    loupeCam.copy(camera);
    loupeCam.setViewOffset(stage.width, stage.height, state.x - w / 2, state.y - w / 2, w, w);
    loupeCam.updateProjectionMatrix();
  }

  // Each frame: glide toward the target (if following), then render the magnified view.
  stage.addTicker((dt) => {
    if (!state.visible) return false;
    if (state.follow && state.target && !state.frozen) {
      const p = project(state.target());
      if (!p.behind) {
        const c = clampPos(p.x, p.y);
        state.tx = c.x;
        state.ty = c.y;
      }
    } else if (!state.follow) {
      state.tx = state.x;
      state.ty = state.y;
    }
    const dx = state.tx - state.x;
    const dy = state.ty - state.y;
    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return false;
    const k = 1 - Math.exp(-dt * 14);
    state.x += dx * k;
    state.y += dy * k;
    place();
    return true;
  });

  stage.onAfterRender(() => {
    if (!state.visible) return;
    const dpr = renderer.getPixelRatio();
    const size = Math.min(1024, Math.round(state.d * dpr));
    if (rt.width !== size) rt.setSize(size, size);
    updateCamera();
    const prevTarget = renderer.getRenderTarget();
    const prevColor = renderer.getClearColor(new THREE.Color());
    const prevAlpha = renderer.getClearAlpha();
    const prevAuto = renderer.autoClear;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(clearColor, 1);
    renderer.clear();
    renderer.render(scene, loupeCam);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevColor, prevAlpha);

    overlayCam.right = stage.width;
    overlayCam.bottom = -stage.height;
    overlayCam.updateProjectionMatrix();
    disc.scale.set(state.d - 6, state.d - 6, 1);
    disc.position.set(state.x, -state.y, 0);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlayScene, overlayCam);
    renderer.autoClear = prevAuto;
  });

  stage.onResize(() => {
    layout();
    place();
  });

  // Drag the lens by its rim or handle.
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    if (!(/** @type {Element} */ (e.target).closest('.rim-hit, .pvc-lens-handle'))) return;
    e.stopPropagation();
    e.preventDefault();
    drag = { id: e.pointerId, ox: e.clientX - state.x, oy: e.clientY - state.y };
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    state.follow = false;
    place();
    onDragStart?.();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = clampPos(e.clientX - drag.ox, e.clientY - drag.oy);
    state.x = state.tx = p.x;
    state.y = state.ty = p.y;
    place();
    stage.invalidate();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    el.classList.remove('dragging');
    onChange?.({ follow: state.follow });
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  pin.addEventListener('click', (e) => {
    e.stopPropagation();
    api.setFollow(!state.follow);
  });
  zoomBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    const steps = [2, 3.2, 5, 8];
    const i = steps.findIndex((s) => s > state.zoom + 0.01);
    api.setZoom(steps[i < 0 ? 0 : i]);
  });

  const api = {
    el,
    handle,
    camera: loupeCam,
    /** Centre of the glass in canvas pixels. */
    get center() {
      return { x: state.x, y: state.y };
    },
    get diameter() {
      return state.d;
    },
    get visible() {
      return state.visible;
    },
    get follow() {
      return state.follow;
    },
    get zoom() {
      return state.zoom;
    },
    setVisible(on) {
      state.visible = on;
      el.classList.toggle('on', on);
      if (on) {
        layout();
        if (state.follow && state.target) {
          const p = project(state.target());
          const c = clampPos(p.x, p.y);
          state.x = state.tx = c.x;
          state.y = state.ty = c.y;
        }
        place();
      }
      stage.invalidate();
    },
    setTarget(fn) {
      state.target = fn;
    },
    setFollow(on) {
      state.follow = on;
      place();
      stage.invalidate();
      onChange?.({ follow: on });
    },
    setFrozen(on) {
      state.frozen = on;
    },
    setZoom(z) {
      state.zoom = Math.min(12, Math.max(1.5, z));
      place();
      stage.invalidate();
    },
    moveTo(x, y) {
      const p = clampPos(x, y);
      state.x = state.tx = p.x;
      state.y = state.ty = p.y;
      place();
      stage.invalidate();
    },
    /** Is a canvas-space point inside the glass? */
    contains(x, y) {
      if (!state.visible) return false;
      const r = state.d / 2 - 6;
      return (x - state.x) ** 2 + (y - state.y) ** 2 <= r * r;
    },
    /** NDC for raycasting through the magnified view. */
    toNDC(x, y, out = new THREE.Vector2()) {
      updateCamera();
      const shown = state.d - 6; // the disc is drawn 6px smaller than the ring
      return out.set(((x - state.x) / shown) * 2, -((y - state.y) / shown) * 2);
    },
    setClearColor(c) {
      clearColor = c;
      stage.invalidate();
    },
    dispose() {
      rt.dispose();
      disc.geometry.dispose();
      disc.material.dispose();
      el.remove();
    },
  };
  layout();
  place();
  return api;
}
