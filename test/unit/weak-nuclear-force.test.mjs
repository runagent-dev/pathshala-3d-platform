// The numbers of the weak-nuclear-force figure (book p68, topic 3.2.3): the sizes the zoom shows (an atom about
// 10⁻¹⁰ m, the force's reach 10⁻¹⁸ m, a thousand times smaller than a proton or neutron), the scale bar's power of
// ten, the β emission's timeline (a neutron becomes a proton when the electron leaves: protons 6 → 7, neutrons
// 8 → 7, charge kept), the packed nucleus, and the four forces in order, weakest first.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as wn from '../../assets/weak-nuclear-force/src/physics.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('weak nuclear force: sizes', () => {
  it('uses the book value for the reach, 10⁻¹⁸ m, which is 0.001 fm', () => {
    assert.equal(wn.SIZE.reach, 1e-18);
    close(wn.REACH_R, 0.001, 1e-12);
  });
  it('a proton or neutron is about a thousand times bigger than the reach', () => {
    assert.equal(wn.powersBetween(wn.SIZE.nucleon, wn.SIZE.reach), 3);
  });
  it('an atom is about 10⁻¹⁰ m across, a hundred million times the reach', () => {
    close(wn.ATOM_R * 2 * wn.FM, wn.SIZE.atom, 1e-20);
    assert.equal(wn.powersBetween(wn.SIZE.atom, wn.SIZE.reach), 8);
  });
  it('the zoom stops go inward: atom, nucleus, the reach (each shows what must fit)', () => {
    assert.deepEqual(wn.STOP_IDS, ['atom', 'nucleus', 'reach']);
    assert.ok(wn.STOPS.atom > wn.ATOM_R * 1.1, 'the whole atom fits');
    assert.ok(wn.STOPS.nucleus > 3 && wn.STOPS.nucleus < 6, 'the nucleus (about 3 fm in radius) fits');
    assert.ok(wn.STOPS.reach > wn.REACH_R && wn.STOPS.reach < 2 * wn.REACH_R, 'the reach fills the view');
    assert.ok(wn.zoomOf('atom') > wn.zoomOf('nucleus') && wn.zoomOf('nucleus') > wn.zoomOf('reach'));
  });
  it('looks at the changing neutron only on the way into it', () => {
    assert.equal(wn.focusWeight(wn.zoomOf('atom')), 0);
    assert.equal(wn.focusWeight(wn.zoomOf('nucleus')), 0);
    assert.equal(wn.focusWeight(wn.zoomOf('reach')), 1);
    let last = 0;
    for (let z = wn.zoomOf('nucleus'); z >= wn.zoomOf('reach'); z -= 0.1) {
      const w = wn.focusWeight(z);
      assert.ok(w >= last - 1e-12, 'never turns back');
      last = w;
    }
  });
});

describe('weak nuclear force: the scale bar', () => {
  it('picks the longest power of ten that fits, in metres', () => {
    // 40 px per fm, room for 170 px: 10 fm would be 400 px, so 1 fm = 10⁻¹⁵ m, 40 px long
    assert.deepEqual(wn.scaleBar(40, 170), { exp: -15, px: 40 });
    // inside the neutron: 100 000 px per fm, room for 240 px: 0.001 fm = 10⁻¹⁸ m, 100 px long
    const r = wn.scaleBar(100000, 240);
    assert.equal(r.exp, -18);
    close(r.px, 100, 1e-6);
  });
  it('is never longer than the room, and at least a tenth of it', () => {
    for (const ppf of [0.0021, 0.37, 3, 29.5, 812, 64000, 2e5]) {
      const { exp, px } = wn.scaleBar(ppf, 200);
      assert.ok(px <= 200 + 1e-9 && px > 20 - 1e-9, `${ppf}: ${px}`);
      close(px, 10 ** (exp + 15) * ppf, 1e-6 * px);
    }
  });
  it('gives nothing for a view with no size', () => {
    assert.deepEqual(wn.scaleBar(0, 200), { exp: 0, px: 0 });
  });
});

