// "চোখ যা দেখে": a small second view in a corner of the stage, from the eye itself, toward the tree. It shows what the
// student is asked to imagine: the tree on the sand and, below it, its upside-down copy over a pale sheet of "water".
// The same scene drawn a second time, by a camera at the eye, into a scissor rectangle of the same canvas after the
// main frame (no second canvas, no render target). Things only the main view should show (the eye itself, the
// layers' pane, edge-on from here) are on layer 1, which this camera leaves out. The shadow map is not drawn again.
import * as THREE from 'three';
import { EYE, TREE } from './optics.js';

/** Layer 1: drawn only by the main camera. */
export const MAIN_ONLY = 1;

/**
 * @param {{ stage: any, host: HTMLElement, caption: string, before?: () => void, after?: () => void }} o
 * host: the element the inset's frame (a border and its caption) is drawn in, over the canvas; before / after: called
 * round the inset's draw (to change how something looks from the eye).
 */
export function createInset({ stage, host, caption, before = () => {}, after = () => {} }) {
  const cam = new THREE.PerspectiveCamera(50, 1.4, 0.05, 60);
  cam.layers.set(0);
  const frame = document.createElement('div');
  frame.className = 'mg-inset';
  frame.hidden = true;
  frame.innerHTML = `<span class="mg-inset-cap">${caption}</span>`;
  host.appendChild(frame);

  /** The rectangle (canvas pixels, from the top left), or null while hidden. */
  const rect = { left: 0, top: 0, width: 0, height: 0 };
  let on = false;
  const look = new THREE.Vector3();
  const vp = new THREE.Vector4();
  const sc = new THREE.Vector4();

  /**
   * Where the inset goes for this stage size: about 36 % of the width, bottom left, just above the corner note. That corner
   * is free in the image's frame: the eye sits higher on the left, the tree and its image on the right, and the eye's dashed
   * line runs above it. Null: no room.
   */
  function place(width, height) {
    if (height < 240 || width < 300) return null;
    // no higher than 64 % down the stage: the strip, the eye's foot and its drag disc stay clear above it
    const h = Math.round(Math.min(width * 0.36 * 0.72, height * 0.36 - 30));
    const w = Math.round(h / 0.72);
    return { left: 8, top: height - h - 30, width: w, height: h };
  }

  /**
   * show: whether it is on; eyeX: the eye's place; imageY: where the image of the treetop is (for the view to reach
   * it), or null when there is none.
   */
  function set(show, eyeX, imageY) {
    const r = show ? place(stage.width, stage.height) : null;
    on = Boolean(r);
    if (frame.hidden === on) frame.hidden = !on;
    if (!r) return;
    Object.assign(rect, r);
    const st = frame.style;
    const px = (v) => `${v}px`;
    if (st.left !== px(r.left)) st.left = px(r.left);
    if (st.top !== px(r.top)) st.top = px(r.top);
    if (st.width !== px(r.width)) st.width = px(r.width);
    if (st.height !== px(r.height)) st.height = px(r.height);
    // the camera at the eye, looking at the tree: from a little above its top to below the image of its top
    const D = Math.max(0.3, TREE.x - eyeX);
    const up = Math.atan2(TREE.topY + 0.32 - EYE.y, D);
    const down = Math.atan2(EYE.y - (imageY ?? -1.35) + 0.2, D);
    const pitch = (up - down) / 2;
    cam.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(up + down) * 1.08, 20, 85);
    cam.aspect = r.width / r.height;
    cam.position.set(eyeX + 0.02, EYE.y, 0);
    look.set(eyeX + 1, EYE.y + Math.tan(pitch), 0);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  /** Draws the inset over the frame just drawn (called after the stage's render). */
  function draw() {
    if (!on) return;
    const r = stage.renderer;
    r.getViewport(vp);
    r.getScissor(sc);
    const test = r.getScissorTest();
    const auto = r.autoClear;
    const y = stage.height - rect.top - rect.height; // from the bottom
    r.setViewport(rect.left, y, rect.width, rect.height);
    r.setScissor(rect.left, y, rect.width, rect.height);
    r.setScissorTest(true);
    r.autoClear = false;
    r.clear(true, true, false);
    before();
    r.render(stage.scene, cam);
    after();
    r.setScissorTest(test);
    r.setScissor(sc);
    r.setViewport(vp);
    r.autoClear = auto;
  }

  /** The inset's box (canvas pixels) for avoid lists; null while hidden. */
  const box = () => (on ? { left: rect.left - 4, top: rect.top - 4, right: rect.left + rect.width + 4, bottom: rect.top + rect.height + 4 } : null);

  return {
    set,
    draw,
    box,
    place,
    rect,
    get on() {
      return on;
    },
    camera: cam,
    frame,
  };
}
