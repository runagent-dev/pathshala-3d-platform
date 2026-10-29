// What a motion leaves behind, in metres: faint pictures of the object at equal time steps (like a strobe photo),
// a dotted path, the dashed straight line it is checked against (সরল রেখা), and for a curved path a bracket at
// its widest gap from that line. Plus the push arrow (ধাক্কা). Colours carry meaning: path blue, straight line
// green, gap purple, push orange (the same as in style.css).
import * as THREE from 'three';

export const COLORS = { path: '#1c6fd9', rim: '#0d3f86', line: '#12924f', gap: '#6741d9', push: '#d9480f', option: '#3f4954', faded: '#9aa3ad' };

const DASH = 0.018; // dash and gap of the straight line
const GAP = 0.012;
const OVERHANG = 0.05; // the straight line runs on a little past both ends, like a line drawn with a ruler

const up = new THREE.Vector3(0, 1, 0);
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();
const tmpD = new THREE.Vector3();

/** One thin cylinder from a to b, as an instance matrix (radius is set by the geometry). */
function segmentMatrix(a, b, out) {
  tmpD.subVectors(b, a);
  const len = tmpD.length();
  tmpP.addVectors(a, b).multiplyScalar(0.5);
  tmpQ.setFromUnitVectors(up, len > 1e-9 ? tmpD.divideScalar(len) : up);
  tmpS.set(1, Math.max(len, 1e-6), 1);
  return out.compose(tmpP, tmpQ, tmpS);
}

/**
 * The marks of one motion. ghostGeometry: the object's shape, centred (each picture is placed at the object's
 * centre, with a darker outline so it reads on the light board). lineLift raises the straight line above the
 * path (on top of a flat object's pictures). Call set(path) once per motion, then show(t) as it moves and line(k)
 * to draw the straight line; faded(true) greys it all (another example's marks, kept for comparison).
 */