describe('weak nuclear force: the β emission', () => {
  it('starts with the radioactive nucleus as it is', () => {
    const b = wn.betaAt(0);
    assert.equal(b.phase, 'change');
    assert.deepEqual([b.protons, b.neutrons, b.emitted, b.electron], [6, 8, 0, null]);
  });
  it('a neutron becomes a proton when the electron leaves (charge 0 = +1 − 1)', () => {
    const b = wn.betaAt(wn.BETA.emit + 0.01);
    assert.equal(b.phase, 'fly');
    assert.deepEqual([b.protons, b.neutrons, b.emitted], [7, 7, 1]);
    assert.equal(b.protons + b.neutrons, 14, 'as many nucleons as before');
    assert.equal(b.protons - b.emitted, wn.NUCLEUS.protons, 'the total charge is the same');
  });
  it('the electron flies out in a straight line at a steady speed, as far as the figure asks', () => {
    const [f0, f1] = wn.BETA.fly;
    const d1 = wn.betaAt(f0 + 0.5).electron;
    const d2 = wn.betaAt(f0 + 1).electron;
    close(d2, 2 * d1, 1e-9);
    close(wn.betaAt(f1).electron, wn.BETA.distance);
    close(wn.betaAt(f1, 3.3).electron, 3.3); // the figure makes it stop inside the view
    close(wn.betaAt(wn.BETA.duration + 5, 3.3).electron, 3.3, 1e-9); // and it stays there
    assert.equal(wn.betaAt(f0 + 1, 3.3).travel, 0.5);
  });
  it('"+" and "−" appear together: the colour change starts when the electron is made', () => {
    assert.equal(wn.BETA.change[0], wn.BETA.emit);
    const before = wn.betaAt(wn.BETA.emit - 0.01);
    assert.equal(before.change, 0);
    assert.equal(before.electron, null);
  });
  it('the spark is brightest in the middle, gone at the end; the colour change is complete', () => {
    const [s0, s1] = wn.BETA.spark;
    close(wn.betaAt((s0 + s1) / 2).spark, 1);
    assert.equal(wn.betaAt(s1 + 0.1).spark, 0);
    assert.equal(wn.betaAt(wn.BETA.change[1]).change, 1);
    assert.equal(wn.betaAt(wn.BETA.duration).phase, 'done');
  });
});

describe('weak nuclear force: the zoom', () => {
  it('goes from one stop to the other, never back', () => {
    const z0 = wn.zoomOf('nucleus');
    const z1 = wn.zoomOf('reach');
    const path = wn.zoomPath(z0, z1);
    close(path.at(0), z0, 1e-9);
    close(path.at(1), z1, 1e-9);
    let last = z0;
    for (let k = 0.02; k <= 1; k += 0.02) {
      const z = path.at(k);
      assert.ok(z <= last + 1e-9, 'inward all the way');
      last = z;
    }
  });
  it('spends about a second on each power of ten inside the neutron, and hurries outside it', () => {
    const path = wn.zoomPath(wn.zoomOf('nucleus'), wn.zoomOf('reach'));
    const inside = -wn.zoomOf('reach'); // decades below a view of 1 fm
    assert.ok(path.duration > inside * wn.ZOOM_PACE.inside, `${path.duration} s`);
    // the share of the time spent inside the neutron is much bigger than its share of the zoom
    let k = 0;
    while (path.at(k) > 0) k += 0.001;
    assert.ok(1 - k > 0.85, `inside the neutron for ${(1 - k).toFixed(2)} of the time`);
    const out = wn.zoomPath(wn.zoomOf('atom'), wn.zoomOf('nucleus'));
    assert.ok(out.duration < 2.5, `atom → nucleus in ${out.duration} s`);
  });
  it('draws the nucleus bigger in a short, wide view, and only the nucleus', () => {
    assert.ok(wn.zoomFor('nucleus', 3) < wn.zoomFor('nucleus', 1));
    assert.equal(wn.zoomFor('reach', 3), wn.zoomOf('reach'));
    assert.equal(wn.zoomFor('atom', 3), wn.zoomOf('atom'));
    assert.equal(wn.focusWeight(wn.zoomFor('nucleus', 3), wn.zoomFor('nucleus', 3)), 0);
  });
});

describe('weak nuclear force: the nucleus and the four forces', () => {
  it('packs 14 nucleons into a ball about as big as a real carbon-14 nucleus', () => {
    const pts = wn.packNucleons(14, wn.NUCLEON_R);
    assert.equal(pts.length, 14);
    const R = wn.clusterRadius(pts, wn.NUCLEON_R);
    assert.ok(R > 2.4 && R < 3.4, `radius ${R} fm (1.2 × 14^(1/3) ≈ 2.9 fm)`);
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
        assert.ok(d > 1.8 * wn.NUCLEON_R, 'touching, hardly overlapping');
      }
  });
  it('is the same every time (no randomness in the model)', () => {
    assert.deepEqual(wn.packNucleons(14, wn.NUCLEON_R), wn.packNucleons(14, wn.NUCLEON_R));
  });
  it('orders the forces weakest first, with the shared colours and ranges', () => {
    assert.deepEqual(
      wn.FORCES.map((f) => f.id),
      ['gravity', 'weak', 'em', 'strong'],
    );
    const weak = wn.FORCES.find((f) => f.id === 'weak');
    assert.equal(weak.color, '#2b8a3e');
    assert.equal(weak.range, -18);
    assert.equal(wn.FORCES.find((f) => f.id === 'strong').range, -15);
    assert.equal(wn.FORCES.find((f) => f.id === 'gravity').range, null);
  });
});
