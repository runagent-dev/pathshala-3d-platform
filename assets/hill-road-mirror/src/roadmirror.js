// The roadside mirror and how it reflects.
//
// What a driver sees in it is exact. The face has a true shader: at each pixel the ray from the viewer is reflected off the
// true surface (a flat face, or a sphere of radius ρ), and looked up in a small picture of the road, taken from the point
// those rays start at: for the plane mirror the eye's own image behind the mirror, so that every ray of the picture is
// a true ray and nothing has to be guessed; for the convex mirror the centre of the mirror, with the rays followed to the
// plane of the other vehicle first (the rays start up to 0.8 m apart: that small offset is put right for what is at the
// vehicle's distance). The picture is drawn only when something it shows has moved.
//
// From anywhere else (the student's own view from above) the rays leave the picture: there the face shows the soft sky
// and ground it would, so that it reads as a mirror. No extra mesh, no mirrored copy of the scene.
import * as THREE from 'three';
import { MIRROR, NORMAL } from './reading.js';

const FACE_VS = /* glsl */ `
  uniform float uRho;
  varying vec3 vW; varying vec2 vL;
  void main() {
    vec3 p = position;
    vL = p.xy;
    if (uRho > 0.0) p.z = sqrt(uRho * uRho - dot(p.xy, p.xy)) - uRho; // the bulge
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const FACE_FS = /* glsl */ `
  uniform sampler2D tRefl; uniform mat4 uVP; uniform float uRho; uniform float uRadius;
  uniform vec3 uRight; uniform vec3 uUp; uniform vec3 uOut; uniform vec3 uProxy; uniform vec3 uAim; uniform float uTraced;
  varying vec3 vW; varying vec2 vL;
  void main() {
    vec3 N = uOut;
    if (uRho > 0.0) N = normalize(uRight * vL.x + uUp * vL.y + uOut * sqrt(uRho * uRho - dot(vL, vL)));
    vec3 V = normalize(vW - cameraPosition);
    vec3 R = reflect(V, N);
    // the soft world the face shows from far away
    vec3 c = mix(vec3(0.52, 0.56, 0.60), vec3(0.92, 0.98, 1.0), smoothstep(-0.8, 0.15, R.y + (vL.y * 0.42 - vL.x * 0.16) / uRadius));
    float along = dot(R, uAim);
    if (uTraced > 0.5 && along > 0.05) {
      vec3 H = vW + R * (dot(uProxy - vW, uAim) / along);
      vec4 q = uVP * vec4(H, 1.0);
      vec2 uv = q.xy / q.w * 0.5 + 0.5;
      vec2 e = abs(uv - 0.5);
      if (q.w > 0.0 && e.x < 0.5 && e.y < 0.5) {
        vec3 t = texture2D(tRefl, uv).rgb;
        float k = smoothstep(0.5, 0.485, max(e.x, e.y));
        c = mix(c, t, k);
      }
    }
    // silvered glass gives back a little less than all the light; the edge of the glass is darker
    c *= 0.93 - 0.2 * smoothstep(0.93, 1.0, length(vL) / uRadius);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createMirror({ stage }) {
  const { scene, renderer } = stage;
  const group = new THREE.Group();
  group.name = 'mirror';
  // local axes: +z out of the face, +x to the right as you look at it from the road, +y up
  const standing = new THREE.Group();
  standing.position.set(MIRROR.x, 0, MIRROR.z);
  group.add(standing);
  const head = new THREE.Group();
  head.position.y = MIRROR.y;
  head.rotation.y = Math.atan2(NORMAL.x, NORMAL.z);
  standing.add(head);
  scene.add(group);

  const r = MIRROR.radius;
  const canFloat = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  // one small picture of the road for each kind of mirror: the convex step shows both at once
  const picture = () => {
    const rt = new THREE.WebGLRenderTarget(512, 512, {
      type: canFloat ? THREE.HalfFloatType : THREE.UnsignedByteType,
      depthBuffer: true,
      samples: 0,
    });
    rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
    rt.texture.generateMipmaps = true;
    return { rt, vp: new THREE.Matrix4(), stale: true };
  };
  const pics = { plane: picture(), convex: picture() };
  const out = new THREE.Vector3(NORMAL.x, NORMAL.y, NORMAL.z);
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, out).normalize();
  const uniforms = {
    tRefl: { value: pics.plane.rt.texture },
    uVP: { value: new THREE.Matrix4() },
    uRho: { value: 0 },
    uRadius: { value: r },
    uRight: { value: right },
    uUp: { value: up },
    uOut: { value: out },
    uProxy: { value: new THREE.Vector3() },
    uAim: { value: new THREE.Vector3(1, 0, 0) },
    uTraced: { value: 0 },
  };
  const faceMat = new THREE.ShaderMaterial({ vertexShader: FACE_VS, fragmentShader: FACE_FS, uniforms });
  // rings of vertices, for the bulge
  const face = new THREE.Mesh(new THREE.RingGeometry(0.001, r, 48, 6), faceMat);
  face.name = 'mirror-face';
  face.userData.noExport = true;
  head.add(face);

  const orange = new THREE.MeshStandardMaterial({ color: '#ee5f12', roughness: 0.5, metalness: 0.05 });
  const steel = new THREE.MeshStandardMaterial({ color: '#8d959c', roughness: 0.42, metalness: 0.8 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#b0aba3', roughness: 0.95 });
  // the rim, with the hood over the top that keeps the rain off
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.012, 0.038, 10, 56), orange);
  rim.name = 'mirror-rim';
  head.add(rim);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.13, 40, 1, true, Math.PI - 1, 2), orange.clone());
  hood.material.side = THREE.DoubleSide;
  hood.rotation.x = Math.PI / 2;
  hood.position.z = 0.06;
  hood.name = 'mirror-hood';
  head.add(hood);
  // the back: a shallow dish
  const backShape = [
    [0.02, -0.1],
    [r * 0.6, -0.085],
    [r * 0.92, -0.05],
    [r + 0.02, -0.005],
  ].map(([a, b]) => new THREE.Vector2(a, b));
  const back = new THREE.Mesh(
    new THREE.LatheGeometry(backShape, 40),
    new THREE.MeshStandardMaterial({ color: '#3b4046', roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide }),
  );
  back.rotation.x = Math.PI / 2;
  back.name = 'mirror-back';
  head.add(back);
  // the pole, the bracket, the block it stands in
  const poleGeo = new THREE.CylinderGeometry(0.055, 0.065, MIRROR.y + 0.4, 12);
  const pole = new THREE.Mesh(poleGeo, steel);
  pole.position.set(0, (MIRROR.y + 0.4) / 2, 0);
  pole.position.addScaledVector(out, -0.2);
  pole.name = 'mirror-pole';
  standing.add(pole);
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), steel);
  bracket.rotation.x = Math.PI / 2;
  bracket.position.z = -0.14;
  head.add(bracket);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.34, 0.7), concrete);
  foot.position.set(0, 0.05, 0);
  foot.position.addScaledVector(out, -0.2);
  foot.rotation.y = head.rotation.y;
  foot.name = 'mirror-footing';
  standing.add(foot);

  // ── the picture of the road ─────────────────────────────────────────────────────────────────────────────────
  const shot = new THREE.PerspectiveCamera(40, 1, 0.3, 6000);
  let plan = null;
  const tmp = new THREE.Vector3();
  const image = new THREE.Vector3();
  function draw(kind, hide, before) {
    const pic = pics[kind];
    pic.stale = false;
    const { eye, aim } = plan;
    const centre = tmp.set(MIRROR.x, MIRROR.y, MIRROR.z);
    if (kind === 'convex') {
      shot.position.copy(centre);
      shot.fov = 66;
      shot.near = 0.3;
      shot.lookAt(centre.x + aim.x, centre.y + aim.y, centre.z + aim.z);
    } else {
      // the eye's image in the mirror: every ray the eye gets from the mirror starts here
      const d = (eye.x - centre.x) * out.x + (eye.y - centre.y) * out.y + (eye.z - centre.z) * out.z;
      image.set(eye.x - 2 * d * out.x, eye.y - 2 * d * out.y, eye.z - 2 * d * out.z);
      shot.position.copy(image);
      const dist = image.distanceTo(centre);
      shot.fov = 2 * THREE.MathUtils.radToDeg(Math.atan((r * 1.04) / dist));
      shot.near = Math.max(0.3, dist - r);
      shot.lookAt(centre);
    }
    shot.updateProjectionMatrix();
    shot.updateMatrixWorld(true);
    pic.vp.multiplyMatrices(shot.projectionMatrix, shot.matrixWorldInverse);
    before?.(shot);
    const was = hide.map((o) => o.visible);
    hide.forEach((o) => {
      o.visible = false;
    });
    renderer.setRenderTarget(pic.rt);
    renderer.clear();
    renderer.render(scene, shot);
    hide.forEach((o, i) => {
      o.visible = was[i];
    });
  }

  return {
    group,
    standing,
    face,
    /** The wrongly set mirror of the test: degrees off 45° (the ray tracing uses reading.js with the same yaw). */
    setYaw(a) {
      head.rotation.y = Math.atan2(NORMAL.x, NORMAL.z) + THREE.MathUtils.degToRad(a);
    },
    /** How far it has risen, 0 … 1. */
    setRise(k) {
      standing.position.y = (k - 1) * (MIRROR.y + 1.2);
      group.visible = k > 0;
    },
    /**
     * Whose eye the pictures are for: eye {x,y,z}; aim (unit, level): the way the reflected ray runs from the mirror's
     * centre; proxy: the other vehicle, rays are followed to the plane through it.
     */
    aim(eye, aim, proxy) {
      plan = { eye, aim, proxy };
      pics.plane.stale = pics.convex.stale = true;
    },
    /** Draw the pictures of these kinds that are out of date. hide: what the mirror must not see (its driver's vehicle). */
    update(kinds, hide, before) {
      if (!plan || !group.visible) return;
      const todo = kinds.filter((k) => pics[k].stale);
      if (!todo.length) return;
      const target = renderer.getRenderTarget();
      group.visible = false;
      for (const k of todo) draw(k, hide, before);
      group.visible = true;
      renderer.setRenderTarget(target);
    },
    /** Make the face that kind of mirror for the views drawn next: traced for a driver's eye, a soft sheen otherwise. */
    show(kind, traced = false) {
      const pic = pics[kind];
      uniforms.uTraced.value = traced ? 1 : 0;
      uniforms.uRho.value = kind === 'convex' ? MIRROR.rho : 0;
      uniforms.tRefl.value = pic.rt.texture;
      uniforms.uVP.value.copy(pic.vp);
      if (plan) {
        uniforms.uAim.value.set(plan.aim.x, plan.aim.y, plan.aim.z);
        uniforms.uProxy.value.set(plan.proxy.x, plan.proxy.y, plan.proxy.z);
      }
    },
    /** The mirror as a model for the GLB: the face as polished metal. */
    exportModel() {
      const g = group.clone(true);
      g.name = 'road-mirror';
      g.position.set(0, 0, 0);
      g.children[0].position.y = 0;
      g.traverse((o) => {
        if (o.name === 'mirror-face') {
          o.userData.noExport = false;
          o.material = new THREE.MeshStandardMaterial({ color: '#dfe6ec', metalness: 1, roughness: 0.04 });
        }
      });
      return g;
    },
  };
}