export function createTrace({
  name,
  ghostGeometry,
  maxGhosts = 16,
  maxDots = 220,
  dotRadius = 0.0026,
  lineRadius = 0.0034,
  lineLift = 0,
  color = COLORS.path,
}) {
  const group = new THREE.Group();
  group.name = name;

  // faint pictures with a darker edge (it darkens where the surface turns away from the eye), so they read on the
  // light board and against each other; still a standard material, so the GLB keeps them
  const inAir = name !== 'PushTrace';
  const sceneColor = inAir ? '#70dfff' : color;
  const sceneLine = inAir ? '#63ec9e' : COLORS.line;
  const rim = { rimColor: { value: new THREE.Color(inAir ? '#4bb5e8' : COLORS.rim) }, rimStrength: { value: 1 } };
  const ghostMat = new THREE.MeshStandardMaterial({
    name: `${name}Picture`,
    color: sceneColor,
    roughness: 0.5,
    transparent: true,
    opacity: inAir ? 0.55 : 0.4,
    depthWrite: false,
  });
  ghostMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, rim);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        float edge = rimStrength * pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 1.6);
        gl_FragColor = vec4(mix(gl_FragColor.rgb, rimColor, edge), mix(gl_FragColor.a, 0.92, edge));`,
      );
  };
  const ghosts = Array.from({ length: maxGhosts }, () => {
    const m = new THREE.Mesh(ghostGeometry, ghostMat);
    m.visible = false;
    m.renderOrder = 1;
    group.add(m);
    return m;
  });

  const dotMat = new THREE.MeshBasicMaterial({ name: `${name}Path`, color: sceneColor, toneMapped: false });
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(dotRadius, 8, 6), dotMat, maxDots);
  dots.count = 0;
  dots.frustumCulled = false;
  group.add(dots);

  const lineMat = new THREE.MeshBasicMaterial({ name: `${name}StraightLine`, color: sceneLine, toneMapped: false });
  const maxDashes = 80;
  const dashes = new THREE.InstancedMesh(new THREE.CylinderGeometry(lineRadius, lineRadius, 1, 8), lineMat, maxDashes);
  dashes.count = 0;
  dashes.frustumCulled = false;
  group.add(dashes);

  const gapMat = new THREE.MeshBasicMaterial({ name: `${name}Gap`, color: inAir ? '#d5b7ff' : COLORS.gap, toneMapped: false });
  const gap = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 8), gapMat, 3);
  gap.count = 0;
  gap.frustumCulled = false;
  group.add(gap);

  let path = null; // { ghosts: [{ t, p }], dots: [{ t, p }], start, end }
  const lineA = new THREE.Vector3();
  const lineB = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const side = new THREE.Vector3();
  const towardViewer = new THREE.Vector3(0, 0, 1);

  return {
    group,
    /** A new motion: ghosts [{ t, p: Vector3 }] (centres of the object), dots [{ t, p }] along the path. */
    set(next) {
      path = next;
      for (const g of ghosts) g.visible = false;
      dots.count = 0;
      dashes.count = 0;
      gap.count = 0;
      if (!path) return;
      path.dots.slice(0, maxDots).forEach((d, i) => dots.setMatrixAt(i, tmpM.makeTranslation(d.p.x, d.p.y, d.p.z)));
      dots.instanceMatrix.needsUpdate = true;
      path.ghosts.slice(0, maxGhosts).forEach((g, i) => ghosts[i].position.copy(g.p));
    },
    /** Show what the motion has left by time t (s of real time); returns the number of pictures shown. */
    show(t) {
      if (!path) return 0;
      let n = 0;
      for (let i = 0; i < ghosts.length; i++) {
        const on = i < path.ghosts.length && path.ghosts[i].t <= t + 1e-9;
        ghosts[i].visible = on;
        if (on) n++;
      }
      let d = 0;
      while (d < path.dots.length && d < maxDots && path.dots[d].t <= t + 1e-9) d++;
      dots.count = d;
      return n;
    },
    /** The dashed straight line through the path's ends, drawn to fraction k (0 hides it). */
    line(k) {
      if (!path || k <= 0) {
        dashes.count = 0;
        return;
      }
      tmpD.subVectors(path.end, path.start);
      const len = tmpD.length();
      if (len < 1e-6) return;
      tmpD.divideScalar(len);
      lineA.copy(path.start).addScaledVector(tmpD, -OVERHANG);
      lineA.y += lineLift;
      lineB.copy(path.end).addScaledVector(tmpD, OVERHANG);
      lineB.y += lineLift;
      const total = len + 2 * OVERHANG;
      const upto = total * Math.min(1, k);
      let n = 0;
      for (let s = 0; s < upto && n < maxDashes; s += DASH + GAP) {
        a.copy(lineA).addScaledVector(tmpD, s);
        b.copy(lineA).addScaledVector(tmpD, Math.min(s + DASH, upto));
        dashes.setMatrixAt(n++, segmentMatrix(a, b, tmpM));
      }
      dashes.count = n;
      dashes.instanceMatrix.needsUpdate = true;
    },
    /** A bracket from p (on the path) to its foot on the straight line, with short caps; null hides it. */
    gap(p, foot) {
      if (!p) {
        gap.count = 0;
        return;
      }
      gap.setMatrixAt(0, segmentMatrix(p, foot, tmpM));
      // short caps across the bracket at both ends (segmentMatrix uses the shared temporaries, so keep our own)
      side.subVectors(p, foot).normalize();
      side.crossVectors(towardViewer, side).normalize().multiplyScalar(0.012);
      for (const [i, q] of [
        [1, p],
        [2, foot],
      ]) {
        a.copy(q).add(side);
        b.copy(q).sub(side);
        gap.setMatrixAt(i, segmentMatrix(a, b, tmpM));
      }
      gap.count = 3;
      gap.instanceMatrix.needsUpdate = true;
    },
    /** Greyed and faint (true) or in the meaning colours (false). */
    faded(on) {
      ghostMat.color.set(on ? COLORS.faded : sceneColor);
      ghostMat.opacity = on ? 0.2 : inAir ? 0.55 : 0.4;
      rim.rimColor.value.set(on ? COLORS.faded : inAir ? '#4bb5e8' : COLORS.rim);
      rim.rimStrength.value = on ? 0.5 : 1;
      dotMat.color.set(on ? COLORS.faded : sceneColor);
      lineMat.color.set(on ? COLORS.faded : sceneLine);
    },
    get path() {
      return path;
    },
    clear() {
      this.set(null);
    },
  };
}

/** A 3D arrow (shaft and head) for a push; set(from, dir, length) points it, visible = false hides it. */
export function createArrow({ color = COLORS.push, radius = 0.007 } = {}) {
  const group = new THREE.Group();
  group.name = 'PushArrow';
  const mat = new THREE.MeshStandardMaterial({ name: 'Push', color, roughness: 0.45, emissive: color, emissiveIntensity: 0.25 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), mat);
  const headLen = radius * 5.5;
  const head = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.5, headLen, 18), mat);
  group.add(shaft, head);
  group.visible = false;
  const tip = new THREE.Vector3();
  return {
    group,
    tip,
    /** From a point, along a unit direction, `length` m long in all (head included). */
    set(from, dir, length) {
      const L = Math.max(length, headLen * 1.2);
      group.position.copy(from);
      group.quaternion.setFromUnitVectors(up, dir);
      shaft.scale.y = L - headLen;
      shaft.position.y = (L - headLen) / 2;
      head.position.y = L - headLen / 2;
      tip.copy(from).addScaledVector(dir, L);
      group.visible = true;
    },
    hide() {
      group.visible = false;
    },
  };
}

/** A dotted candidate path for the test (grey), from points { x, z } at height y. */
export function createOptionPath({ maxDots = 60, radius = 0.0042 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ name: 'OptionPath', color: COLORS.option, toneMapped: false, transparent: true, opacity: 1 });
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 8, 6), mat, maxDots);
  dots.count = 0;
  dots.frustumCulled = false;
  return {
    mesh: dots,
    material: mat,
    set(points, y) {
      const step = Math.max(1, Math.floor(points.length / maxDots));
      let n = 0;
      for (let i = 0; i < points.length && n < maxDots; i += step) dots.setMatrixAt(n++, tmpM.makeTranslation(points[i].x, y, points[i].z));
      dots.count = n;
      dots.instanceMatrix.needsUpdate = true;
    },
  };
}
